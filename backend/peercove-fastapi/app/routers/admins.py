from fastapi import APIRouter, Depends, Query
from typing import List

from app.schemas.admin import (
    AdminResponse,
    AdminCreatedResponse,
    AdminCreateRequest,
    AdminUpdateRequest,
    AdminSearchRequest,
    AdminStatsResponse,
    AdminStatsUpdateRequest,
)
from app.services.admin_service import AdminService, get_admin_service

router = APIRouter(prefix="/api/v1/admins", tags=["admins"])


@router.get("/health", tags=["health"])
async def admin_health_check(service: AdminService = Depends(get_admin_service)):
    """Health check endpoint for admin module"""
    return await service.check_health()


@router.get("/department/{department_id}", response_model=List[AdminResponse])
async def get_admins_by_department(
    department_id: str,
    service: AdminService = Depends(get_admin_service),
):
    """Fetch admins by department"""
    admins = await service.get_by_department(department_id)
    return [AdminResponse.model_validate(admin) for admin in admins]


@router.get("/{id}/permissions/{permission}")
async def check_admin_permission(
    id: str,
    permission: str,
    service: AdminService = Depends(get_admin_service),
):
    """Check whether admin has requested permission in PostgreSQL"""
    has_perm = await service.check_permission(id, permission)
    return {
        "hasPermission": has_perm,
        "has_permission": has_perm,
        "adminId": id,
        "admin_id": id,
        "permission": permission,
    }


@router.get("/{id}", response_model=AdminResponse)
async def get_admin_by_id(id: str, service: AdminService = Depends(get_admin_service)):
    """Fetch admin by ID with stats"""
    admin = await service.get_by_id(id)
    return AdminResponse.model_validate(admin)


@router.get("/{id}/stats", response_model=AdminStatsResponse)
async def get_admin_stats(id: str, service: AdminService = Depends(get_admin_service)):
    """Fetch admin statistics"""
    stats = await service.get_stats(id)
    return AdminStatsResponse.model_validate(stats)


@router.get("", response_model=List[AdminResponse])
async def list_admins(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    service: AdminService = Depends(get_admin_service),
):
    """List all admins with pagination"""
    admins = await service.list_admins(limit, offset)
    return [AdminResponse.model_validate(admin) for admin in admins]


@router.post("/search", response_model=List[AdminResponse])
async def search_admins(search: AdminSearchRequest, service: AdminService = Depends(get_admin_service)):
    """Search admins with filters"""
    admins = await service.search_admins(search)
    return [AdminResponse.model_validate(admin) for admin in admins]


@router.post("", response_model=AdminCreatedResponse, status_code=201)
async def create_admin(admin: AdminCreateRequest, service: AdminService = Depends(get_admin_service)):
    """Create a new admin"""
    new_admin = await service.create_admin(admin)
    return AdminCreatedResponse.model_validate(new_admin)


@router.post("/{id}", response_model=AdminResponse)
async def update_admin(id: str, update: AdminUpdateRequest, service: AdminService = Depends(get_admin_service)):
    """Update admin information"""
    admin = await service.update_admin(id, update)
    return AdminResponse.model_validate(admin)


@router.post("/{id}/stats", response_model=AdminStatsResponse)
async def update_admin_stats(
    id: str,
    stats_update: AdminStatsUpdateRequest,
    service: AdminService = Depends(get_admin_service),
):
    """Update admin statistics"""
    stats = await service.update_stats(id, stats_update)
    return AdminStatsResponse.model_validate(stats)


@router.delete("/{id}", status_code=204)
async def delete_admin(id: str, service: AdminService = Depends(get_admin_service)):
    """Delete an admin and associated stats"""
    await service.delete_admin(id)
    return None
