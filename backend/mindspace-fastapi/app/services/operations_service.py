from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.security import encrypt_content
from app.models.member import AppPrincipal, MemberProfile, RoleAssignment
from app.models.peer import ListenerProfile, ListenerAvailability, ListenerMatchRequest, ListenerMatch, PeerConversation
from app.models.operations import (
    PrivacyRequest,
    AuditEvent,
    ListenerTrainingRecord,
    ListenerSupervisorAssignment,
    ConductReport,
    SafetyCase,
    SafetyCaseAction,
    CrisisResource,
    Followup,
    Notification,
    SelfHelpContent,
    WorkflowDefinition,
    WorkflowExecution,
    WorkflowTask,
    OutboxEvent,
)
from app.services.base import BaseService
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import uuid


class OperationsService(BaseService):
    # ─── LISTENER SELF-SERVICE ───────────────────────────────────────────────────

    async def get_listener_profile(self, user_id: str) -> dict:
        stmt = select(ListenerProfile).where(ListenerProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        profile = res.scalar_one_or_none()
        if not profile:
            profile = ListenerProfile(
                user_id=user_id,
                application_state="approved",
                eligibility_state="eligible",
                capacity_limit=2,
                profile_languages=["en", "hi"],
                approved_at=datetime.now(timezone.utc),
            )
            self.db.add(profile)
            await self.db.commit()
            await self.db.refresh(profile)

        return {
            "id": str(profile.id),
            "userId": profile.user_id,
            "applicationState": profile.application_state,
            "eligibilityState": profile.eligibility_state,
            "approvedAt": profile.approved_at.isoformat() if profile.approved_at else None,
            "eligibilityExpiresAt": profile.eligibility_expires_at.isoformat() if profile.eligibility_expires_at else None,
            "capacityLimit": profile.capacity_limit,
            "profileLanguages": getattr(profile, "profile_languages", ["en"]),
            "createdAt": profile.created_at.isoformat(),
            "updatedAt": profile.updated_at.isoformat(),
        }

    async def update_listener_profile(self, user_id: str, payload: Dict[str, Any]) -> dict:
        stmt = select(ListenerProfile).where(ListenerProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        profile = res.scalar_one_or_none()
        if not profile:
            profile = ListenerProfile(user_id=user_id)
            self.db.add(profile)

        if "capacityLimit" in payload:
            profile.capacity_limit = payload["capacityLimit"]
        if "capacity_limit" in payload:
            profile.capacity_limit = payload["capacity_limit"]
        if "profileLanguages" in payload:
            profile.profile_languages = payload["profileLanguages"]
        if "profile_languages" in payload:
            profile.profile_languages = payload["profile_languages"]
        
        online_val = None
        for key in ("isOnline", "is_online", "active_now", "activeNow"):
            if key in payload and payload[key] is not None:
                online_val = bool(payload[key])
                break
        if online_val is not None:
            profile.active_now = online_val

        await self.db.commit()
        await self.db.refresh(profile)
        return {
            "status": "success",
            "profileId": str(profile.id),
            "active_now": getattr(profile, "active_now", False),
            "is_online": getattr(profile, "active_now", False),
            "isOnline": getattr(profile, "active_now", False),
        }

    async def get_listener_training(self, user_id: str) -> list[dict]:
        prof_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            return []

        stmt = select(ListenerTrainingRecord).where(
            ListenerTrainingRecord.listener_id == profile.id
        ).order_by(desc(ListenerTrainingRecord.completed_at))
        res = await self.db.execute(stmt)
        records = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "listenerId": str(r.listener_id),
                "moduleCode": r.module_code,
                "moduleVersion": r.module_version,
                "completionState": r.completion_state,
                "completedAt": r.completed_at.isoformat() if r.completed_at else None,
                "expiresAt": r.expires_at.isoformat() if r.expires_at else None,
                "reviewedByUserId": r.reviewed_by_user_id,
            }
            for r in records
        ]

    async def get_listener_offers(self, user_id: str) -> list[dict]:
        prof_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            return []

        stmt = select(ListenerMatch).where(
            ListenerMatch.listener_id == profile.id,
            ListenerMatch.match_state == "offered"
        ).order_by(desc(ListenerMatch.offered_at))
        res = await self.db.execute(stmt)
        matches = res.scalars().all()
        
        offers = []
        for m in matches:
            req_res = await self.db.execute(select(ListenerMatchRequest).where(ListenerMatchRequest.id == m.request_id))
            req = req_res.scalar_one_or_none()
            offers.append({
                "id": str(m.id),
                "requestId": str(m.request_id),
                "listenerId": str(m.listener_id),
                "matchState": m.match_state,
                "offeredAt": m.offered_at.isoformat(),
                "acceptedAt": m.accepted_at.isoformat() if m.accepted_at else None,
                "request": {
                    "id": str(req.id) if req else str(m.request_id),
                    "memberId": req.member_id if req else "anonymous",
                    "requestState": req.request_state if req else "queued",
                    "createdAt": req.created_at.isoformat() if req else m.offered_at.isoformat()
                }
            })
        return offers

    async def get_listener_availability(self, user_id: str) -> list[dict]:
        prof_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            return []

        stmt = select(ListenerAvailability).where(
            ListenerAvailability.listener_id == profile.id
        ).order_by(ListenerAvailability.starts_at)
        res = await self.db.execute(stmt)
        records = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "listenerId": str(r.listener_id),
                "startsAt": r.starts_at.isoformat(),
                "endsAt": r.ends_at.isoformat(),
                "availabilityState": r.availability_state,
                "timezone": r.timezone,
            }
            for r in records
        ]

    async def add_listener_availability(self, user_id: str, payload: Dict[str, Any]) -> dict:
        prof_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=404, detail="Listener profile not found.")

        starts_at = datetime.fromisoformat(payload["startsAt"].replace("Z", "+00:00"))
        ends_at = datetime.fromisoformat(payload["endsAt"].replace("Z", "+00:00"))
        avail = ListenerAvailability(
            listener_id=profile.id,
            starts_at=starts_at,
            ends_at=ends_at,
            availability_state=payload.get("state", "available"),
            timezone=payload.get("timezone", "UTC"),
        )
        self.db.add(avail)
        await self.db.commit()
        await self.db.refresh(avail)
        return {"status": "created", "id": str(avail.id)}

    # ─── SUPERVISOR OPERATIONS ──────────────────────────────────────────────────

    async def get_supervisor_listeners(self) -> list[dict]:
        stmt = select(ListenerProfile).order_by(desc(ListenerProfile.created_at)).limit(100)
        res = await self.db.execute(stmt)
        profiles = res.scalars().all()
        
        results = []
        for p in profiles:
            conv_cnt_res = await self.db.execute(
                select(func.count(PeerConversation.id)).where(
                    PeerConversation.listener_id == p.id,
                    PeerConversation.conversation_state == "open"
                )
            )
            open_convs = conv_cnt_res.scalar() or 0

            train_res = await self.db.execute(
                select(ListenerTrainingRecord).where(
                    ListenerTrainingRecord.listener_id == p.id
                ).order_by(desc(ListenerTrainingRecord.completed_at)).limit(1)
            )
            latest_train = train_res.scalar_one_or_none()

            mp_res = await self.db.execute(select(MemberProfile).where(MemberProfile.user_id == p.user_id))
            mp = mp_res.scalar_one_or_none()

            results.append({
                "listenerProfileId": str(p.id),
                "userId": p.user_id,
                "displayName": mp.display_name if mp else p.user_id,
                "applicationState": p.application_state,
                "eligibilityState": p.eligibility_state,
                "eligibilityExpiresAt": p.eligibility_expires_at.isoformat() if p.eligibility_expires_at else None,
                "capacityLimit": p.capacity_limit,
                "profileLanguages": getattr(p, "profile_languages", ["en"]),
                "approvedAt": p.approved_at.isoformat() if p.approved_at else None,
                "openConversations": open_convs,
                "latestTraining": {
                    "id": str(latest_train.id),
                    "moduleCode": latest_train.module_code,
                    "completionState": latest_train.completion_state,
                    "completedAt": latest_train.completed_at.isoformat() if latest_train.completed_at else None
                } if latest_train else None,
                "supervisorUserId": None
            })
        return results

    async def get_supervisor_training_records(self) -> list[dict]:
        stmt = select(ListenerTrainingRecord).order_by(desc(ListenerTrainingRecord.completed_at)).limit(100)
        res = await self.db.execute(stmt)
        records = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "listenerId": str(r.listener_id),
                "moduleCode": r.module_code,
                "moduleVersion": r.module_version,
                "completionState": r.completion_state,
                "completedAt": r.completed_at.isoformat() if r.completed_at else None,
                "expiresAt": r.expires_at.isoformat() if r.expires_at else None,
                "reviewedByUserId": r.reviewed_by_user_id
            }
            for r in records
        ]

    async def get_supervisor_conduct_reports(self) -> list[dict]:
        stmt = select(ConductReport).order_by(desc(ConductReport.createdAt)).limit(100)
        res = await self.db.execute(stmt)
        reports = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "conversationId": str(r.conversation_id),
                "reporterUserId": r.reporter_user_id,
                "reportedUserId": r.reported_user_id,
                "categoryCode": r.category_code,
                "reportState": r.report_state,
                "assignedToUserId": r.assigned_to_user_id,
                "createdAt": r.createdAt.isoformat(),
                "resolvedAt": r.resolvedAt.isoformat() if r.resolvedAt else None,
            }
            for r in reports
        ]

    async def update_conduct_report(self, report_id: str, payload: Dict[str, Any]) -> dict:
        report_uuid = uuid.UUID(report_id)
        stmt = select(ConductReport).where(ConductReport.id == report_uuid)
        res = await self.db.execute(stmt)
        report = res.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=404, detail="Conduct report not found.")
        
        if "reportState" in payload:
            report.report_state = payload["reportState"]
        if "assignedToUserId" in payload:
            report.assigned_to_user_id = payload["assignedToUserId"]
        if payload.get("reportState") == "resolved":
            report.resolvedAt = datetime.now(timezone.utc)

        await self.db.commit()
        return {"status": "updated", "id": report_id}

    async def create_conduct_report(self, user_id: str, payload: Dict[str, Any]) -> dict:
        raw_cid = (
            payload.get("session_id")
            or payload.get("sessionId")
            or payload.get("conversation_id")
            or payload.get("conversationId")
        )
        if not raw_cid:
            raise HTTPException(status_code=400, detail="Missing conversation_id or session_id.")

        try:
            c_uuid = uuid.UUID(str(raw_cid))
        except (ValueError, AttributeError):
            c_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(raw_cid))

        notes = payload.get("notes") or ""
        reason = payload.get("reason") or ""
        raw_details = payload.get("details") or ""

        combined_details = raw_details or notes or reason or ""
        if reason and notes and combined_details != f"[{reason}] {notes}":
            combined_details = f"[{reason}] {notes}"

        ct, kv = (None, None)
        if combined_details:
            ct, kv = encrypt_content(str(combined_details))

        category = (
            payload.get("category_code")
            or payload.get("categoryCode")
            or reason
            or "GENERAL"
        )

        rep = ConductReport(
            id=uuid.uuid4(),
            conversation_id=c_uuid,
            reporter_user_id=user_id or payload.get("reporter_user_id") or "usr-demo-member-01",
            reported_user_id=payload.get("reported_user_id") or payload.get("reportedUserId"),
            category_code=category,
            details_ciphertext=ct,
            key_version=kv,
            severity=payload.get("severity", "routine"),
            report_state="open",
            createdAt=datetime.now(timezone.utc)
        )
        self.db.add(rep)
        await self.db.commit()
        await self.db.refresh(rep)

        return {
            "status": "created",
            "report_id": str(rep.id),
            "id": str(rep.id),
            "conversation_id": str(rep.conversation_id),
            "session_id": str(raw_cid),
            "category_code": rep.category_code,
            "report_state": rep.report_state,
            "severity": rep.severity,
            "created_at": rep.createdAt.isoformat()
        }

    async def toggle_listener_active(self, user_id: str) -> dict:
        stmt = select(ListenerProfile).where(ListenerProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        profile = res.scalar_one_or_none()
        if not profile:
            profile = ListenerProfile(
                id=uuid.uuid4(),
                user_id=user_id,
                application_state="approved",
                eligibility_state="eligible",
                capacity_limit=3,
                active_now=True
            )
            self.db.add(profile)
        else:
            profile.active_now = not getattr(profile, "active_now", False)

        await self.db.commit()
        await self.db.refresh(profile)
        return {
            "status": "success",
            "active_now": profile.active_now,
            "is_online": profile.active_now
        }

    async def get_supervisor_assignments(self) -> list[dict]:
        stmt = select(ListenerSupervisorAssignment).where(
            ListenerSupervisorAssignment.assignment_state == "active"
        ).order_by(desc(ListenerSupervisorAssignment.assigned_at))
        res = await self.db.execute(stmt)
        assignments = res.scalars().all()
        return [
            {
                "id": str(a.id),
                "listenerId": str(a.listener_id),
                "supervisorUserId": a.supervisor_user_id,
                "assignmentState": a.assignment_state,
                "assignedByUserId": a.assigned_by_user_id,
                "assignedAt": a.assigned_at.isoformat(),
                "endedAt": a.ended_at.isoformat() if a.ended_at else None,
                "reasonCode": a.reason_code,
            }
            for a in assignments
        ]

    async def create_supervisor_assignment(self, user_id: str, payload: Dict[str, Any]) -> dict:
        assignment = ListenerSupervisorAssignment(
            listener_id=uuid.UUID(payload["listenerId"]),
            supervisor_user_id=payload["supervisorUserId"],
            assigned_by_user_id=user_id,
            reason_code=payload.get("reasonCode", "onboarding_supervision")
        )
        self.db.add(assignment)
        await self.db.commit()
        return {"status": "assigned", "id": str(assignment.id)}

    # ─── SAFETY & CRISIS OPERATIONS ─────────────────────────────────────────────

    async def get_safety_resources(self, region_code: str = "IN", locale: str = "en") -> list[dict]:
        stmt = select(CrisisResource).where(
            CrisisResource.region_code == region_code,
            CrisisResource.locale == locale
        ).order_by(desc(CrisisResource.last_verified_at))
        res = await self.db.execute(stmt)
        resources = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "regionCode": r.region_code,
                "locale": r.locale,
                "resourceType": r.resource_type,
                "displayName": r.display_name,
                "contactDetails": r.contact_details,
                "sourceUrl": r.source_url,
                "verificationState": r.verification_state,
                "lastVerifiedAt": r.last_verified_at.isoformat() if r.last_verified_at else None,
                "effectiveFrom": r.effective_from.isoformat() if r.effective_from else None,
                "effectiveTo": r.effective_to.isoformat() if r.effective_to else None,
            }
            for r in resources
        ]

    async def get_safety_cases(self) -> list[dict]:
        stmt = select(SafetyCase).order_by(desc(SafetyCase.created_at)).limit(100)
        res = await self.db.execute(stmt)
        cases = res.scalars().all()
        return [
            {
                "id": str(c.id),
                "memberId": c.member_id,
                "sourceType": c.source_type,
                "sourceRecordId": str(c.source_record_id) if c.source_record_id else None,
                "triggerCode": c.trigger_code,
                "policyVersion": c.policy_version,
                "caseState": c.case_state,
                "priorityCode": c.priority_code,
                "jurisdiction": c.jurisdiction,
                "assignedResponderUserId": c.assigned_responder_user_id,
                "createdAt": c.created_at.isoformat(),
                "acknowledgedAt": c.acknowledged_at.isoformat() if c.acknowledged_at else None,
                "closedAt": c.closed_at.isoformat() if c.closed_at else None,
                "resolutionCode": c.resolution_code,
            }
            for c in cases
        ]

    async def create_safety_case(self, payload: Dict[str, Any]) -> dict:
        member_id = payload.get("member_id") or payload.get("memberId")
        source_type = payload.get("source_type") or payload.get("sourceType", "intake_screener")

        # Parse source_record_id into UUID if present
        source_rec_raw = payload.get("source_record_id") or payload.get("sourceRecordId")
        source_record_id = None
        if source_rec_raw:
            if isinstance(source_rec_raw, uuid.UUID):
                source_record_id = source_rec_raw
            else:
                try:
                    source_record_id = uuid.UUID(str(source_rec_raw))
                except (ValueError, AttributeError):
                    source_record_id = uuid.uuid5(uuid.NAMESPACE_DNS, str(source_rec_raw))

        trigger_code = payload.get("trigger_code") or payload.get("triggerCode", "high_distress_alert")
        policy_version = payload.get("policy_version") or payload.get("policyVersion", "v1.0")
        priority_code = payload.get("priority_code") or payload.get("priorityCode", "p1_urgent")
        jurisdiction = payload.get("jurisdiction") or payload.get("jurisdiction", "IN")
        case_state = payload.get("case_state") or payload.get("caseState", "new")

        sc = SafetyCase(
            member_id=member_id,
            source_type=source_type,
            source_record_id=source_record_id,
            trigger_code=trigger_code,
            policy_version=policy_version,
            case_state=case_state,
            priority_code=priority_code,
            jurisdiction=jurisdiction,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(sc)
        await self.db.commit()
        await self.db.refresh(sc)
        return {
            "status": "created",
            "id": str(sc.id),
            "case_id": str(sc.id),
            "source_record_id": str(sc.source_record_id) if sc.source_record_id else None,
            "member_id": sc.member_id,
            "priority_code": sc.priority_code,
        }

    async def get_safety_case_actions(self, case_id: str) -> list[dict]:
        case_uuid = uuid.UUID(case_id)
        stmt = select(SafetyCaseAction).where(SafetyCaseAction.case_id == case_uuid).order_by(SafetyCaseAction.occurred_at)
        res = await self.db.execute(stmt)
        actions = res.scalars().all()
        return [
            {
                "id": str(a.id),
                "caseId": str(a.case_id),
                "actorUserId": a.actor_user_id,
                "actionType": a.action_type,
                "actionState": a.action_state,
                "resourceId": str(a.resource_id) if a.resource_id else None,
                "occurredAt": a.occurred_at.isoformat(),
            }
            for a in actions
        ]

    async def get_safety_followups(self) -> list[dict]:
        stmt = select(Followup).order_by(Followup.scheduled_at).limit(100)
        res = await self.db.execute(stmt)
        followups = res.scalars().all()
        return [
            {
                "id": str(f.id),
                "memberId": f.member_id,
                "sourceType": f.source_type,
                "sourceRecordId": str(f.source_record_id) if f.source_record_id else None,
                "scheduledAt": f.scheduled_at.isoformat(),
                "followupState": f.followup_state,
                "createdAt": f.created_at.isoformat(),
                "completedAt": f.completed_at.isoformat() if f.completed_at else None,
            }
            for f in followups
        ]

    async def create_safety_case_action(self, case_id: str, user_id: str, payload: Dict[str, Any]) -> dict:
        case_uuid = uuid.UUID(case_id)
        stmt = select(SafetyCase).where(SafetyCase.id == case_uuid)
        res = await self.db.execute(stmt)
        case = res.scalar_one_or_none()
        if not case:
            raise HTTPException(status_code=404, detail="Safety case not found.")

        raw_state = payload.get("action_state") or payload.get("actionState", "completed")
        state_map = {"completed": "completed", "attempted": "attempted", "failed": "failed"}
        action_state = state_map.get(raw_state.lower(), "completed")

        action_type = payload.get("action_type") or payload.get("actionType", "triage_assessment")
        actor_id = payload.get("actor_user_id") or payload.get("actorUserId") or user_id or "usr-demo-safety-01"
        resource_id_str = payload.get("resource_id") or payload.get("resourceId")
        resource_uuid = uuid.UUID(resource_id_str) if resource_id_str else None

        notes = payload.get("notes") or payload.get("details", "")
        ct, kv = (None, None)
        if notes:
            ct, kv = encrypt_content(str(notes))

        action = SafetyCaseAction(
            id=uuid.uuid4(),
            case_id=case_uuid,
            actor_user_id=actor_id,
            action_type=action_type,
            action_state=action_state,
            resource_id=resource_uuid,
            details_ciphertext=ct,
            key_version=kv,
            occurred_at=datetime.now(timezone.utc),
        )
        self.db.add(action)

        audit = AuditEvent(
            id=uuid.uuid4(),
            actor_user_id=actor_id,
            action_code="safety_case_action_logged",
            resource_type="safety_case_action",
            resource_id=str(action.id),
            outcome="success",
            details={"case_id": str(case_uuid), "action_type": action_type, "action_state": action_state}
        )
        self.db.add(audit)
        await self.db.commit()

        return {
            "id": str(action.id),
            "caseId": str(action.case_id),
            "actorUserId": action.actor_user_id,
            "actionType": action.action_type,
            "actionState": action.action_state,
            "resourceId": str(action.resource_id) if action.resource_id else None,
            "occurredAt": action.occurred_at.isoformat(),
        }

    async def update_safety_case(self, case_id: str, payload: Dict[str, Any]) -> dict:
        case_uuid = uuid.UUID(case_id)
        stmt = select(SafetyCase).where(SafetyCase.id == case_uuid)
        res = await self.db.execute(stmt)
        case = res.scalar_one_or_none()
        if not case:
            raise HTTPException(status_code=404, detail="Safety case not found.")

        new_state = payload.get("case_state") or payload.get("caseState")
        if new_state:
            state_clean = new_state.lower().replace("-", "_").replace(" ", "_")
            if state_clean in ["new", "queued", "assigned", "in_progress", "handed_off", "closed"]:
                case.case_state = state_clean
            elif state_clean in ["review", "in_review"]:
                case.case_state = "in_progress"

        new_priority = payload.get("priority_code") or payload.get("priorityCode")
        if new_priority:
            priority_map = {
                "p0_emergency": "emergency",
                "emergency": "emergency",
                "p1_urgent": "urgent",
                "urgent": "urgent",
                "p2_elevated": "routine",
                "routine": "routine",
            }
            case.priority_code = priority_map.get(new_priority.lower(), "routine")

        new_res = payload.get("resolution_code") or payload.get("resolutionCode")
        if new_res:
            case.resolution_code = new_res
            if not case.closed_at:
                case.closed_at = datetime.now(timezone.utc)

        responder = payload.get("assigned_responder_user_id") or payload.get("assignedResponderUserId")
        if responder:
            case.assigned_responder_user_id = responder
            if not case.acknowledged_at:
                case.acknowledged_at = datetime.now(timezone.utc)

        if case.case_state == "closed" and not case.closed_at:
            case.closed_at = datetime.now(timezone.utc)

        audit = AuditEvent(
            id=uuid.uuid4(),
            actor_user_id=case.assigned_responder_user_id or "usr-demo-safety-01",
            action_code="safety_case_updated",
            resource_type="safety_case",
            resource_id=str(case.id),
            outcome="success",
            details={
                "case_state": case.case_state,
                "priority_code": case.priority_code,
                "resolution_code": case.resolution_code,
            }
        )
        self.db.add(audit)
        await self.db.commit()

        return {
            "id": str(case.id),
            "memberId": case.member_id,
            "caseState": case.case_state,
            "priorityCode": case.priority_code,
            "resolutionCode": case.resolution_code,
            "assignedResponderUserId": case.assigned_responder_user_id,
            "acknowledgedAt": case.acknowledged_at.isoformat() if case.acknowledged_at else None,
            "closedAt": case.closed_at.isoformat() if case.closed_at else None,
        }

    async def update_safety_followup(self, followup_id: str, payload: Dict[str, Any]) -> dict:
        f_uuid = uuid.UUID(followup_id)
        stmt = select(Followup).where(Followup.id == f_uuid)
        res = await self.db.execute(stmt)
        followup = res.scalar_one_or_none()
        if not followup:
            raise HTTPException(status_code=404, detail="Followup not found.")

        raw_state = payload.get("followup_state") or payload.get("followupState") or payload.get("status", "responded")
        state_map = {
            "completed": "responded",
            "responded": "responded",
            "scheduled": "scheduled",
            "sent": "sent",
            "skipped": "skipped",
            "cancelled": "cancelled",
        }
        followup.followup_state = state_map.get(raw_state.lower(), "responded")
        followup.completed_at = datetime.now(timezone.utc)

        await self.db.commit()
        return {
            "id": str(followup.id),
            "memberId": followup.member_id,
            "followupState": followup.followup_state,
            "completedAt": followup.completed_at.isoformat() if followup.completed_at else None,
        }

    # ─── PLATFORM ADMINISTRATION & GOVERNANCE ───────────────────────────────────

    async def get_admin_roles(self) -> list[dict]:
        stmt = select(RoleAssignment).order_by(desc(RoleAssignment.granted_at)).limit(100)
        res = await self.db.execute(stmt)
        roles = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "userId": r.user_id,
                "roleCode": r.role_code,
                "assignmentState": r.assignment_state,
                "grantedByUserId": r.granted_by_user_id,
                "grantedAt": r.granted_at.isoformat(),
                "expiresAt": r.expires_at.isoformat() if r.expires_at else None,
            }
            for r in roles
        ]

    async def assign_admin_role(self, user_id: str, payload: Dict[str, Any]) -> dict:
        target_user = payload.get("user_id") or payload.get("userId")
        role_code = payload.get("role_code") or payload.get("role") or payload.get("roleCode")
        if not target_user or not role_code:
            raise HTTPException(status_code=400, detail="Missing user_id or role_code.")

        p_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == target_user))
        if not p_res.scalar_one_or_none():
            self.db.add(AppPrincipal(user_id=target_user, account_state="active"))
            await self.db.flush()

        role_assignment = RoleAssignment(
            id=uuid.uuid4(),
            user_id=target_user,
            role_code=role_code,
            assignment_state="active",
            granted_by_user_id=user_id or "usr-demo-admin-01",
            granted_at=datetime.now(timezone.utc),
            decision_reason=payload.get("decision_reason") or payload.get("reason", "Admin role assignment")
        )
        self.db.add(role_assignment)

        audit = AuditEvent(
            id=uuid.uuid4(),
            actor_user_id=user_id or "usr-demo-admin-01",
            action_code="role_assigned",
            resource_type="role_assignment",
            resource_id=str(role_assignment.id),
            outcome="success",
            details={"user_id": target_user, "role_code": role_code}
        )
        self.db.add(audit)
        await self.db.commit()

        return {
            "id": str(role_assignment.id),
            "userId": role_assignment.user_id,
            "roleCode": role_assignment.role_code,
            "assignmentState": role_assignment.assignment_state,
            "grantedByUserId": role_assignment.granted_by_user_id,
            "grantedAt": role_assignment.granted_at.isoformat(),
        }

    async def revoke_admin_role(self, role_id: str, actor_user_id: str) -> dict:
        r_uuid = uuid.UUID(role_id) if len(role_id) == 36 else None
        stmt = select(RoleAssignment)
        if r_uuid:
            stmt = stmt.where(RoleAssignment.id == r_uuid)
        else:
            stmt = stmt.where(RoleAssignment.user_id == role_id)
        res = await self.db.execute(stmt)
        assignment = res.scalar_one_or_none()
        if not assignment:
            raise HTTPException(status_code=404, detail="Role assignment not found.")

        assignment.assignment_state = "revoked"
        assignment.revoked_at = datetime.now(timezone.utc)

        audit = AuditEvent(
            id=uuid.uuid4(),
            actor_user_id=actor_user_id or "usr-demo-admin-01",
            action_code="role_revoked",
            resource_type="role_assignment",
            resource_id=str(assignment.id),
            outcome="success",
            details={"user_id": assignment.user_id, "role_code": assignment.role_code}
        )
        self.db.add(audit)
        await self.db.commit()

        return {
            "status": "revoked",
            "id": str(assignment.id),
            "userId": assignment.user_id,
            "roleCode": assignment.role_code,
            "revokedAt": assignment.revoked_at.isoformat()
        }

    async def get_workflow_definitions(self) -> list[dict]:
        stmt = select(WorkflowDefinition).order_by(WorkflowDefinition.created_at).limit(50)
        res = await self.db.execute(stmt)
        defs = res.scalars().all()
        return [
            {
                "id": str(d.id),
                "processCode": d.process_code,
                "version": d.version,
                "status": d.status,
                "policyVersion": d.policy_version,
                "createdAt": d.created_at.isoformat(),
            }
            for d in defs
        ]

    async def get_workflow_executions(self) -> list[dict]:
        stmt = select(WorkflowExecution).order_by(desc(WorkflowExecution.started_at)).limit(50)
        res = await self.db.execute(stmt)
        execs = res.scalars().all()
        return [
            {
                "id": str(e.id),
                "definitionId": str(e.definition_id),
                "temporalWorkflowId": e.temporal_workflow_id,
                "subjectType": e.subject_type,
                "subjectId": e.subject_id,
                "status": e.status,
                "startedAt": e.started_at.isoformat(),
                "closedAt": e.closed_at.isoformat() if e.closed_at else None,
            }
            for e in execs
        ]

    async def get_workflow_tasks(self) -> list[dict]:
        stmt = select(WorkflowTask).order_by(desc(WorkflowTask.due_at)).limit(50)
        res = await self.db.execute(stmt)
        tasks = res.scalars().all()
        return [
            {
                "id": str(t.id),
                "executionId": str(t.execution_id),
                "taskCode": t.task_code,
                "assigneeUserId": t.assignee_user_id,
                "requiredRole": t.required_role,
                "status": t.status,
                "dueAt": t.due_at.isoformat() if t.due_at else None,
                "completedAt": t.completed_at.isoformat() if t.completed_at else None,
            }
            for t in tasks
        ]

    async def get_admin_notifications(self) -> list[dict]:
        stmt = select(Notification).order_by(desc(Notification.created_at)).limit(50)
        res = await self.db.execute(stmt)
        notifs = res.scalars().all()
        return [
            {
                "id": str(n.id),
                "userId": n.user_id,
                "notificationType": n.notification_type,
                "channel": n.channel,
                "deliveryState": n.delivery_state,
                "scheduledAt": n.scheduled_at.isoformat(),
                "sentAt": n.sent_at.isoformat() if n.sent_at else None,
                "createdAt": n.created_at.isoformat(),
            }
            for n in notifs
        ]

    async def get_admin_self_help_content(self) -> list[dict]:
        stmt = select(SelfHelpContent).order_by(SelfHelpContent.created_at).limit(50)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [
            {
                "id": str(i.id),
                "contentCode": i.content_code,
                "contentType": i.content_type,
                "title": i.title,
                "locale": i.locale,
                "contentVersion": i.content_version,
                "body": i.body,
                "reviewState": i.review_state,
                "createdAt": i.created_at.isoformat(),
            }
            for i in items
        ]

    async def get_admin_outbox_events(self) -> list[dict]:
        stmt = select(OutboxEvent).order_by(desc(OutboxEvent.created_at)).limit(50)
        res = await self.db.execute(stmt)
        events = res.scalars().all()
        return [
            {
                "id": str(e.id),
                "aggregateType": e.aggregate_type,
                "aggregateId": e.aggregate_id,
                "eventType": e.event_type,
                "payload": e.payload,
                "publishedAt": e.published_at.isoformat() if e.published_at else None,
                "createdAt": e.created_at.isoformat(),
            }
            for e in events
        ]

    async def get_admin_audit_events(self) -> list[dict]:
        stmt = select(AuditEvent).order_by(desc(AuditEvent.occurred_at)).limit(50)
        res = await self.db.execute(stmt)
        audits = res.scalars().all()
        return [
            {
                "id": str(a.id),
                "occurredAt": a.occurred_at.isoformat(),
                "actorUserId": a.actor_user_id,
                "actionCode": a.action_code,
                "resourceType": a.resource_type,
                "resourceId": a.resource_id,
                "outcome": a.outcome,
                "details": a.details,
            }
            for a in audits
        ]

    async def get_privacy_requests(self, user_id: str) -> list[dict]:
        stmt = select(PrivacyRequest).where(PrivacyRequest.member_id == user_id).order_by(desc(PrivacyRequest.requested_at))
        res = await self.db.execute(stmt)
        requests = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "memberId": r.member_id,
                "requestType": r.request_type,
                "requestState": r.request_state,
                "requestedAt": r.requested_at.isoformat(),
                "fulfilledAt": r.fulfilled_at.isoformat() if r.fulfilled_at else None,
                "decisionReason": r.decision_reason,
            }
            for r in requests
        ]

    async def create_privacy_request(self, user_id: str, payload: Dict[str, Any]) -> dict:
        pr = PrivacyRequest(
            member_id=user_id,
            request_type=payload.get("requestType", "export_data"),
            request_state="submitted"
        )
        self.db.add(pr)
        await self.db.commit()
        await self.db.refresh(pr)
        return {"status": "submitted", "id": str(pr.id)}

    def get_session_policy(self) -> dict:
        return {
            "maxSessionAgeMinutes": 480,
            "idleTimeoutMinutes": 60,
            "requireMfa": False,
            "tokenRotationEnabled": True,
        }


def get_operations_service(db: AsyncSession = Depends(get_db)) -> OperationsService:
    return OperationsService(db)
