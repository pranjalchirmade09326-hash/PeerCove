from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

class MoodEntryCreate(BaseModel):
    mood_code: str
    scale_code: Optional[str] = "1-10"
    scale_value: Optional[float] = 7.0
    note: Optional[str] = None

class MoodEntryResponse(BaseModel):
    id: str
    member_id: str
    mood_code: str
    scale_code: Optional[str] = None
    scale_value: Optional[float] = None
    note: Optional[str] = None
    recorded_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JournalEntryCreate(BaseModel):
    title: Optional[str] = None
    body: str
    visibility: str = "private"

class JournalEntryResponse(BaseModel):
    id: str
    member_id: str
    title: Optional[str] = None
    body: str
    visibility: str
    created_at: datetime
    updated_at: datetime

class GoalCreate(BaseModel):
    goal: str
    target_date: Optional[date] = None

class GoalCheckinCreate(BaseModel):
    status: str
    note: Optional[str] = None

class GoalResponse(BaseModel):
    id: str
    member_id: str
    goal: str
    status: str
    target_date: Optional[date] = None
    created_at: datetime
    checkin_count: int = 0

