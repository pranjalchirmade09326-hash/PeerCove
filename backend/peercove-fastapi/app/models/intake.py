from sqlalchemy import Column, String, Text, DateTime, ForeignKey, LargeBinary, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class IntakeSession(Base):
    __tablename__ = "intake_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    channel = Column(Text, nullable=False)
    status = Column(Text, default="in_progress", nullable=False)
    locale = Column(Text, default="en", nullable=False)
    consent_id = Column(UUID(as_uuid=True), nullable=True)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_resumed_at = Column(DateTime(timezone=True), nullable=True)
    agent_version = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    responses = relationship("IntakeResponse", back_populates="intake")
    recommendations = relationship("SupportRecommendation", back_populates="intake")
    summaries = relationship("WellbeingSummary", back_populates="intake")

class IntakeResponse(Base):
    __tablename__ = "intake_responses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intake_id = Column(UUID(as_uuid=True), ForeignKey("intake_sessions.id"), nullable=False)
    sequence_no = Column(Integer, nullable=False)
    topic_code = Column(Text, nullable=True)
    response_state = Column(Text, default="answered", nullable=False)
    source_type = Column(Text, default="member", nullable=False)
    content_ciphertext = Column(LargeBinary, nullable=True)
    key_version = Column(Text, nullable=True)
    structured_value = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    supersedes_id = Column(UUID(as_uuid=True), ForeignKey("intake_responses.id"), nullable=True)

    intake = relationship("IntakeSession", back_populates="responses")

class SupportRecommendation(Base):
    __tablename__ = "support_recommendations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intake_id = Column(UUID(as_uuid=True), ForeignKey("intake_sessions.id"), nullable=False)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    support_level = Column(Text, nullable=False)
    option_code = Column(Text, nullable=False)
    availability_state = Column(Text, default="available", nullable=False)
    rationale_ciphertext = Column(LargeBinary, nullable=True)
    key_version = Column(Text, nullable=True)
    selected_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    intake = relationship("IntakeSession", back_populates="recommendations")

class WellbeingSummary(Base):
    __tablename__ = "wellbeing_summaries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intake_id = Column(UUID(as_uuid=True), ForeignKey("intake_sessions.id"), nullable=False)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    version_no = Column(Integer, default=1, nullable=False)
    summary_ciphertext = Column(LargeBinary, nullable=False)
    key_version = Column(Text, nullable=False)
    generated_by = Column(Text, default="ai", nullable=False)
    agent_version = Column(Text, nullable=True)
    review_state = Column(Text, default="pending", nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    intake = relationship("IntakeSession", back_populates="summaries")
