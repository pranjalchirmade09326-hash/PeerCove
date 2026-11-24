from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ConductReportCreate(BaseModel):
    conversation_id: str
    category_code: str
    details: Optional[str] = None
    severity: Optional[str] = "routine"
    reported_user_id: Optional[str] = None

class ConductReportResponse(BaseModel):
    status: str = "created"
    report_id: str
    conversation_id: Optional[str] = None
    category_code: Optional[str] = None
    report_state: Optional[str] = "open"
    severity: Optional[str] = "routine"
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class SafetyCaseCreate(BaseModel):
    member_id: Optional[str] = None
    source_type: str = "peer_conversation"
    source_record_id: Optional[str] = None
    trigger_code: str = "CRISIS_SENTINEL"
    policy_version: str = "v1.0"
    priority_code: str = "emergency"
    jurisdiction: str = "IN"
    notes: Optional[str] = None

class SafetyCaseResponse(BaseModel):
    safety_case_id: str
    case_state: str = "new"
    status: str = "created"

class ListenerAvailabilityCreate(BaseModel):
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    startsAt: Optional[str] = None
    endsAt: Optional[str] = None
    state: str = "available"
    timezone: str = "UTC"
