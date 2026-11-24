from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class MatchRequestCreate(BaseModel):
    support_topic: Optional[str] = None
    preferred_channel: str = "chat"
    preferred_languages: Optional[List[str]] = Field(default_factory=lambda: ["en"])
    notes: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "channel" in data and "preferred_channel" not in data:
                data["preferred_channel"] = data["channel"]
            if "preferredChannel" in data and "preferred_channel" not in data:
                data["preferred_channel"] = data["preferredChannel"]
            if "languages" in data and "preferred_languages" not in data:
                data["preferred_languages"] = data["languages"]
            if "preferredLanguages" in data and "preferred_languages" not in data:
                data["preferred_languages"] = data["preferredLanguages"]
            if "supportTopic" in data and "support_topic" not in data:
                data["support_topic"] = data["supportTopic"]
        return data

class MatchRequestResponse(BaseModel):
    id: str
    member_id: str
    request_state: str
    status: Optional[str] = None
    support_topic: Optional[str] = None
    preferred_channel: Optional[str] = "chat"
    preferred_languages: Optional[List[str]] = None
    notes: Optional[str] = None
    created_at: datetime
    conversation_id: Optional[str] = None
    listener: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class ActiveMatchRequestItem(BaseModel):
    id: str
    member_id: str
    member_name: Optional[str] = None
    support_topic: Optional[str] = None
    preferred_channel: str = "chat"
    created_at: datetime
    waiting_minutes: int = 0
    urgency: Optional[str] = "routine"

class OfferActionResponse(BaseModel):
    status: str
    match_id: Optional[str] = None
    conversation_id: Optional[str] = None
    channel: Optional[str] = None
    reassigned: Optional[bool] = None

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None
    post_mood_score: Optional[float] = None
    post_mood_label: Optional[str] = None
    sync_to_journal: bool = False

class FeedbackResponse(BaseModel):
    status: str = "success"
    feedback_id: str

class BookSessionRequest(BaseModel):
    listener_id: Optional[str] = None
    listener_name: Optional[str] = "Aarav Sharma"
    channel: str = "voice"  # "voice" | "video" | "chat"
    note: Optional[str] = "Evening reflection and mindfulness check-in"
    scheduled_slot: Optional[str] = None

class PeerMessageCreate(BaseModel):
    content: str

class PeerMessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_user_id: str
    content: str
    sent_at: datetime

class PeerConversationResponse(BaseModel):
    id: str
    match_id: str
    member_id: str
    listener_id: str
    listener_name: Optional[str] = None
    channel: str
    conversation_state: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    note: Optional[str] = None

class SoapNoteCreate(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str

class ListenerProfileUpdate(BaseModel):
    capacity_limit: Optional[int] = None
    capacityLimit: Optional[int] = None
    profile_languages: Optional[List[str]] = None
    profileLanguages: Optional[List[str]] = None
    display_name: Optional[str] = None
    displayName: Optional[str] = None
    active_now: Optional[bool] = None
    activeNow: Optional[bool] = None
    is_online: Optional[bool] = None
    isOnline: Optional[bool] = None

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Map isOnline / is_online / activeNow to active_now if active_now is None
            if data.get("active_now") is None:
                for key in ("isOnline", "is_online", "activeNow"):
                    if data.get(key) is not None:
                        data["active_now"] = data[key]
                        break
            if data.get("isOnline") is None and data.get("active_now") is not None:
                data["isOnline"] = data["active_now"]
            if data.get("is_online") is None and data.get("active_now") is not None:
                data["is_online"] = data["active_now"]
            if data.get("capacity_limit") is None and data.get("capacityLimit") is not None:
                data["capacity_limit"] = data["capacityLimit"]
            if data.get("profile_languages") is None and data.get("profileLanguages") is not None:
                data["profile_languages"] = data["profileLanguages"]
            if data.get("display_name") is None and data.get("displayName") is not None:
                data["display_name"] = data["displayName"]
        return data

class ListenerProfileResponse(BaseModel):
    status: str = "success"
    message: Optional[str] = "Listener profile updated successfully"
    capacity_limit: Optional[int] = None
    profile_languages: Optional[List[str]] = None
    display_name: Optional[str] = None
    active_now: Optional[bool] = None
    is_online: Optional[bool] = None
    isOnline: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
