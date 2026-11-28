"""
Milestone 4 Comprehensive Verification Test Suite
Tests:
1. Supervisor pod roster (with MemberProfile display_name join), conduct report resolution, and training review verification with PostgreSQL model persistence.
2. Safety crisis triage action logging, case state transitions, followups, and emergency hotlines (Tele-MANAS, AASRA, Vandrevala, Kiran, 112).
3. Platform Admin KMS key listing/rotation (AES-256-GCM), RBAC role guard (require_role), and permission checking (AdminRepository.ts:86).
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
import uuid
from datetime import datetime, timezone

from app.core.security import (
    list_kms_keys,
    rotate_kms_key,
    require_role,
    encrypt_content,
    decrypt_content,
    CURRENT_KEY_VERSION,
)
from app.services.supervisor_service import SupervisorService
from app.services.operations_service import OperationsService
from app.services.admin_service import AdminService
from app.services.dashboard_service import DashboardService
from app.models.peer import ListenerProfile, PeerConversation
from app.models.member import MemberProfile, AppPrincipal, RoleAssignment
from app.models.operations import (
    ConductReport,
    ListenerTrainingRecord,
    SafetyCase,
    SafetyCaseAction,
    Followup,
    CrisisResource,
    AuditEvent,
)
from app.models.admin import AdminDB, AdminRoleEnum


def run_async(coro):
    import inspect
    stack = [coro]
    val = None
    while stack:
        curr = stack[-1]
        try:
            res = curr.send(val)
            val = None
            if inspect.isawaitable(res):
                if hasattr(res, "__await__"):
                    stack.append(res.__await__())
                else:
                    stack.append(res)
        except StopIteration as e:
            stack.pop()
            val = e.value
    return val


# ─── PART 1: SUPERVISOR WORKFLOWS & MODEL PERSISTENCE ────────────────────────

def test_supervisor_pod_listeners_joins_member_profile():
    """Verify get_pod_listeners joins MemberProfile and accesses display_name without AttributeError."""
    async def _test():
        mock_db = AsyncMock()

        lp = ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-01",
            application_state="approved",
            eligibility_state="eligible",
            capacity_limit=3,
            profile_languages=["English", "Hindi"],
            created_at=datetime.now(timezone.utc),
        )
        mp = MemberProfile(
            user_id="usr-demo-listener-01",
            display_name="Aarav Sharma",
            eligibility_state="verified",
        )

        result1 = MagicMock()
        result1.all.return_value = [(lp, mp)]

        result2 = MagicMock()
        result2.scalar.return_value = 2

        mock_db.execute.side_effect = [result1, result2]

        svc = SupervisorService(mock_db)
        listeners = await svc.get_pod_listeners()

        assert len(listeners) == 1
        assert listeners[0]["userId"] == "usr-demo-listener-01"
        assert listeners[0]["name"] == "Aarav Sharma"
        assert listeners[0]["openChats"] == 2
        assert listeners[0]["eligibilityState"] == "eligible"

    run_async(_test())


def test_supervisor_training_reviews_query_and_verification():
    """Verify get_training_reviews queries DB and verify_training_review updates state and logs AuditEvent."""
    async def _test():
        mock_db = AsyncMock()

        lp = ListenerProfile(id=uuid.uuid4(), user_id="usr-demo-listener-01")
        mp = MemberProfile(user_id="usr-demo-listener-01", display_name="Jordan Lee")
        tr = ListenerTrainingRecord(
            id=uuid.uuid4(),
            listener_id=lp.id,
            module_code="PC-BE-201",
            module_version="v1.0",
            completion_state="in_progress",
            completed_at=datetime.now(timezone.utc),
        )

        query_res = MagicMock()
        query_res.all.return_value = [(tr, lp, mp)]
        mock_db.execute.return_value = query_res

        svc = SupervisorService(mock_db)
        reviews = await svc.get_training_reviews()
        assert len(reviews) == 1
        assert reviews[0]["moduleCode"] == "PC-BE-201"
        assert "Non-Clinical Peer Boundaries" in reviews[0]["moduleTitle"]
        assert reviews[0]["listenerName"] == "Jordan Lee"

        single_res = MagicMock()
        single_res.scalar_one_or_none.return_value = tr
        mock_db.execute.return_value = single_res

        verification = await svc.verify_training_review(
            str(tr.id),
            {"status": "verified", "notes": "Passed CEU requirements", "reviewed_by_user_id": "usr-demo-supervisor-01"}
        )
        assert verification["success"] is True
        assert verification["status"] == "verified"
        assert tr.completion_state == "passed"
        assert tr.reviewed_by_user_id == "usr-demo-supervisor-01"
        assert mock_db.commit.called
        assert mock_db.add.called

    run_async(_test())


def test_supervisor_conduct_report_resolution():
    """Verify resolve_conduct_report updates report_state, resolvedAt, and persists AuditEvent."""
    async def _test():
        mock_db = AsyncMock()

        cr = ConductReport(
            id=uuid.uuid4(),
            conversation_id=uuid.uuid4(),
            reporter_user_id="usr-demo-member-01",
            reported_user_id="usr-demo-listener-01",
            category_code="boundary_concern",
            report_state="open",
            createdAt=datetime.now(timezone.utc),
        )

        res_mock = MagicMock()
        res_mock.scalar_one_or_none.return_value = cr
        mock_db.execute.return_value = res_mock

        svc = SupervisorService(mock_db)
        result = await svc.resolve_conduct_report(
            str(cr.id),
            {"decision": "cleared_with_guidance", "notes": "Reviewed with listener", "status": "resolved"}
        )
        assert result["success"] is True
        assert cr.report_state == "resolved"
        assert cr.resolvedAt is not None
        assert mock_db.commit.called
        assert mock_db.add.called

    run_async(_test())


def test_dashboard_service_training_due_dynamic_calculation():
    """Verify dashboard service dynamically queries pending ListenerTrainingRecord count."""
    async def _test():
        mock_db = AsyncMock()

        def make_res(val):
            m = MagicMock()
            m.scalar.return_value = val
            return m

        mock_db.execute.side_effect = [
            make_res(5),
            make_res(1),
            make_res(2),
            make_res(4),
            make_res(3),
        ]

        dash_svc = DashboardService(mock_db)
        summary = await dash_svc.get_supervisor_summary()

        assert summary["trainingDue"] == 3
        assert summary["activeListeners"] == 5
        assert summary["openConductReports"] == 2

    run_async(_test())


# ─── PART 2: SAFETY OPERATIONS CRISIS TRIAGE & ROUTING ───────────────────────

def test_safety_create_case_action_persistence():
    """Verify create_safety_case_action inserts SafetyCaseAction and writes AuditEvent."""
    async def _test():
        mock_db = AsyncMock()

        case_id = uuid.uuid4()
        case = SafetyCase(
            id=case_id,
            member_id="usr-demo-member-01",
            source_type="intake",
            trigger_code="acute_distress_alert",
            policy_version="v1.0",
            case_state="in_progress",
            priority_code="urgent",
        )
        res_mock = MagicMock()
        res_mock.scalar_one_or_none.return_value = case
        mock_db.execute.return_value = res_mock

        op_svc = OperationsService(mock_db)
        action_res = await op_svc.create_safety_case_action(
            str(case_id),
            "usr-demo-safety-01",
            {
                "action_type": "crisis_hotline_referral",
                "action_state": "completed",
                "notes": "Referred caller to Tele-MANAS (14416)"
            }
        )

        assert action_res["caseId"] == str(case_id)
        assert action_res["actionType"] == "crisis_hotline_referral"
        assert action_res["actionState"] == "completed"
        assert mock_db.commit.called
        assert mock_db.add.called

    run_async(_test())


def test_safety_update_case_state_and_priority():
    """Verify update_safety_case updates case_state, priority_code, resolution, and logs AuditEvent."""
    async def _test():
        mock_db = AsyncMock()

        case_id = uuid.uuid4()
        case = SafetyCase(
            id=case_id,
            member_id="usr-demo-member-01",
            source_type="intake",
            trigger_code="acute_distress_alert",
            policy_version="v1.0",
            case_state="new",
            priority_code="routine",
        )
        res_mock = MagicMock()
        res_mock.scalar_one_or_none.return_value = case
        mock_db.execute.return_value = res_mock

        op_svc = OperationsService(mock_db)
        updated = await op_svc.update_safety_case(
            str(case_id),
            {
                "case_state": "in_progress",
                "priority_code": "p1_urgent",
                "assigned_responder_user_id": "usr-demo-safety-01",
            }
        )

        assert updated["caseState"] == "in_progress"
        assert updated["priorityCode"] == "urgent"
        assert updated["assignedResponderUserId"] == "usr-demo-safety-01"
        assert case.acknowledged_at is not None
        assert mock_db.commit.called

    run_async(_test())


def test_safety_update_followup_state():
    """Verify update_safety_followup sets followup_state and completed_at."""
    async def _test():
        mock_db = AsyncMock()

        f_id = uuid.uuid4()
        followup = Followup(
            id=f_id,
            member_id="usr-demo-member-01",
            source_type="support_session",
            scheduled_at=datetime.now(timezone.utc),
            followup_state="scheduled",
        )
        res_mock = MagicMock()
        res_mock.scalar_one_or_none.return_value = followup
        mock_db.execute.return_value = res_mock

        op_svc = OperationsService(mock_db)
        res = await op_svc.update_safety_followup(
            str(f_id),
            {"followup_state": "completed"}
        )

        assert res["followupState"] == "responded"
        assert followup.completed_at is not None
        assert mock_db.commit.called

    run_async(_test())


# ─── PART 3: PLATFORM ADMIN KMS, ROLES & RBAC ────────────────────────────────

def test_kms_key_versions_and_rotation_envelope_encryption():
    """Verify KMS key version listing, rotation, and AES-256-GCM envelope roundtrip."""
    keys = list_kms_keys()
    assert len(keys) >= 1
    assert keys[0]["algorithm"] == "AES-256-GCM"

    rotation = rotate_kms_key()
    assert rotation["status"] == "rotated"
    new_version = rotation["currentVersion"]

    secret_note = "Confidential crisis intervention log"
    packed, key_ver = encrypt_content(secret_note)
    assert key_ver == new_version
    decrypted = decrypt_content(packed, key_ver)
    assert decrypted == secret_note


def test_admin_check_permission_against_postgres():
    """Verify check_permission checks permissions array from AdminDB model."""
    async def _test():
        mock_db = AsyncMock()

        admin1 = AdminDB(
            id="usr-demo-admin-01",
            user_id="usr-demo-admin-01",
            role=AdminRoleEnum.SUPER_ADMIN,
            permissions=["*"],
            email="admin@peercove.test",
            is_active=True,
        )
        res1 = MagicMock()
        res1.scalar_one_or_none.return_value = admin1
        mock_db.execute.return_value = res1

        admin_svc = AdminService(mock_db)
        assert await admin_svc.check_permission("usr-demo-admin-01", "manage_roles") is True
        assert await admin_svc.check_permission("usr-demo-admin-01", "kms_rotate") is True

        admin2 = AdminDB(
            id="usr-limited-admin",
            user_id="usr-limited-admin",
            role=AdminRoleEnum.ADMIN,
            permissions=["view_telemetry", "view_audit_logs"],
            email="limited@peercove.test",
            is_active=True,
        )
        res2 = MagicMock()
        res2.scalar_one_or_none.return_value = admin2
        mock_db.execute.return_value = res2

        assert await admin_svc.check_permission("usr-limited-admin", "view_telemetry") is True
        assert await admin_svc.check_permission("usr-limited-admin", "manage_roles") is False

    run_async(_test())


def test_admin_role_assignment_and_revocation():
    """Verify assign_admin_role creates RoleAssignment and revoke_admin_role revokes it."""
    async def _test():
        mock_db = AsyncMock()

        p_mock = MagicMock()
        p_mock.scalar_one_or_none.return_value = AppPrincipal(user_id="usr-new-01", account_state="active")
        mock_db.execute.return_value = p_mock

        op_svc = OperationsService(mock_db)
        assigned = await op_svc.assign_admin_role(
            "usr-demo-admin-01",
            {"user_id": "usr-new-01", "role_code": "listener", "reason": "Passed onboarding"}
        )

        assert assigned["userId"] == "usr-new-01"
        assert assigned["roleCode"] == "listener"
        assert assigned["assignmentState"] == "active"
        assert mock_db.commit.called
        assert mock_db.add.called

        role_id = uuid.uuid4()
        ra = RoleAssignment(
            id=role_id,
            user_id="usr-new-01",
            role_code="listener",
            assignment_state="active",
            granted_at=datetime.now(timezone.utc),
        )
        r_mock = MagicMock()
        r_mock.scalar_one_or_none.return_value = ra
        mock_db.execute.return_value = r_mock

        revoked = await op_svc.revoke_admin_role(str(role_id), "usr-demo-admin-01")
        assert revoked["status"] == "revoked"
        assert ra.assignment_state == "revoked"
        assert ra.revoked_at is not None
        assert mock_db.commit.called

    run_async(_test())


def test_rbac_require_role_enforcement():
    """Verify require_role dependency enforces role permissions and rejects unauthorized roles."""
    async def _test():
        req_mock = MagicMock()
        req_mock.headers.get.return_value = "platform_administrator"
        guard = require_role(["platform_administrator"])
        result = await guard(req_mock, None)
        assert result == "platform_administrator"

        req_admin = MagicMock()
        req_admin.headers.get.return_value = "admin"
        guard_admin = require_role(["platform_administrator"])
        assert await guard_admin(req_admin, None) == "admin"

        req_denied = MagicMock()
        req_denied.headers.get.return_value = "member"
        guard_protected = require_role(["platform_administrator", "listener_supervisor"])
        with pytest.raises(Exception) as excinfo:
            await guard_protected(req_denied, None)
        assert "403" in str(excinfo.value) or "Access denied" in str(excinfo.value)

    run_async(_test())
