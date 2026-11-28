"""
Transactional Outbox & Durable Workflow Router (P01-P09, US-030, US-036).
Uses existing WorkflowExecution and OutboxEvent models from app.models.operations.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.operations import OutboxEvent, WorkflowDefinition, WorkflowExecution

router = APIRouter(prefix="/api/v1", tags=["Workflows & Outbox"])


class WorkflowStartRequest(BaseModel):
    process_definition_id: str = Field(..., pattern="^P0[1-9]$")
    idempotency_key: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class OutboxPublishRequest(BaseModel):
    aggregate_type: str
    aggregate_id: str
    event_type: str
    payload_minimized: Dict[str, Any] = Field(default_factory=dict)
    idempotency_key: Optional[str] = None


@router.post("/workflows/start")
async def start_durable_workflow(
    payload: WorkflowStartRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Idempotently start or resume a versioned P01-P09 workflow execution."""
    wf_key = payload.idempotency_key or f"{payload.process_definition_id}-{user_id}-{uuid.uuid4().hex[:8]}"
    existing = await db.execute(
        select(WorkflowExecution).where(WorkflowExecution.temporal_workflow_id == wf_key)
    )
    row = existing.scalar_one_or_none()
    if row:
        return {
            "execution_id": str(row.id),
            "temporal_workflow_id": row.temporal_workflow_id,
            "status": row.status,
            "idempotent_replay": True,
        }

    # Ensure a WorkflowDefinition row exists for the process_definition_id
    def_res = await db.execute(
        select(WorkflowDefinition).where(WorkflowDefinition.code == payload.process_definition_id)
    )
    defn = def_res.scalar_one_or_none()
    if not defn:
        defn = WorkflowDefinition(
            id=uuid.uuid4(),
            code=payload.process_definition_id,
            name=f"PeerCove Process {payload.process_definition_id}",
            version="1.0",
        )
        db.add(defn)
        await db.flush()

    wf = WorkflowExecution(
        id=uuid.uuid4(),
        definition_id=defn.id,
        temporal_workflow_id=wf_key,
        subject_type="member",
        subject_id=user_id,
        status="running",
    )
    db.add(wf)
    await db.commit()
    return {
        "execution_id": str(wf.id),
        "temporal_workflow_id": wf.temporal_workflow_id,
        "status": wf.status,
        "idempotent_replay": False,
    }


@router.get("/workflows")
async def list_workflows(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(WorkflowExecution)
        .where(WorkflowExecution.subject_id == user_id)
        .order_by(WorkflowExecution.started_at.desc())
        .limit(25)
    )
    rows = res.scalars().all()
    return [
        {
            "execution_id": str(r.id),
            "temporal_workflow_id": r.temporal_workflow_id,
            "status": r.status,
            "started_at": r.started_at.isoformat() if r.started_at else None,
        }
        for r in rows
    ]


@router.post("/outbox/events")
async def enqueue_outbox_event(
    payload: OutboxPublishRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Persist a minimized outbox event atomically."""
    evt = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type=payload.aggregate_type,
        aggregate_id=payload.aggregate_id,
        event_type=payload.event_type,
        payload=payload.payload_minimized,
    )
    db.add(evt)
    await db.commit()
    return {"outbox_event_id": str(evt.id), "status": "pending"}


@router.get("/outbox/dead-letters")
async def list_dead_letter_events(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List unpublished outbox events awaiting retry or dead-letter review."""
    res = await db.execute(
        select(OutboxEvent)
        .where(OutboxEvent.published_at.is_(None))
        .order_by(OutboxEvent.created_at.desc())
        .limit(50)
    )
    return [
        {
            "id": str(e.id),
            "event_type": e.event_type,
            "aggregate_type": e.aggregate_type,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in res.scalars().all()
    ]


async def process_pending_outbox_events(db: AsyncSession) -> int:
    """Process pending outbox events and mark published timestamp."""
    res = await db.execute(
        select(OutboxEvent).where(OutboxEvent.published_at.is_(None)).limit(20)
    )
    events = res.scalars().all()
    now = datetime.now(timezone.utc)
    for evt in events:
        evt.published_at = now
    if events:
        await db.commit()
    return len(events)
