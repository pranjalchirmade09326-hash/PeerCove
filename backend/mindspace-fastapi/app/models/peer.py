from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float, Boolean, JSON, LargeBinary
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class ListenerProfile(Base):
    __tablename__ = "listener_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False, unique=True)
    application_state = Column(Text, default="pending", nullable=False)
    eligibility_state = Column(Text, default="ineligible", nullable=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    eligibility_expires_at = Column(DateTime(timezone=True), nullable=True)
    capacity_limit = Column(Integer, default=1, nullable=False)
    profile_languages = Column(ARRAY(Text), default=list, nullable=False)
    active_now = Column(Boolean, default=False, nullable=False)
    specialties = Column(ARRAY(Text), default=list, nullable=False)
    rating = Column(Float, default=5.0, nullable=False)
    total_conversations = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    @property
    def activeNow(self) -> bool:
        return self.active_now

    @activeNow.setter
    def activeNow(self, val: bool):
        self.active_now = val

class ListenerAvailability(Base):
    __tablename__ = "listener_availability"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listener_id = Column(UUID(as_uuid=True), ForeignKey("listener_profiles.id"), nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    availability_state = Column(Text, default="available", nullable=False)
    timezone = Column(Text, default="UTC", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class ListenerMatchRequest(Base):
    __tablename__ = "listener_match_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    request_state = Column(Text, default="queued", nullable=False)
    support_topic = Column(Text, nullable=True)
    preferred_channel = Column(Text, default="chat", nullable=False)
    preferred_languages = Column(ARRAY(Text), default=list, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)

class ListenerMatch(Base):
    __tablename__ = "listener_matches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("listener_match_requests.id"), nullable=False)
    listener_id = Column(UUID(as_uuid=True), ForeignKey("listener_profiles.id"), nullable=False)
    match_state = Column(Text, default="offered", nullable=False)
    offered_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    end_reason_code = Column(Text, nullable=True)

class PeerConversation(Base):
    __tablename__ = "peer_conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(UUID(as_uuid=True), ForeignKey("listener_matches.id"), nullable=False, unique=True)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    listener_id = Column(UUID(as_uuid=True), ForeignKey("listener_profiles.id"), nullable=False)
    channel = Column(Text, nullable=False)
    conversation_state = Column(Text, default="open", nullable=False)
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    closed_by_user_id = Column(Text, nullable=True)

    messages = relationship("PeerMessage", back_populates="conversation")

class PeerMessage(Base):
    __tablename__ = "peer_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("peer_conversations.id"), nullable=False)
    sequence_no = Column(Integer, nullable=False)
    sender_user_id = Column(Text, nullable=False)
    content_ciphertext = Column(LargeBinary, nullable=False)
    key_version = Column(Text, nullable=False)
    delivery_state = Column(Text, default="sent", nullable=False)
    sent_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    conversation = relationship("PeerConversation", back_populates="messages")
