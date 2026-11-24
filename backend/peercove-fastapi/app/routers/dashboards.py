from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id
from app.services.dashboard_service import DashboardService, get_dashboard_service

router = APIRouter(prefix="/api/v1", tags=["Dashboards"])


@router.get("/members/me/summary")
async def get_member_summary(
    user_id: str = Depends(get_current_user_id),
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.get_member_summary(user_id)


@router.get("/listeners/me/summary")
async def get_listener_summary(
    user_id: str = Depends(get_current_user_id),
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.get_listener_summary(user_id)


@router.get("/operations/supervisor/summary")
async def get_supervisor_summary(
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.get_supervisor_summary()


@router.get("/operations/safety/summary")
async def get_safety_summary(
    user_id: str = Depends(get_current_user_id),
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.get_safety_summary(user_id)


@router.get("/admin/platform/overview")
async def get_platform_overview(
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.get_platform_overview()
