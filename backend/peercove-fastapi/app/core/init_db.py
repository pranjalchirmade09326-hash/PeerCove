from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import encrypt_content
from app.models.member import AppPrincipal, MemberProfile, MemberPreference, RoleAssignment
from app.models.peer import ListenerProfile, ListenerMatchRequest, ListenerMatch, PeerConversation, PeerMessage
from app.models.wellbeing import WellbeingGoal, MoodEntry
from app.models.intake import IntakeSession
from app.models.operations import (
    CrisisResource,
    SafetyCase,
    SafetyCaseAction,
    Followup,
    ListenerTrainingRecord,
    ConductReport,
    ListenerSupervisorAssignment,
    AuditEvent,
)
from app.models.admin import AdminDB, AdminStatsDB, AdminRoleEnum
from app.models.supervisor import SupervisorDB, SupervisorStatsDB
from app.models.safety import SafetyDB, SafetyStatsDB, SafetyStatusEnum
from datetime import datetime, timezone, timedelta
import uuid

async def init_and_seed_db():
    try:
        # 1. Create tables if they do not exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # 2. Seed default data if empty
        async with AsyncSessionLocal() as db:
            # Check if member already exists
            member_user_id = "usr-demo-member-01"
            res = await db.execute(select(AppPrincipal).where(AppPrincipal.user_id == member_user_id))
            if not res.scalar_one_or_none():
                # Add demo member
                member_principal = AppPrincipal(user_id=member_user_id, account_state="active")
                db.add(member_principal)
                await db.flush()

                member_profile = MemberProfile(
                    user_id=member_user_id,
                    display_name="Priya Sharma",
                    eligibility_state="verified",
                    profile_state="active"
                )
                db.add(member_profile)

                member_pref = MemberPreference(
                    user_id=member_user_id,
                    locale="en",
                    timezone="Asia/Kolkata",
                    preferred_languages=["English", "Hindi"]
                )
                db.add(member_pref)

                # Add demo listener
                listener_user_id = "usr-demo-listener-01"
                listener_res = await db.execute(select(AppPrincipal).where(AppPrincipal.user_id == listener_user_id))
                if not listener_res.scalar_one_or_none():
                    db.add(AppPrincipal(user_id=listener_user_id, account_state="active"))
                    await db.flush()

                    db.add(MemberProfile(
                        user_id=listener_user_id,
                        display_name="Aarav Sharma (Verified Peer Listener)",
                        eligibility_state="verified"
                    ))

                listener_prof_res = await db.execute(select(ListenerProfile).where(ListenerProfile.user_id == listener_user_id))
                listener = listener_prof_res.scalar_one_or_none()
                if not listener:
                    listener = ListenerProfile(
                        id=uuid.uuid4(),
                        user_id=listener_user_id,
                        application_state="approved",
                        eligibility_state="eligible",
                        capacity_limit=3,
                        profile_languages=["English", "Hindi"]
                    )
                    db.add(listener)
                    await db.flush()

                # Add sample goals (AES-256-GCM encrypted)
                g1_ct, g1_kv = encrypt_content("15-minute daily mindfulness breathing")
                g2_ct, g2_kv = encrypt_content("Evening digital screen wind-down before 10 PM")
                
                db.add(WellbeingGoal(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    goal_ciphertext=g1_ct,
                    key_version=g1_kv,
                    status="active",
                    target_date=datetime.now(timezone.utc).date() + timedelta(days=10)
                ))
                db.add(WellbeingGoal(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    goal_ciphertext=g2_ct,
                    key_version=g2_kv,
                    status="active",
                    target_date=datetime.now(timezone.utc).date() + timedelta(days=15)
                ))

                # Add sample moods (AES-256-GCM encrypted)
                m1_ct, m1_kv = encrypt_content("Evening reflection and mindfulness breathwork")
                m2_ct, m2_kv = encrypt_content("Feeling centered and calm after meditation")
                m3_ct, m3_kv = encrypt_content("Positive somatic focus, feeling grounded")

                db.add(MoodEntry(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    mood_code="peaceful",
                    scale_code="1_to_10",
                    scale_value=8.5,
                    note_ciphertext=m1_ct,
                    key_version=m1_kv,
                    recorded_at=datetime.now(timezone.utc) - timedelta(days=2)
                ))
                db.add(MoodEntry(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    mood_code="grateful",
                    scale_code="1_to_10",
                    scale_value=9.0,
                    note_ciphertext=m2_ct,
                    key_version=m2_kv,
                    recorded_at=datetime.now(timezone.utc) - timedelta(days=1)
                ))
                db.add(MoodEntry(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    mood_code="calm",
                    scale_code="1_to_10",
                    scale_value=8.0,
                    note_ciphertext=m3_ct,
                    key_version=m3_kv,
                    recorded_at=datetime.now(timezone.utc)
                ))

                # Add sample peer conversations
                # 1. Active video session
                req1 = ListenerMatchRequest(id=uuid.uuid4(), member_id=member_user_id, request_state="matched")
                db.add(req1)
                await db.flush()
                match1 = ListenerMatch(id=uuid.uuid4(), request_id=req1.id, listener_id=listener.id, match_state="accepted")
                db.add(match1)
                await db.flush()
                db.add(PeerConversation(
                    id=uuid.uuid4(),
                    match_id=match1.id,
                    member_id=member_user_id,
                    listener_id=listener.id,
                    channel="voice",
                    conversation_state="open",
                    started_at=datetime.now(timezone.utc) - timedelta(hours=1)
                ))

                # 2. Completed voice session
                req2 = ListenerMatchRequest(id=uuid.uuid4(), member_id=member_user_id, request_state="matched")
                db.add(req2)
                await db.flush()
                match2 = ListenerMatch(id=uuid.uuid4(), request_id=req2.id, listener_id=listener.id, match_state="accepted")
                db.add(match2)
                await db.flush()
                db.add(PeerConversation(
                    id=uuid.uuid4(),
                    match_id=match2.id,
                    member_id=member_user_id,
                    listener_id=listener.id,
                    channel="voice",
                    conversation_state="closed",
                    started_at=datetime.now(timezone.utc) - timedelta(days=1),
                    ended_at=datetime.now(timezone.utc) - timedelta(days=1, hours=-1)
                ))

                # 3. Completed chat session
                req3 = ListenerMatchRequest(id=uuid.uuid4(), member_id=member_user_id, request_state="matched")
                db.add(req3)
                await db.flush()
                match3 = ListenerMatch(id=uuid.uuid4(), request_id=req3.id, listener_id=listener.id, match_state="accepted")
                db.add(match3)
                await db.flush()
                db.add(PeerConversation(
                    id=uuid.uuid4(),
                    match_id=match3.id,
                    member_id=member_user_id,
                    listener_id=listener.id,
                    channel="text",
                    conversation_state="closed",
                    started_at=datetime.now(timezone.utc) - timedelta(days=2),
                    ended_at=datetime.now(timezone.utc) - timedelta(days=2, hours=-1)
                ))

                # Intake session completed
                db.add(IntakeSession(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    channel="text",
                    status="completed",
                    locale="en",
                    started_at=datetime.now(timezone.utc) - timedelta(days=3),
                    completed_at=datetime.now(timezone.utc) - timedelta(days=3, hours=-1)
                ))

                await db.commit()

            # 3. Seed Crisis Resources if missing
            cr_res = await db.execute(select(CrisisResource).where(CrisisResource.display_name.ilike("%Tele-MANAS%")))
            if not cr_res.scalar_one_or_none():
                resources = [
                    CrisisResource(
                        id=uuid.uuid4(),
                        region_code="IN",
                        locale="en",
                        resource_type="hotline",
                        display_name="Tele-MANAS (Govt of India 24/7 Helpline)",
                        contact_details={"phone": "14416", "toll_free": "1800-891-4416", "hours": "24x7", "cost": "free"},
                        source_url="https://telemanas.mohfw.gov.in",
                        verification_state="verified",
                        verified_by_user_id="usr-demo-safety-01",
                        last_verified_at=datetime.now(timezone.utc),
                    ),
                    CrisisResource(
                        id=uuid.uuid4(),
                        region_code="IN",
                        locale="en",
                        resource_type="crisis_line",
                        display_name="AASRA 24/7 Suicide Prevention Helpline",
                        contact_details={"phone": "+91 9820466726", "hours": "24x7", "type": "crisis_intervention"},
                        source_url="http://www.aasra.info",
                        verification_state="verified",
                        verified_by_user_id="usr-demo-safety-01",
                        last_verified_at=datetime.now(timezone.utc),
                    ),
                    CrisisResource(
                        id=uuid.uuid4(),
                        region_code="IN",
                        locale="en",
                        resource_type="counseling",
                        display_name="Vandrevala Foundation Helpline",
                        contact_details={"phone": "+91 9999 666 555", "hours": "24x7", "type": "free_mental_health_support"},
                        source_url="https://www.vandrevalafoundation.com",
                        verification_state="verified",
                        verified_by_user_id="usr-demo-safety-01",
                        last_verified_at=datetime.now(timezone.utc),
                    ),
                    CrisisResource(
                        id=uuid.uuid4(),
                        region_code="IN",
                        locale="en",
                        resource_type="hotline",
                        display_name="Kiran Mental Health Rehabilitation Helpline",
                        contact_details={"phone": "1800-599-0019", "hours": "24x7", "type": "toll_free"},
                        source_url="http://depwd.gov.in",
                        verification_state="verified",
                        verified_by_user_id="usr-demo-safety-01",
                        last_verified_at=datetime.now(timezone.utc),
                    ),
                    CrisisResource(
                        id=uuid.uuid4(),
                        region_code="IN",
                        locale="en",
                        resource_type="emergency",
                        display_name="Emergency Services",
                        contact_details={"phone": "112", "alt_phone": "988", "hours": "24x7", "type": "police_medical_fire"},
                        source_url="https://112.gov.in",
                        verification_state="verified",
                        verified_by_user_id="usr-demo-safety-01",
                        last_verified_at=datetime.now(timezone.utc),
                    ),
                ]
                for r in resources:
                    db.add(r)
                await db.flush()

            # 4. Seed Staff Profiles: Admin, Supervisor, Safety Officer
            admin_user_id = "usr-demo-admin-01"
            admin_res = await db.execute(select(AdminDB).where(AdminDB.user_id == admin_user_id))
            if not admin_res.scalar_one_or_none():
                p = await db.execute(select(AppPrincipal).where(AppPrincipal.user_id == admin_user_id))
                if not p.scalar_one_or_none():
                    db.add(AppPrincipal(user_id=admin_user_id, account_state="active"))
                    await db.flush()

                new_admin = AdminDB(
                    id=admin_user_id,
                    user_id=admin_user_id,
                    role=AdminRoleEnum.SUPER_ADMIN,
                    permissions=["*"],
                    department="Platform Engineering",
                    email="admin@peercove.test",
                    phone="+91 98765 43210",
                    is_active=True,
                )
                admin_stats = AdminStatsDB(
                    id=str(uuid.uuid4()),
                    admin_id=admin_user_id,
                    total_users=125,
                    active_listeners=18,
                    pending_reports=3,
                    system_health_percent=99.9,
                    response_time_ms=42.0,
                    avg_quality_score=4.9,
                )
                db.add(new_admin)
                db.add(admin_stats)

            supervisor_user_id = "usr-demo-supervisor-01"
            sup_res = await db.execute(select(SupervisorDB).where(SupervisorDB.user_id == supervisor_user_id))
            if not sup_res.scalar_one_or_none():
                p = await db.execute(select(AppPrincipal).where(AppPrincipal.user_id == supervisor_user_id))
                if not p.scalar_one_or_none():
                    db.add(AppPrincipal(user_id=supervisor_user_id, account_state="active"))
                    await db.flush()

                new_sup = SupervisorDB(
                    id=supervisor_user_id,
                    user_id=supervisor_user_id,
                    first_name="Alok",
                    last_name="Verma",
                    email="supervisor@peercove.test",
                    phone="+91 98765 11111",
                    team_size=5,
                    performance_rating=4.95,
                    department="Clinical Supervision",
                    experience_level="Senior Lead (10+ yrs)",
                    is_active=True,
                )
                sup_stats = SupervisorStatsDB(
                    id=str(uuid.uuid4()),
                    supervisor_id=supervisor_user_id,
                    team_members=5,
                    active_sessions=14,
                    avg_quality_score=4.9,
                    total_workload=78.5,
                    team_productivity_percent=98.0,
                )
                db.add(new_sup)
                db.add(sup_stats)

            safety_user_id = "usr-demo-safety-01"
            safety_res = await db.execute(select(SafetyDB).where(SafetyDB.user_id == safety_user_id))
            if not safety_res.scalar_one_or_none():
                p = await db.execute(select(AppPrincipal).where(AppPrincipal.user_id == safety_user_id))
                if not p.scalar_one_or_none():
                    db.add(AppPrincipal(user_id=safety_user_id, account_state="active"))
                    await db.flush()

                new_safety = SafetyDB(
                    id=safety_user_id,
                    user_id=safety_user_id,
                    first_name="Rohan",
                    last_name="Mehta",
                    email="safety@peercove.test",
                    phone="+91 98765 22222",
                    risk_score=12.5,
                    status=SafetyStatusEnum.LOW,
                    needs_intervention=False,
                    is_active=True,
                )
                safety_stats = SafetyStatsDB(
                    id=str(uuid.uuid4()),
                    safety_id=safety_user_id,
                    high_risk_users=2,
                    alerts_active=1,
                    incidents_reported=4,
                    avg_response_time_minutes=1.8,
                    escalations_made=2,
                    assessment_completion_rate=99.2,
                    critical_cases=0,
                )
                db.add(new_safety)
                db.add(safety_stats)

            # 5. Seed Role Assignments for all demo roles if missing
            demo_roles = [
                ("usr-demo-member-01", "member"),
                ("usr-demo-listener-01", "listener"),
                ("usr-demo-supervisor-01", "listener_supervisor"),
                ("usr-demo-safety-01", "safety_operations_specialist"),
                ("usr-demo-admin-01", "platform_administrator"),
            ]
            for u_id, r_code in demo_roles:
                ra_res = await db.execute(
                    select(RoleAssignment).where(RoleAssignment.user_id == u_id, RoleAssignment.role_code == r_code)
                )
                if not ra_res.scalar_one_or_none():
                    db.add(RoleAssignment(
                        id=uuid.uuid4(),
                        user_id=u_id,
                        role_code=r_code,
                        assignment_state="active",
                        granted_by_user_id="usr-demo-admin-01",
                        decision_reason="Standard system demo role seeding"
                    ))

            # 6. Seed sample safety cases and actions for usr-demo-safety-01
            sc_res = await db.execute(
                select(SafetyCase).where(SafetyCase.assigned_responder_user_id == "usr-demo-safety-01")
            )
            sc_existing = sc_res.scalars().all()
            if not sc_existing:
                case1 = SafetyCase(
                    id=uuid.uuid4(),
                    member_id="usr-demo-member-01",
                    source_type="intake",
                    trigger_code="acute_distress_alert",
                    policy_version="v1.0",
                    case_state="in_progress",
                    priority_code="urgent",
                    jurisdiction="IN",
                    assigned_responder_user_id="usr-demo-safety-01",
                    created_at=datetime.now(timezone.utc) - timedelta(hours=2),
                    acknowledged_at=datetime.now(timezone.utc) - timedelta(hours=1, minutes=45),
                )
                db.add(case1)
                await db.flush()

                action1 = SafetyCaseAction(
                    id=uuid.uuid4(),
                    case_id=case1.id,
                    actor_user_id="usr-demo-safety-01",
                    action_type="crisis_triage_assessment",
                    action_state="completed",
                    occurred_at=datetime.now(timezone.utc) - timedelta(hours=1, minutes=30),
                )
                db.add(action1)

                followup1 = Followup(
                    id=uuid.uuid4(),
                    member_id="usr-demo-member-01",
                    source_type="support_session",
                    scheduled_at=datetime.now(timezone.utc) + timedelta(hours=24),
                    followup_state="scheduled",
                )
                db.add(followup1)

            await db.commit()
            print("PeerCove PostgreSQL successfully initialized & seeded!")
    except Exception as e:
        print(f"Database initialization notice: {e}")

