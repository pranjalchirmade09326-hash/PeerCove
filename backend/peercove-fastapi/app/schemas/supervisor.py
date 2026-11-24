from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SupervisorStatsResponse(BaseModel):
    id: str
    supervisor_id: str
    team_members: int
    active_sessions: int
    avg_quality_score: float
    total_workload: float
    team_productivity_percent: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SupervisorResponse(BaseModel):
    id: str
    user_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    team_size: int
    performance_rating: float
    department: Optional[str]
    experience_level: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    stats: Optional[SupervisorStatsResponse] = None

    model_config = ConfigDict(from_attributes=True)


class SupervisorCreatedResponse(BaseModel):
    id: str
    user_id: str
    email: str
    first_name: str
    last_name: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SupervisorCreateRequest(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    team_size: int = 0
    performance_rating: float = 0.0
    department: Optional[str] = None
    experience_level: Optional[str] = None
    is_active: bool = True


class SupervisorUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    team_size: Optional[int] = None
    performance_rating: Optional[float] = None
    department: Optional[str] = None
    experience_level: Optional[str] = None
    is_active: Optional[bool] = None


class SupervisorStatsUpdateRequest(BaseModel):
    team_members: Optional[int] = None
    active_sessions: Optional[int] = None
    avg_quality_score: Optional[float] = None
    total_workload: Optional[float] = None
    team_productivity_percent: Optional[float] = None


class SupervisorSearchRequest(BaseModel):
    email: Optional[str] = None
    department: Optional[str] = None
    experience_level: Optional[str] = None
    is_active: Optional[bool] = None
    limit: int = Field(default=50, ge=1, le=500)
    offset: int = Field(default=0, ge=0)

    model_config = ConfigDict(validate_default=True)
