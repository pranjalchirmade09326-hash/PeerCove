from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Boolean, 
    Float, Integer, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class SupervisorDB(Base):
    __tablename__ = "supervisors"
    __table_args__ = (
        Index("idx_supervisor_user_id", "user_id"),
        Index("idx_supervisor_email", "email"),
        Index("idx_supervisor_is_active", "is_active"),
        Index("idx_supervisor_created_at", "created_at"),
        UniqueConstraint("user_id", name="uq_supervisor_user_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Text, nullable=False, unique=True)
    first_name = Column(Text, nullable=False)
    last_name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    phone = Column(Text, nullable=True)
    team_size = Column(Integer, default=0, nullable=False)
    performance_rating = Column(Float, default=0.0, nullable=False)
    department = Column(Text, nullable=True)
    experience_level = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    stats = relationship("SupervisorStatsDB", back_populates="supervisor", uselist=False, cascade="all, delete-orphan")


class SupervisorStatsDB(Base):
    __tablename__ = "supervisor_stats"
    __table_args__ = (
        Index("idx_supervisor_stats_supervisor_id", "supervisor_id"),
        Index("idx_supervisor_stats_created_at", "created_at"),
        UniqueConstraint("supervisor_id", name="uq_supervisor_stats_supervisor_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supervisor_id = Column(String(36), ForeignKey("supervisors.id", ondelete="CASCADE"), nullable=False, unique=True)
    team_members = Column(Integer, default=0, nullable=False)
    active_sessions = Column(Integer, default=0, nullable=False)
    avg_quality_score = Column(Float, default=0.0, nullable=False)
    total_workload = Column(Float, default=0.0, nullable=False)
    team_productivity_percent = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    supervisor = relationship("SupervisorDB", back_populates="stats")
