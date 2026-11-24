from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Boolean, 
    Float, Integer, Index, Enum, UniqueConstraint, Date
)
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class SafetyStatusEnum(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SafetyDB(Base):
    __tablename__ = "safety_officers"
    __table_args__ = (
        Index("idx_safety_user_id", "user_id"),
        Index("idx_safety_email", "email"),
        Index("idx_safety_status", "status"),
        Index("idx_safety_is_active", "is_active"),
        Index("idx_safety_created_at", "created_at"),
        UniqueConstraint("user_id", name="uq_safety_user_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Text, nullable=False, unique=True)
    first_name = Column(Text, nullable=False)
    last_name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    phone = Column(Text, nullable=True)
    risk_score = Column(Float, default=0.0, nullable=False)
    status = Column(Enum(SafetyStatusEnum), default=SafetyStatusEnum.LOW, nullable=False)
    last_assessment_date = Column(Date, nullable=True)
    needs_intervention = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    stats = relationship("SafetyStatsDB", back_populates="safety_officer", uselist=False, cascade="all, delete-orphan")


class SafetyStatsDB(Base):
    __tablename__ = "safety_stats"
    __table_args__ = (
        Index("idx_safety_stats_safety_id", "safety_id"),
        Index("idx_safety_stats_created_at", "created_at"),
        UniqueConstraint("safety_id", name="uq_safety_stats_safety_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    safety_id = Column(String(36), ForeignKey("safety_officers.id", ondelete="CASCADE"), nullable=False, unique=True)
    high_risk_users = Column(Integer, default=0, nullable=False)
    alerts_active = Column(Integer, default=0, nullable=False)
    incidents_reported = Column(Integer, default=0, nullable=False)
    avg_response_time_minutes = Column(Float, default=0.0, nullable=False)
    escalations_made = Column(Integer, default=0, nullable=False)
    assessment_completion_rate = Column(Float, default=0.0, nullable=False)
    critical_cases = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    safety_officer = relationship("SafetyDB", back_populates="stats")
