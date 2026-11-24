from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class MemberProfileUpdate(BaseModel):
    display_name: str

class MemberProfileResponse(BaseModel):
    user_id: str
    display_name: str
    eligibility_state: str
    profile_state: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MemberPreferencesUpdate(BaseModel):
    locale: Optional[str] = "en"
    timezone: Optional[str] = "UTC"
    preferred_languages: Optional[List[str]] = None
    accessibility: Optional[Dict[str, Any]] = None
    communication: Optional[Dict[str, Any]] = None
    support_preferences: Optional[Dict[str, Any]] = None

