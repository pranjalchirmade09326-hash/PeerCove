from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float, Boolean, JSON, LargeBinary
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class PrivacyRequest(Base):
    __tablename__ = "privacy_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    request_type = Column(Text, nullable=False)
    request_state = Column(Text, default="submitted", nullable=False)
    requested_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    fulfilled_at = Column(DateTime(timezone=True), nullable=True)
    decision_reason = Column(Text, nullable=True)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    occurred_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    actor_user_id = Column(Text, nullable=True)
    actor_type = Column(Text, default="user", nullable=True)
    action_code = Column(Text, nullable=False)
    resource_type = Column(Text, nullable=False)
    resource_id = Column(Text, nullable=True)
    purpose_code = Column(Text, default="operational_audit", nullable=True)
    correlation_id = Column(UUID(as_uuid=True), nullable=True)
    outcome = Column(Text, nullable=False)
    details = Column("metadata", JSONB, nullable=True)

class ListenerTrainingRecord(Base):
    __tablename__ = "listener_training_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listener_id = Column(UUID(as_uuid=True), ForeignKey("listener_profiles.id"), nullable=False)
    module_code = Column(Text, nullable=False)
    module_version = Column(Text, nullable=False)
    completion_state = Column(Text, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_user_id = Column(Text, nullable=True)

class ListenerSupervisorAssignment(Base):
    __tablename__ = "listener_supervisor_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listener_id = Column(UUID(as_uuid=True), ForeignKey("listener_profiles.id"), nullable=False)
    supervisor_user_id = Column(Text, nullable=False)
    assignment_state = Column(Text, default="active", nullable=False)
    assigned_by_user_id = Column(Text, nullable=False)
    assigned_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    reason_code = Column(Text, nullable=False)

class ConductReport(Base):
    __tablename__ = "conduct_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), nullable=False)
    reporter_user_id = Column(Text, nullable=False)
    reported_user_id = Column(Text, nullable=True)
    category_code = Column(Text, nullable=False)
    details_ciphertext = Column(LargeBinary, nullable=True)
    key_version = Column(Text, nullable=True)
    severity = Column(Text, default="routine", nullable=True)
    report_state = Column(Text, default="open", nullable=False)
    assigned_to_user_id = Column(Text, nullable=True)
    createdAt = Column("created_at", DateTime(timezone=True), default=utcnow, nullable=False)
    resolvedAt = Column("resolved_at", DateTime(timezone=True), nullable=True)

    @property
    def created_at(self):
        return self.createdAt

    @created_at.setter
    def created_at(self, val):
        self.createdAt = val

    @property
    def resolved_at(self):
        return self.resolvedAt

    @resolved_at.setter
    def resolved_at(self, val):
        self.resolvedAt = val

class ListenerFeedback(Base):
    __tablename__ = "listener_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), nullable=False)
    member_id = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)
    feedback_ciphertext = Column(LargeBinary, nullable=True)
    key_version = Column(Text, nullable=True)
    post_mood_score = Column(Float, nullable=True)
    sync_to_journal = Column(Boolean, default=False, nullable=True)
    review_state = Column(Text, default="received", nullable=False)
    submitted_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    reviewed_by_user_id = Column(Text, nullable=True)

class SafetyCase(Base):
    __tablename__ = "safety_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(Text, nullable=True)
    source_type = Column(Text, nullable=False)
    source_record_id = Column(UUID(as_uuid=True), nullable=True)
    trigger_code = Column(Text, nullable=False)
    policy_version = Column(Text, nullable=False)
    case_state = Column(Text, default="new", nullable=False)
    priority_code = Column(Text, nullable=False)
    jurisdiction = Column(Text, nullable=True)
    assigned_responder_user_id = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    resolution_code = Column(Text, nullable=True)

class SafetyCaseAction(Base):
    __tablename__ = "safety_case_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("safety_cases.id"), nullable=False)
    actor_user_id = Column(Text, nullable=True)
    action_type = Column(Text, nullable=False)
    action_state = Column(Text, nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    details_ciphertext = Column(LargeBinary, nullable=True)
    key_version = Column(Text, nullable=True)
    occurred_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class CrisisResource(Base):
    __tablename__ = "crisis_resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    region_code = Column(Text, nullable=False)
    locale = Column(Text, nullable=False)
    resource_type = Column(Text, nullable=False)
    display_name = Column(Text, nullable=False)
    contact_details = Column(JSONB, nullable=False)
    source_url = Column(Text, nullable=True)
    verification_state = Column(Text, default="pending", nullable=False)
    verified_by_user_id = Column(Text, nullable=True)
    last_verified_at = Column(DateTime(timezone=True), nullable=True)
    effective_from = Column(DateTime(timezone=True), nullable=True)
    effective_to = Column(DateTime(timezone=True), nullable=True)

class Followup(Base):
    __tablename__ = "followups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    source_type = Column(Text, nullable=False)
    source_record_id = Column(UUID(as_uuid=True), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    followup_state = Column(Text, default="scheduled", nullable=False)
    response_ciphertext = Column(LargeBinary, nullable=True)
    key_version = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, ForeignKey("app_principals.user_id"), nullable=False)
    notification_type = Column(Text, nullable=False)
    channel = Column(Text, nullable=False)
    payload_reference = Column(Text, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivery_state = Column(Text, default="queued", nullable=False)
    attempt_count = Column(Integer, default=0, nullable=False)
    deduplication_key = Column(Text, unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class SelfHelpContent(Base):
    __tablename__ = "self_help_content"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_code = Column(Text, unique=True, nullable=False)
    content_type = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    locale = Column(Text, nullable=False)
    content_version = Column(Integer, nullable=False)
    body = Column(JSONB, nullable=False)
    review_state = Column(Text, nullable=False)
    author_user_id = Column(Text, nullable=True)
    reviewer_user_id = Column(Text, nullable=True)
    effective_from = Column(DateTime(timezone=True), nullable=True)
    effective_to = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class WorkflowDefinition(Base):
    __tablename__ = "workflow_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_code = Column(Text, unique=True, nullable=False)
    version = Column(Text, nullable=False)
    status = Column(Text, default="draft", nullable=False)
    policy_version = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    definition_id = Column(UUID(as_uuid=True), ForeignKey("workflow_definitions.id"), nullable=False)
    temporal_workflow_id = Column(Text, unique=True, nullable=False)
    subject_type = Column(Text, nullable=False)
    subject_id = Column(Text, nullable=False)
    status = Column(Text, default="running", nullable=False)
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    correlation_id = Column(UUID(as_uuid=True), nullable=True)

class WorkflowTask(Base):
    __tablename__ = "workflow_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id = Column(UUID(as_uuid=True), ForeignKey("workflow_executions.id"), nullable=False)
    task_code = Column(Text, nullable=False)
    assignee_user_id = Column(Text, nullable=True)
    required_role = Column(Text, nullable=False)
    status = Column(Text, default="queued", nullable=False)
    due_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    reason_code = Column(Text, nullable=True)

class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aggregate_type = Column(Text, nullable=False)
    aggregate_id = Column(Text, nullable=False)
    event_type = Column(Text, nullable=False)
    payload = Column(JSONB, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
