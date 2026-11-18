"""
Shared Test Infrastructure & Fixtures for MindSpace FastAPI Tests.
Provides:
1. Lifespan mocking to avoid offline PostgreSQL (port 5433) connection timeouts.
2. In-memory SQLite database with PostgreSQL type adapters (UUID, ARRAY, JSONB).
3. AsyncSessionWrapper satisfying AsyncSession interface for services.
4. FastAPI dependency overrides for get_db and get_current_user_id.
5. Baseline database seeding fixture for personas (Member, Listeners, Supervisors).
"""
import pytest
import sqlite3
import json
import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Generator

from fastapi import Request
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

# SQLite adapter for Python list and dict to prevent SQLite binding error
sqlite3.register_adapter(list, json.dumps)
sqlite3.register_adapter(dict, json.dumps)

# SQLite compilation overrides for PostgreSQL-specific types
@compiles(ARRAY, "sqlite")
def compile_array_sqlite(type_, compiler, **kw):
    return "TEXT"

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_current_user_id
from app.models.member import AppPrincipal, MemberProfile, MemberPreference, RoleAssignment
from app.models.peer import (
    ListenerProfile,
    ListenerAvailability,
    ListenerMatchRequest,
    ListenerMatch,
    PeerConversation,
    PeerMessage,
)
from app.models.operations import (
    ListenerFeedback,
    ConductReport,
    SafetyCase,
    SafetyCaseAction,
    Followup,
    CrisisResource,
    AuditEvent,
    ListenerTrainingRecord,
)

# 1. LIFESPAN MOCKING: Disable init_and_seed_db during testing to run completely offline
@asynccontextmanager
async def noop_lifespan(app_instance):
    yield

app.router.lifespan_context = noop_lifespan

# 2. In-memory SQLite Database Setup
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)

tables_to_create = [
    AppPrincipal.__table__,
    MemberProfile.__table__,
    MemberPreference.__table__,
    RoleAssignment.__table__,
    ListenerProfile.__table__,
    ListenerAvailability.__table__,
    ListenerMatchRequest.__table__,
    ListenerMatch.__table__,
    PeerConversation.__table__,
    PeerMessage.__table__,
    ListenerFeedback.__table__,
    ConductReport.__table__,
    SafetyCase.__table__,
    SafetyCaseAction.__table__,
    Followup.__table__,
    CrisisResource.__table__,
    AuditEvent.__table__,
    ListenerTrainingRecord.__table__,
]
Base.metadata.create_all(bind=test_engine, tables=tables_to_create)
TestSessionLocal = sessionmaker(bind=test_engine, expire_on_commit=False)


# 3. AsyncSessionWrapper: allows synchronous SQLite session to satisfy AsyncSession interface in services
class AsyncSessionWrapper:
    def __init__(self, session):
        self.session = session

    async def execute(self, statement, *args, **kwargs):
        return self.session.execute(statement, *args, **kwargs)

    def add(self, instance):
        self.session.add(instance)

    async def commit(self):
        self.session.commit()

    async def flush(self):
        self.session.flush()

    async def refresh(self, instance, *args, **kwargs):
        self.session.refresh(instance)

    async def close(self):
        self.session.close()

    async def delete(self, instance):
        self.session.delete(instance)


def override_get_db():
    sync_session = TestSessionLocal()
    wrapper = AsyncSessionWrapper(sync_session)
    try:
        yield wrapper
    finally:
        sync_session.close()


async def override_get_current_user_id(request: Request) -> str:
    # 1. Check custom header x-user-id
    user_header = request.headers.get("x-user-id")
    if user_header:
        return user_header
    # 2. Check authorization Bearer token
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        import jwt
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            sub = payload.get("sub") or payload.get("userId")
            if sub:
                return str(sub)
        except Exception:
            pass
    # 3. Development fallback
    return "usr-demo-member-01"


# Register global dependency overrides
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user_id] = override_get_current_user_id


def seed_baseline_records(session):
    """Seed baseline member, listener, supervisor, and safety records."""
    # Member 1: Priya
    m1 = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == "usr-demo-member-01")).scalar_one_or_none()
    if not m1:
        session.add(AppPrincipal(user_id="usr-demo-member-01", account_state="active"))
        session.add(MemberProfile(user_id="usr-demo-member-01", display_name="Priya Sharma", eligibility_state="verified"))

    # Member 2: Rahul
    m2 = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == "usr-demo-member-02")).scalar_one_or_none()
    if not m2:
        session.add(AppPrincipal(user_id="usr-demo-member-02", account_state="active"))
        session.add(MemberProfile(user_id="usr-demo-member-02", display_name="Rahul Verma", eligibility_state="verified"))

    # Listener 1: Aarav
    l1 = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == "usr-demo-listener-01")).scalar_one_or_none()
    if not l1:
        session.add(AppPrincipal(user_id="usr-demo-listener-01", account_state="active"))
        session.add(MemberProfile(user_id="usr-demo-listener-01", display_name="Aarav Sharma"))
        session.add(ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-01",
            application_state="approved",
            eligibility_state="eligible",
            capacity_limit=3,
            profile_languages=["English", "Hindi"],
            active_now=True,
            rating=5.0,
            total_conversations=10
        ))

    # Listener 2: Ananya
    l2 = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == "usr-demo-listener-02")).scalar_one_or_none()
    if not l2:
        session.add(AppPrincipal(user_id="usr-demo-listener-02", account_state="active"))
        session.add(MemberProfile(user_id="usr-demo-listener-02", display_name="Ananya Patel"))
        session.add(ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-02",
            application_state="approved",
            eligibility_state="eligible",
            capacity_limit=3,
            profile_languages=["English"],
            active_now=True,
            rating=4.8,
            total_conversations=5
        ))

    # Listener 3: Limited workload listener (capacity = 1)
    l3 = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == "usr-demo-listener-03")).scalar_one_or_none()
    if not l3:
        session.add(AppPrincipal(user_id="usr-demo-listener-03", account_state="active"))
        session.add(MemberProfile(user_id="usr-demo-listener-03", display_name="Rohan Gupta"))
        session.add(ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-03",
            application_state="approved",
            eligibility_state="eligible",
            capacity_limit=1,
            profile_languages=["English", "Hindi"],
            active_now=True,
            rating=4.9,
            total_conversations=2
        ))

    # Supervisor
    sup = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == "usr-demo-supervisor-01")).scalar_one_or_none()
    if not sup:
        session.add(AppPrincipal(user_id="usr-demo-supervisor-01", account_state="active"))
        session.add(RoleAssignment(
            id=uuid.uuid4(),
            user_id="usr-demo-supervisor-01",
            role_code="listener_supervisor",
            assignment_state="active"
        ))

    # Safety Officer
    safe = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == "usr-demo-safety-01")).scalar_one_or_none()
    if not safe:
        session.add(AppPrincipal(user_id="usr-demo-safety-01", account_state="active"))
        session.add(RoleAssignment(
            id=uuid.uuid4(),
            user_id="usr-demo-safety-01",
            role_code="safety_operations_specialist",
            assignment_state="active"
        ))

    session.commit()


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Initializes and seeds database once per test session."""
    session = TestSessionLocal()
    seed_baseline_records(session)
    session.close()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Yields FastAPI TestClient with offline mocks and dependency overrides."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_session():
    """Provides a fresh synchronous session for direct state assertion."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
