from fastapi import APIRouter, Depends, Query
from typing import List

from app.schemas.supervisor import (
    SupervisorResponse,
    SupervisorCreatedResponse,
    SupervisorCreateRequest,
    SupervisorUpdateRequest,
    SupervisorSearchRequest,
    SupervisorStatsResponse,
    SupervisorStatsUpdateRequest,
)
from app.services.supervisor_service import SupervisorService, get_supervisor_service

router = APIRouter(prefix="/api/v1/supervisors", tags=["supervisors"])


# ─── Operational Supervision Pod Endpoints (US-031) ──────────────────────────

@router.get("/pod/listeners")
async def get_pod_listeners(
    service: SupervisorService = Depends(get_supervisor_service),
):
    """Retrieve listeners under supervision with live readiness, capacity and open conversations"""
    return await service.get_pod_listeners()


@router.put("/pod/listeners/{id}/eligibility")
async def update_listener_eligibility(
    id: str,
    payload: dict,
    service: SupervisorService = Depends(get_supervisor_service),
):
    """Update a listener's operational eligibility in PostgreSQL (US-031)"""
    return await service.update_listener_eligibility(id, payload)


@router.get("/pod/conduct-reports")
async def get_conduct_reports(
    service: SupervisorService = Depends(get_supervisor_service),
):
    """Retrieve all conduct & boundary concern reports from PostgreSQL (US-031)"""
    return await service.get_conduct_reports()


@router.put("/pod/conduct-reports/{id}/resolve")
async def resolve_conduct_report(
    id: str,
    payload: dict,
    service: SupervisorService = Depends(get_supervisor_service),
):
    """Supervisor resolves a conduct/boundary report in PostgreSQL (US-031)"""
    return await service.resolve_conduct_report(id, payload)


@router.get("/pod/training-reviews")
async def get_training_reviews(
    service: SupervisorService = Depends(get_supervisor_service),
):
    """Retrieve pending listener training and CEU verifications (US-018 / US-031)"""
    return await service.get_training_reviews()


@router.put("/pod/training-reviews/{id}/verify")
async def verify_training_review(
    id: str,
    payload: dict,
    service: SupervisorService = Depends(get_supervisor_service),
):
    """Supervisor verifies & signs off listener training module in PostgreSQL"""
    return await service.verify_training_review(id, payload)


# ─── SUPERVISOR CRUD ────────────────────────────────────────────────────────

@router.get("/health", tags=["health"])
async def supervisor_health_check(service: SupervisorService = Depends(get_supervisor_service)):
    """Health check endpoint for supervisor module"""
    return await service.check_health()


@router.get("/{id}", response_model=SupervisorResponse)
async def get_supervisor_by_id(id: str, service: SupervisorService = Depends(get_supervisor_service)):
    """Fetch supervisor by ID with stats"""
    supervisor = await service.get_by_id(id)
    return SupervisorResponse.model_validate(supervisor)


@router.get("/{id}/stats", response_model=SupervisorStatsResponse)
async def get_supervisor_stats(id: str, service: SupervisorService = Depends(get_supervisor_service)):
    """Fetch supervisor statistics"""
    stats = await service.get_stats(id)
    return SupervisorStatsResponse.model_validate(stats)


@router.get("", response_model=List[SupervisorResponse])
async def list_supervisors(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    service: SupervisorService = Depends(get_supervisor_service),
):
    """List all supervisors with pagination"""
    supervisors = await service.list_supervisors(limit, offset)
    return [SupervisorResponse.model_validate(supervisor) for supervisor in supervisors]


@router.post("/search", response_model=List[SupervisorResponse])
async def search_supervisors(search: SupervisorSearchRequest, service: SupervisorService = Depends(get_supervisor_service)):
    """Search supervisors with filters"""
    supervisors = await service.search_supervisors(search)
    return [SupervisorResponse.model_validate(supervisor) for supervisor in supervisors]


@router.post("", response_model=SupervisorCreatedResponse, status_code=201)
async def create_supervisor(supervisor: SupervisorCreateRequest, service: SupervisorService = Depends(get_supervisor_service)):
    """Create a new supervisor"""
    new_supervisor = await service.create_supervisor(supervisor)
    return SupervisorCreatedResponse.model_validate(new_supervisor)


@router.post("/{id}", response_model=SupervisorResponse)
async def update_supervisor(id: str, update: SupervisorUpdateRequest, service: SupervisorService = Depends(get_supervisor_service)):
    """Update supervisor information"""
    supervisor = await service.update_supervisor(id, update)
    return SupervisorResponse.model_validate(supervisor)


@router.post("/{id}/stats", response_model=SupervisorStatsResponse)
async def update_supervisor_stats(
    id: str,
    stats_update: SupervisorStatsUpdateRequest,
    service: SupervisorService = Depends(get_supervisor_service),
):
    """Update supervisor statistics"""
    stats = await service.update_stats(id, stats_update)
    return SupervisorStatsResponse.model_validate(stats)


@router.delete("/{id}", status_code=204)
async def delete_supervisor(id: str, service: SupervisorService = Depends(get_supervisor_service)):
    """Delete a supervisor and associated stats"""
    await service.delete_supervisor(id)
    return None
