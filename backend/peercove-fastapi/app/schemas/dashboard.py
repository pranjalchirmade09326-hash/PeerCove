from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime, date

class MemberDashboardSummary(BaseModel):
    user_id: str
    display_name: str
    total_sessions: int = 0
    pending_sessions: int = 0
    completed_sessions: int = 0
    cancelled_sessions: int = 0
    mood_trend: List[Dict[str, Any]] = Field(default_factory=list)
    recent_sessions: List[Dict[str, Any]] = Field(default_factory=list)
    active_goals: List[Dict[str, Any]] = Field(default_factory=list)
    latest_intake_status: Optional[str] = None

