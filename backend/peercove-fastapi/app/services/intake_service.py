from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from app.core.database import get_db
from app.core.security import encrypt_content, decrypt_content
from app.models.intake import IntakeSession, IntakeResponse
from app.schemas.intake import IntakeCreate, IntakeResponseCreate
from app.services.base import BaseService
from datetime import datetime
import uuid


class IntakeService(BaseService):
    async def list_intakes(self, user_id: str) -> list[dict]:
        stmt = select(IntakeSession).where(IntakeSession.member_id == user_id).order_by(desc(IntakeSession.created_at))
        result = await self.db.execute(stmt)
        intakes = result.scalars().all()
        return [
            {
                "id": str(i.id),
                "channel": i.channel,
                "status": i.status,
                "locale": i.locale,
                "started_at": i.started_at.isoformat(),
                "completed_at": i.completed_at.isoformat() if i.completed_at else None,
                "created_at": i.created_at.isoformat()
            }
            for i in intakes
        ]

    async def create_intake(self, user_id: str, payload: IntakeCreate) -> dict:
        db_channel = "voice" if payload.channel in ["voice", "phone", "audio"] else "text"

        intake = IntakeSession(
            id=uuid.uuid4(),
            member_id=user_id,
            channel=db_channel,
            status="in_progress",
            locale=payload.locale,
            started_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(intake)
        await self.db.commit()
        await self.db.refresh(intake)

        return {
            "id": str(intake.id),
            "member_id": intake.member_id,
            "channel": intake.channel,
            "status": intake.status,
            "started_at": intake.started_at.isoformat()
        }

    async def add_response_direct(self, user_id: str, payload: dict) -> dict:
        raw_id = payload.get("intake_id") or payload.get("session_id")
        if not raw_id:
            raise HTTPException(status_code=400, detail="Missing intake_id or session_id")
        try:
            i_uuid = uuid.UUID(str(raw_id))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid UUID format")
        q_key = payload.get("question_id") or payload.get("question_key") or "general"
        resp_text = payload.get("response") or payload.get("response_text") or ""

        count_stmt = select(func.count(IntakeResponse.id)).where(IntakeResponse.intake_id == i_uuid)
        count_res = await self.db.execute(count_stmt)
        seq = (count_res.scalar() or 0) + 1

        ct, kv = encrypt_content(resp_text)
        resp = IntakeResponse(
            id=uuid.uuid4(),
            intake_id=i_uuid,
            sequence_no=seq,
            topic_code=q_key,
            response_state="answered",
            source_type="member",
            content_ciphertext=ct,
            key_version=kv,
            created_at=datetime.utcnow()
        )
        self.db.add(resp)
        await self.db.commit()
        return {"status": "success", "question_id": q_key, "sequence_no": seq}

    async def get_intake(self, intake_id: str, user_id: str) -> dict:
        try:
            session_uuid = uuid.UUID(str(intake_id))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid UUID format")
        stmt = select(IntakeSession).where(
            IntakeSession.id == session_uuid,
            IntakeSession.member_id == user_id
        )
        res = await self.db.execute(stmt)
        intake = res.scalar_one_or_none()
        if not intake:
            raise HTTPException(status_code=404, detail="Intake session not found")
        
        return {
            "id": str(intake.id),
            "channel": intake.channel,
            "status": intake.status,
            "started_at": intake.started_at.isoformat(),
            "completed_at": intake.completed_at.isoformat() if intake.completed_at else None
        }

    async def add_response(self, intake_id: str, payload: IntakeResponseCreate, user_id: str) -> dict:
        try:
            i_uuid = uuid.UUID(str(intake_id))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid UUID format")
        count_stmt = select(func.count(IntakeResponse.id)).where(IntakeResponse.intake_id == i_uuid)
        count_res = await self.db.execute(count_stmt)
        seq = (count_res.scalar() or 0) + 1

        ct, kv = encrypt_content(payload.response)
        resp = IntakeResponse(
            id=uuid.uuid4(),
            intake_id=i_uuid,
            sequence_no=seq,
            topic_code=payload.question_id,
            response_state="answered",
            source_type="member",
            content_ciphertext=ct,
            key_version=kv,
            created_at=datetime.utcnow()
        )
        self.db.add(resp)
        await self.db.commit()

        return {"status": "success", "question_id": payload.question_id, "sequence_no": seq}

    async def get_responses(self, intake_id: str, user_id: str) -> list[dict]:
        try:
            session_uuid = uuid.UUID(str(intake_id))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid UUID format")
        stmt = select(IntakeResponse).where(
            IntakeResponse.intake_id == session_uuid
        ).order_by(IntakeResponse.sequence_no)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "question_id": r.topic_code or f"q_{r.sequence_no}",
                "response": decrypt_content(r.content_ciphertext, r.key_version) if r.content_ciphertext else None,
                "created_at": r.created_at.isoformat()
            }
            for r in items
        ]


def get_intake_service(db: AsyncSession = Depends(get_db)) -> IntakeService:
    return IntakeService(db)
