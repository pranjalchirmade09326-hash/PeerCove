from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id
from app.schemas.member import MemberProfileUpdate, MemberPreferencesUpdate
from app.services.member_service import MemberService, get_member_service

router = APIRouter(prefix="/api/v1", tags=["Member"])


@router.post("/members/me/provision")
async def provision_me(
    user_id: str = Depends(get_current_user_id),
    service: MemberService = Depends(get_member_service),
):
    return await service.provision_me(user_id)


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user_id),
    service: MemberService = Depends(get_member_service),
):
    return await service.get_me(user_id)


@router.get("/members/me/profile")
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    service: MemberService = Depends(get_member_service),
):
    return await service.get_profile(user_id)


@router.put("/members/me/profile")
async def update_profile(
    payload: MemberProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    service: MemberService = Depends(get_member_service),
):
    return await service.update_profile(user_id, payload)


@router.get("/members/me/preferences")
async def get_preferences(
    user_id: str = Depends(get_current_user_id),
    service: MemberService = Depends(get_member_service),
):
    return await service.get_preferences(user_id)


@router.put("/members/me/preferences")
async def update_preferences(
    payload: MemberPreferencesUpdate,
    user_id: str = Depends(get_current_user_id),
    service: MemberService = Depends(get_member_service),
):
    return await service.update_preferences(user_id, payload)


@router.get("/consents")
async def list_consents(
    user_id: str = Depends(get_current_user_id),
    service: MemberService = Depends(get_member_service),
):
    return await service.list_consents(user_id)


@router.post("/consents")
async def create_consent(
    payload: dict,
    user_id: str = Depends(get_current_user_id),
    service: MemberService = Depends(get_member_service),
):
    return await service.create_consent(user_id, payload)


@router.get("/notifications")
async def list_notifications(
    user_id: str = Depends(get_current_user_id),
    service: MemberService = Depends(get_member_service),
):
    return await service.list_notifications(user_id)


@router.get("/followups")
async def list_followups(
    user_id: str = Depends(get_current_user_id),
    service: MemberService = Depends(get_member_service),
):
    return await service.list_followups(user_id)
