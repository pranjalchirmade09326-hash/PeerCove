from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class SafetyStatusEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SafetyStatsResponse(BaseModel):
    id: str
    safety_id: str
    high_risk_users: int
    alerts_active: int
    incidents_reported: int
    avg_response_time_minutes: float
    escalations_made: int
    assessment_completion_rate: float
    critical_cases: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SafetyResponse(BaseModel):
    id: str
    user_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    risk_score: float
    status: SafetyStatusEnum
    last_assessment_date: Optional[date]
    needs_intervention: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    stats: Optional[SafetyStatsResponse] = None

    model_config = ConfigDict(from_attributes=True)


class SafetyCreatedResponse(BaseModel):
    id: str
    user_id: str
    email: str
    first_name: str
    last_name: str
    status: SafetyStatusEnum
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SafetyCreateRequest(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    risk_score: float = 0.0
    status: SafetyStatusEnum = SafetyStatusEnum.LOW
    last_assessment_date: Optional[date] = None
    needs_intervention: bool = False
    is_active: bool = True


class SafetyUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    risk_score: Optional[float] = None
    status: Optional[SafetyStatusEnum] = None
    last_assessment_date: Optional[date] = None
    needs_intervention: Optional[bool] = None
    is_active: Optional[bool] = None


class SafetyStatsUpdateRequest(BaseModel):
    high_risk_users: Optional[int] = None
    alerts_active: Optional[int] = None
    incidents_reported: Optional[int] = None
    avg_response_time_minutes: Optional[float] = None
    escalations_made: Optional[int] = None
    assessment_completion_rate: Optional[float] = None
    critical_cases: Optional[int] = None


class SafetySearchRequest(BaseModel):
    email: Optional[str] = None
    status: Optional[SafetyStatusEnum] = None
    needs_intervention: Optional[bool] = None
    is_active: Optional[bool] = None
    limit: int = Field(default=50, ge=1, le=500)
    offset: int = Field(default=0, ge=0)

    model_config = ConfigDict(validate_default=True)
