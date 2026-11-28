from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime, timezone
import uuid
from app.core.security import get_current_user_id
from app.schemas.member import MemberProfileUpdate, MemberPreferencesUpdate
from app.services.member_service import MemberService, get_member_service

router = APIRouter(prefix="/api/v1", tags=["Member"])

_PRIVACY_REQUESTS: dict[str, list[dict]] = {}
_NOTIFICATION_PREFS: dict[str, dict] = {}


class PrivacyRequestCreate(BaseModel):
    request_type: Literal["export", "deletion"]
    reason: Optional[str] = Field(default=None, max_length=500)


class NotificationPreferencesUpdate(BaseModel):
    channel: Literal["in_app", "email", "none"] = "in_app"
    goal_reminders_enabled: bool = True
    followup_checkins_enabled: bool = True
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"
    timezone: str = "Asia/Kolkata"


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


@router.post("/members/me/privacy-requests")
async def create_privacy_request(
    payload: PrivacyRequestCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Submit an auditable member data export or account deletion request (US-005)."""
    req = {
        "privacy_request_id": f"priv-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "request_type": payload.request_type,
        "reason": payload.reason,
        "status": "submitted",
        "requested_at": datetime.now(timezone.utc).isoformat(),
    }
    _PRIVACY_REQUESTS.setdefault(user_id, []).append(req)
    return req


@router.get("/members/me/privacy-requests")
async def list_privacy_requests(
    user_id: str = Depends(get_current_user_id),
):
    return _PRIVACY_REQUESTS.get(user_id, [])


@router.get("/members/me/notifications/preferences")
async def get_notification_preferences(
    user_id: str = Depends(get_current_user_id),
):
    """Get member notification and quiet-hour preferences (US-025)."""
    return _NOTIFICATION_PREFS.get(
        user_id,
        {
            "channel": "in_app",
            "goal_reminders_enabled": True,
            "followup_checkins_enabled": True,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00",
            "timezone": "Asia/Kolkata",
        },
    )


@router.put("/members/me/notifications/preferences")
async def update_notification_preferences(
    payload: NotificationPreferencesUpdate,
    user_id: str = Depends(get_current_user_id),
):
    prefs = payload.model_dump()
    prefs["updated_at"] = datetime.now(timezone.utc).isoformat()
    _NOTIFICATION_PREFS[user_id] = prefs
    return prefs
