from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Numeric, Date, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
from app.core.database import Base

class MoodEntry(Base):
    __tablename__ = "mood_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    mood_code = Column(Text, nullable=False)
    scale_code = Column(Text, nullable=True)
    scale_value = Column(Numeric(6, 2), nullable=True)
    note_ciphertext = Column(LargeBinary, nullable=True)
    key_version = Column(Text, nullable=True)
    source_type = Column(Text, default="member", nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    title_ciphertext = Column(LargeBinary, nullable=True)
    body_ciphertext = Column(LargeBinary, nullable=False)
    key_version = Column(Text, nullable=False)
    visibility = Column(Text, default="private", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

class WellbeingGoal(Base):
    __tablename__ = "wellbeing_goals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    goal_ciphertext = Column(LargeBinary, nullable=False)
    key_version = Column(Text, nullable=False)
    source_type = Column(Text, default="member", nullable=False)
    status = Column(Text, default="active", nullable=False)
    target_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    checkins = relationship("GoalCheckin", back_populates="goal")

class GoalCheckin(Base):
    __tablename__ = "goal_checkins"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("wellbeing_goals.id"), nullable=False)
    checkin_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    status = Column(Text, nullable=False)
    note_ciphertext = Column(LargeBinary, nullable=True)
    key_version = Column(Text, nullable=True)

    goal = relationship("WellbeingGoal", back_populates="checkins")

class WellbeingSession(Base):
    __tablename__ = "wellbeing_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    session_type = Column(Text, nullable=False)
    status = Column(Text, default="in_progress", nullable=False)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)

class WellbeingReflection(Base):
    __tablename__ = "wellbeing_reflections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    prompt_code = Column(Text, nullable=False)
    body_ciphertext = Column(LargeBinary, nullable=False)
    key_version = Column(Text, nullable=False)
    completed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
