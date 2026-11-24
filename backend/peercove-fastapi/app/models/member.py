from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Numeric, Date, JSON, LargeBinary
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class AppPrincipal(Base):
    __tablename__ = "app_principals"
    
    user_id = Column(Text, primary_key=True)
    account_state = Column(Text, default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deactivated_at = Column(DateTime(timezone=True), nullable=True)

    profile = relationship("MemberProfile", back_populates="user", uselist=False)
    preferences = relationship("MemberPreference", back_populates="user", uselist=False)

class MemberProfile(Base):
    __tablename__ = "member_profiles"
    
    user_id = Column(Text, ForeignKey("app_principals.user_id"), primary_key=True)
    display_name = Column(Text, nullable=False)
    eligibility_state = Column(Text, default="unverified", nullable=False)
    profile_state = Column(Text, default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("AppPrincipal", back_populates="profile")

class MemberPreference(Base):
    __tablename__ = "member_preferences"
    
    user_id = Column(Text, ForeignKey("app_principals.user_id"), primary_key=True)
    locale = Column(Text, default="en", nullable=False)
    timezone = Column(Text, default="UTC", nullable=False)
    preferred_languages = Column(ARRAY(Text), default=list, nullable=False)
    accessibility = Column(JSON, default=dict, nullable=False)
    communication = Column(JSON, default=dict, nullable=False)
    support_preferences = Column(JSON, default=dict, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("AppPrincipal", back_populates="preferences")

class RoleAssignment(Base):
    __tablename__ = "role_assignments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    role_code = Column(Text, nullable=False)
    assignment_state = Column(Text, nullable=False)
    granted_by_user_id = Column(Text, nullable=True)
    granted_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    decision_reason = Column(Text, nullable=True)

class ConsentRecord(Base):
    __tablename__ = "consent_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    purpose_code = Column(Text, nullable=False)
    recipient_user_id = Column(Text, nullable=True)
    recipient_scope = Column(Text, nullable=True)
    data_scope = Column(JSON, default=dict, nullable=False)
    policy_version = Column(Text, nullable=False)
    consent_state = Column(Text, nullable=False)
    captured_by = Column(Text, nullable=False)
    captured_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    supersedes_id = Column(String, nullable=True)

