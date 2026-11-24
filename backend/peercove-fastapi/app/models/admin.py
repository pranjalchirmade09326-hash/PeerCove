from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Boolean, 
    Float, Integer, JSON, Index, Enum, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class AdminRoleEnum(str, enum.Enum):
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    MODERATOR = "moderator"


class AdminDB(Base):
    __tablename__ = "admins"
    __table_args__ = (
        Index("idx_admin_user_id", "user_id"),
        Index("idx_admin_email", "email"),
        Index("idx_admin_is_active", "is_active"),
        Index("idx_admin_created_at", "created_at"),
        UniqueConstraint("user_id", name="uq_admin_user_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Text, nullable=False, unique=True)
    role = Column(Enum(AdminRoleEnum), default=AdminRoleEnum.ADMIN, nullable=False)
    permissions = Column(ARRAY(Text), default=list, nullable=False)
    department = Column(Text, nullable=True)
    email = Column(Text, nullable=False)
    phone = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    stats = relationship("AdminStatsDB", back_populates="admin", uselist=False, cascade="all, delete-orphan")


class AdminStatsDB(Base):
    __tablename__ = "admin_stats"
    __table_args__ = (
        Index("idx_admin_stats_admin_id", "admin_id"),
        Index("idx_admin_stats_created_at", "created_at"),
        UniqueConstraint("admin_id", name="uq_admin_stats_admin_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String(36), ForeignKey("admins.id", ondelete="CASCADE"), nullable=False, unique=True)
    total_users = Column(Integer, default=0, nullable=False)
    active_listeners = Column(Integer, default=0, nullable=False)
    pending_reports = Column(Integer, default=0, nullable=False)
    system_health_percent = Column(Float, default=100.0, nullable=False)
    response_time_ms = Column(Float, default=0.0, nullable=False)
    avg_quality_score = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    admin = relationship("AdminDB", back_populates="stats")
