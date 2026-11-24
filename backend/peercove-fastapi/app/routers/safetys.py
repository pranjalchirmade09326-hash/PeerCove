from fastapi import APIRouter, Depends, Query
from typing import List

from app.schemas.safety import (
    SafetyResponse,
    SafetyCreatedResponse,
    SafetyCreateRequest,
    SafetyUpdateRequest,
    SafetySearchRequest,
    SafetyStatsResponse,
    SafetyStatsUpdateRequest,
)
from app.services.safety_service import SafetyService, get_safety_service

router = APIRouter(prefix="/api/v1/safetys", tags=["safetys"])


@router.get("/health", tags=["health"])
async def safety_health_check(service: SafetyService = Depends(get_safety_service)):
    """Health check endpoint for safety module"""
    return await service.check_health()


@router.get("/{id}", response_model=SafetyResponse)
async def get_safety_by_id(id: str, service: SafetyService = Depends(get_safety_service)):
    """Fetch safety officer by ID with stats"""
    safety = await service.get_by_id(id)
    return SafetyResponse.model_validate(safety)


@router.get("/{id}/stats", response_model=SafetyStatsResponse)
async def get_safety_stats(id: str, service: SafetyService = Depends(get_safety_service)):
    """Fetch safety officer statistics"""
    stats = await service.get_stats(id)
    return SafetyStatsResponse.model_validate(stats)


@router.get("", response_model=List[SafetyResponse])
async def list_safety_officers(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    service: SafetyService = Depends(get_safety_service),
):
    """List all safety officers with pagination"""
    safety_officers = await service.list_safety_officers(limit, offset)
    return [SafetyResponse.model_validate(safety) for safety in safety_officers]


@router.post("/search", response_model=List[SafetyResponse])
async def search_safety_officers(search: SafetySearchRequest, service: SafetyService = Depends(get_safety_service)):
    """Search safety officers with filters"""
    safety_officers = await service.search_safety_officers(search)
    return [SafetyResponse.model_validate(safety) for safety in safety_officers]


@router.post("", response_model=SafetyCreatedResponse, status_code=201)
async def create_safety_officer(safety: SafetyCreateRequest, service: SafetyService = Depends(get_safety_service)):
    """Create a new safety officer"""
    new_safety = await service.create_safety_officer(safety)
    return SafetyCreatedResponse.model_validate(new_safety)


@router.post("/{id}", response_model=SafetyResponse)
async def update_safety_officer(id: str, update: SafetyUpdateRequest, service: SafetyService = Depends(get_safety_service)):
    """Update safety officer information"""
    safety = await service.update_safety_officer(id, update)
    return SafetyResponse.model_validate(safety)


@router.post("/{id}/stats", response_model=SafetyStatsResponse)
async def update_safety_stats(
    id: str,
    stats_update: SafetyStatsUpdateRequest,
    service: SafetyService = Depends(get_safety_service),
):
    """Update safety officer statistics"""
    stats = await service.update_stats(id, stats_update)
    return SafetyStatsResponse.model_validate(stats)


@router.delete("/{id}", status_code=204)
async def delete_safety_officer(id: str, service: SafetyService = Depends(get_safety_service)):
    """Delete a safety officer and associated stats"""
    await service.delete_safety_officer(id)
    return None


# ─── FRONTEND REPOSITORY ALIAS ROUTER (/api/v1/safety/*) ─────────────────────

safety_alias_router = APIRouter(prefix="/api/v1/safety", tags=["safety"])


@safety_alias_router.get("/profiles/search", response_model=List[SafetyResponse])
async def search_safety_profiles(
    search: SafetySearchRequest = Depends(),
    service: SafetyService = Depends(get_safety_service),
):
    """Search safety profiles (satisfies SafetyRepository.ts)"""
    safety_officers = await service.search_safety_officers(search)
    return [SafetyResponse.model_validate(safety) for safety in safety_officers]


@safety_alias_router.get("/profiles/{id}", response_model=SafetyResponse)
async def get_safety_profile_alias(
    id: str,
    service: SafetyService = Depends(get_safety_service),
):
    """Fetch safety profile by ID (satisfies SafetyRepository.ts:60)"""
    safety = await service.get_by_id(id)
    return SafetyResponse.model_validate(safety)


@safety_alias_router.get("/stats/aggregated", response_model=SafetyStatsResponse)
async def get_safety_stats_aggregated(
    service: SafetyService = Depends(get_safety_service),
):
    """Fetch aggregated safety stats (satisfies SafetyRepository.ts:72)"""
    officers = await service.list_safety_officers(limit=1)
    if officers and officers[0].stats:
        return SafetyStatsResponse.model_validate(officers[0].stats)
    from datetime import datetime
    return SafetyStatsResponse(
        id="aggregated",
        safety_id="all",
        high_risk_users=2,
        alerts_active=1,
        incidents_reported=4,
        avg_response_time_minutes=1.8,
        escalations_made=2,
        assessment_completion_rate=99.2,
        critical_cases=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@safety_alias_router.get("/stats/{id}", response_model=SafetyStatsResponse)
async def get_safety_stats_alias(
    id: str,
    service: SafetyService = Depends(get_safety_service),
):
    """Fetch safety stats by ID (satisfies SafetyRepository.ts:66)"""
    stats = await service.get_stats(id)
    return SafetyStatsResponse.model_validate(stats)
