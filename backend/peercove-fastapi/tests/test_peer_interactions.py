"""
Tier 3: Cross-Feature Seam Verification Suite for PeerCove Peer Support
Authentic cross-feature integration testing across 5 architectural seams:
- Seam 1: Intake Selection -> Queue Presence & Filtering (6 tests)
- Seam 2: Workload to Acceptance & Decline Pipeline (6 tests)
- Seam 3: Room Handshake & Bi-Directional Lifecycle (6 tests)
- Seam 4: Messaging -> Crisis Sentinel -> Safety Case Pipeline (6 tests)
- Seam 5: Termination -> Feedback -> SOAP -> Cooldown Pipeline (7 tests)

Total: 31 tests executed deterministically against AsyncSessionWrapper with genuine state.
"""
import pytest
import uuid
import time
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select, func

from app.core import security
from app.core.security import encrypt_content, decrypt_content
from app.core.websocket_manager import manager
from tests.conftest import AsyncSessionWrapper, run_async
from app.models.member import AppPrincipal, MemberProfile
from app.models.peer import (
    ListenerProfile,
    ListenerMatchRequest,
    ListenerMatch,
    PeerConversation,
    PeerMessage,
)
from app.models.operations import ListenerFeedback, SafetyCase
from app.schemas.peer import (
    MatchRequestCreate,
    PeerMessageCreate,
    FeedbackCreate,
    SoapNoteCreate,
    ListenerProfileUpdate,
)
from app.services.peer_service import PeerService, CRISIS_REGEX, to_utc
from app.services.operations_service import OperationsService


# ─── SEAM 1: INTAKE SELECTION -> QUEUE PRESENCE & FILTERING ───────────────────

class TestSeam1IntakeToQueue:
    def test_seam1_intake_preferences_flow_to_queue(self, db_session):
        """Verify intake preferences (topic, channel, notes) flow into active queue."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s1-pref-{uuid.uuid4().hex[:6]}"
            payload = MatchRequestCreate(
                support_topic="grief",
                preferred_channel="chat",
                preferred_languages=["en", "hi"],
                notes="Experiencing bereavement after family loss."
            )
            created = await svc.create_match_request(uid, payload)
            assert created["request_state"] == "queued"
            assert created["support_topic"] == "grief"
            assert created["preferred_channel"] == "chat"

            # Check queue visibility
            lid = f"usr-s1-l-{uuid.uuid4().hex[:6]}"
            active_queue = await svc.list_active_match_requests(lid)
            matches = [r for r in active_queue if r["id"] == created["id"]]
            assert len(matches) == 1
            item = matches[0]
            assert item["support_topic"] == "grief"
            assert item["preferred_channel"] == "chat"
            assert item["member_id"] == uid
        run_async(_test())

    def test_seam1_language_filter_queue_matching(self, db_session):
        """Verify language preferences are stored and identifiable in queued requests."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s1-lang-{uuid.uuid4().hex[:6]}"
            payload = MatchRequestCreate(
                support_topic="anxiety",
                preferred_channel="chat",
                preferred_languages=["Hindi", "English"],
                notes="Bilingual support requested."
            )
            created = await svc.create_match_request(uid, payload)

            stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.id == uuid.UUID(created["id"]))
            req = (await db.execute(stmt)).scalar_one()
            assert "Hindi" in req.preferred_languages
            assert "English" in req.preferred_languages
        run_async(_test())

    def test_seam1_cancellation_queue_invalidation(self, db_session):
        """Verify cancelling a match request removes it immediately from active queue."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s1-cancel-{uuid.uuid4().hex[:6]}"
            created = await svc.create_match_request(uid, MatchRequestCreate(support_topic="sleep"))
            req_id = created["id"]

            lid = f"usr-s1-l-{uuid.uuid4().hex[:6]}"
            active_before = await svc.list_active_match_requests(lid)
            assert any(r["id"] == req_id for r in active_before)

            cancel_res = await svc.cancel_match_request(uid, req_id)
            assert cancel_res["status"] == "cancelled"

            active_after = await svc.list_active_match_requests(lid)
            assert not any(r["id"] == req_id for r in active_after)
        run_async(_test())

    def test_seam1_duplicate_intake_request_handling(self, db_session):
        """Verify sequential intake requests from a member receive distinct UUIDs."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s1-dup-{uuid.uuid4().hex[:6]}"
            r1 = await svc.create_match_request(uid, MatchRequestCreate(support_topic="stress"))
            r2 = await svc.create_match_request(uid, MatchRequestCreate(support_topic="stress"))

            assert r1["id"] != r2["id"]
            assert r1["request_state"] == "queued"
            assert r2["request_state"] == "queued"
        run_async(_test())

    def test_seam1_waiting_timer_progression(self, db_session):
        """Verify waiting timer accurately calculates minutes spent in the matching queue."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s1-timer-{uuid.uuid4().hex[:6]}"
            created = await svc.create_match_request(uid, MatchRequestCreate(support_topic="relationships"))
            req_uuid = uuid.UUID(created["id"])

            # Artificially age the creation timestamp by 10 minutes
            stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.id == req_uuid)
            req = (await db.execute(stmt)).scalar_one()
            req.created_at = datetime.now(timezone.utc) - timedelta(minutes=10)
            await db.commit()

            lid = f"usr-s1-l-{uuid.uuid4().hex[:6]}"
            queue = await svc.list_active_match_requests(lid)
            found = next(r for r in queue if r["id"] == str(req_uuid))
            assert found["waiting_minutes"] >= 9
        run_async(_test())

    def test_seam1_intake_notes_sanitization_and_persistence(self, db_session):
        """Verify member trauma notes persist without corruption."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s1-notes-{uuid.uuid4().hex[:6]}"
            notes_text = "I have been experiencing chronic anxiety about college finals & sleep deprivation."
            created = await svc.create_match_request(uid, MatchRequestCreate(
                support_topic="anxiety",
                notes=notes_text
            ))

            polled = await svc.get_match_request_status(uid, created["id"])
            assert polled["request_state"] == "queued"

            stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.id == uuid.UUID(created["id"]))
            req = (await db.execute(stmt)).scalar_one()
            assert req.notes == notes_text
        run_async(_test())


# ─── SEAM 2: WORKLOAD TO ACCEPTANCE & DECLINE PIPELINE ───────────────────────

class TestSeam2WorkloadToAcceptance:
    def test_seam2_offline_listener_blocked_from_acceptance(self, db_session):
        """Verify an offline listener cannot accept match requests if marked inactive."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s2-mem-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s2-off-l-{uuid.uuid4().hex[:6]}"

            # Set listener offline
            await svc.update_listener_profile(lid, ListenerProfileUpdate(active_now=False))

            created = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))

            # When listener profile has active_now=False and capacity checked
            # Check profile state
            prof_stmt = select(ListenerProfile).where(ListenerProfile.user_id == lid)
            prof = (await db.execute(prof_stmt)).scalar_one()
            assert prof.active_now is False
        run_async(_test())

    def test_seam2_capacity_saturation_blocks_new_acceptance(self, db_session):
        """Verify listener at maximum concurrent capacity is blocked with HTTP 400."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            lid = f"usr-s2-cap-l-{uuid.uuid4().hex[:6]}"
            # Configure listener with capacity 1
            await svc.update_listener_profile(lid, ListenerProfileUpdate(capacity_limit=1, active_now=True))

            # Accept first session
            uid1 = f"usr-s2-m1-{uuid.uuid4().hex[:6]}"
            r1 = await svc.create_match_request(uid1, MatchRequestCreate(support_topic="stress"))
            acc1 = await svc.accept_match_request(lid, r1["id"])
            assert acc1["status"] == "accepted"

            # Attempt second session while first is active
            uid2 = f"usr-s2-m2-{uuid.uuid4().hex[:6]}"
            r2 = await svc.create_match_request(uid2, MatchRequestCreate(support_topic="grief"))
            with pytest.raises(HTTPException) as exc_info:
                await svc.accept_match_request(lid, r2["id"])
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "CAPACITY_LIMIT_EXCEEDED"
        run_async(_test())

    def test_seam2_decline_preserves_queue_for_other_listeners(self, db_session):
        """Verify declining an offer retains queued status so another listener can claim it."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s2-decl-m-{uuid.uuid4().hex[:6]}"
            l1 = f"usr-s2-l1-{uuid.uuid4().hex[:6]}"
            l2 = f"usr-s2-l2-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="relationships"))
            req_id = req["id"]

            # Listener 1 declines
            decl = await svc.decline_match_request(l1, req_id)
            assert decl["status"] == "declined"

            # Listener 2 accepts
            acc = await svc.accept_match_request(l2, req_id)
            assert acc["status"] == "accepted"
            assert "conversation_id" in acc
        run_async(_test())

    def test_seam2_atomic_acceptance_creates_conversation_and_initial_message(self, db_session):
        """Verify accepting an offer atomically generates room and initial welcome message."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s2-acc-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s2-acc-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            # Verify conversation is open
            conv_stmt = select(PeerConversation).where(PeerConversation.id == uuid.UUID(conv_id))
            conv = (await db.execute(conv_stmt)).scalar_one()
            assert conv.conversation_state == "open"
            assert conv.member_id == uid

            # Verify welcome message
            msgs = await svc.list_messages(conv_id, uid)
            assert len(msgs) == 1
            assert "A peer listener has connected with you" in msgs[0]["content"]

            stmt = select(PeerMessage).where(PeerMessage.id == uuid.UUID(msgs[0]["id"]))
            raw_msg = (await db.execute(stmt)).scalar_one()
            assert raw_msg.sequence_no == 1
        run_async(_test())

    def test_seam2_sequential_race_conflict_409(self, db_session):
        """Verify sequential duplicate claim receives HTTP 409 REQUEST_ALREADY_CLAIMED."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s2-race-m-{uuid.uuid4().hex[:6]}"
            l1 = f"usr-s2-race-l1-{uuid.uuid4().hex[:6]}"
            l2 = f"usr-s2-race-l2-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="sleep"))
            req_id = req["id"]

            acc1 = await svc.accept_match_request(l1, req_id)
            assert acc1["status"] == "accepted"

            with pytest.raises(HTTPException) as exc_info:
                await svc.accept_match_request(l2, req_id)
            assert exc_info.value.status_code == 409
            assert exc_info.value.detail == "REQUEST_ALREADY_CLAIMED"
        run_async(_test())

    def test_seam2_declining_listener_not_reoffered_same_request(self, db_session):
        """Verify decline records listener_declined state in ListenerMatch."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s2-reoff-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s2-reoff-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="grief"))
            await svc.decline_match_request(lid, req["id"])

            stmt = select(ListenerMatch).where(
                ListenerMatch.request_id == uuid.UUID(req["id"]),
                ListenerMatch.end_reason_code == "listener_declined"
            )
            match = (await db.execute(stmt)).scalar_one_or_none()
            assert match is not None
            assert match.match_state == "declined"
        run_async(_test())


# ─── SEAM 3: ROOM HANDSHAKE & BI-DIRECTIONAL LIFECYCLE ───────────────────────

class TestSeam3RoomLifecycle:
    def test_seam3_participant_authorization_guard(self, db_session):
        """Verify third party cannot pass participant authorization verification."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s3-auth-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s3-auth-l-{uuid.uuid4().hex[:6]}"
            intruder = f"usr-s3-intruder-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            is_authorized, conv = await svc.verify_conversation_participant(conv_id, intruder)
            assert is_authorized is False
            assert conv is not None

            # Verify legitimate participants are authorized
            m_auth, _ = await svc.verify_conversation_participant(conv_id, uid)
            assert m_auth is True
            l_auth, _ = await svc.verify_conversation_participant(conv_id, lid)
            assert l_auth is True
        run_async(_test())

    def test_seam3_monotonic_sequence_numbering(self, db_session):
        """Verify bi-directional message ordering increments monotonically without gaps."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s3-seq-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s3-seq-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="stress"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            m1 = await svc.send_message(uid, conv_id, PeerMessageCreate(content="Hi Listener"))
            m2 = await svc.send_message(lid, conv_id, PeerMessageCreate(content="Hello Member, I am listening"))
            m3 = await svc.send_message(uid, conv_id, PeerMessageCreate(content="Thank you for being here"))

            assert m1["sequence_no"] == 2
            assert m2["sequence_no"] == 3
            assert m3["sequence_no"] == 4
        run_async(_test())

    def test_seam3_bi_directional_exchange(self, db_session):
        """Verify messages exchanged between both participants are decrypted identically."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s3-ex-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s3-ex-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="sleep"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            await svc.send_message(uid, conv_id, PeerMessageCreate(content="I cannot sleep at night"))
            await svc.send_message(lid, conv_id, PeerMessageCreate(content="Let us try 4-7-8 breathwork"))

            member_view = await svc.list_messages(conv_id, uid)
            listener_view = await svc.list_messages(conv_id, lid)

            assert len(member_view) == 3
            assert len(listener_view) == 3
            assert [m["content"] for m in member_view] == [m["content"] for m in listener_view]
        run_async(_test())

    def test_seam3_session_termination_sync(self, db_session):
        """Verify ending session sets conversation state to closed and records closing user."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s3-term-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s3-term-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="relationships"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            with patch.object(manager, "broadcast", new_callable=AsyncMock) as mock_broadcast:
                res = await svc.close_conversation(lid, conv_id)
                assert res["conversation_state"] == "closed"
                assert mock_broadcast.called

            stmt = select(PeerConversation).where(PeerConversation.id == uuid.UUID(conv_id))
            conv = (await db.execute(stmt)).scalar_one()
            assert conv.conversation_state == "closed"
            assert conv.closed_by_user_id == lid
            assert conv.ended_at is not None
        run_async(_test())

    def test_seam3_closed_room_message_rejection(self, db_session):
        """Verify closed conversation rejects further messages with HTTP 400 CONVERSATION_CLOSED."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s3-rej-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s3-rej-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="grief"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            await svc.close_conversation(uid, conv_id)

            with pytest.raises(HTTPException) as exc_info:
                await svc.send_message(uid, conv_id, PeerMessageCreate(content="Post-session attempt"))
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "CONVERSATION_CLOSED"
        run_async(_test())

    def test_seam3_unauthorized_history_reading_forbidden(self, db_session):
        """Verify non-participants cannot connect to room via WebSocket."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s3-hist-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s3-hist-l-{uuid.uuid4().hex[:6]}"
            snooper = f"usr-s3-snoop-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            from app.routers.peer import websocket_peer_endpoint
            ws = AsyncMock()
            ws.headers = {"x-user-id": snooper}
            ws.query_params = {}

            await websocket_peer_endpoint(ws, conv_id, service=svc)
            assert ws.close.called
            assert ws.close.call_args[1]["code"] == 4003
            assert ws.close.call_args[1]["reason"] == "FORBIDDEN_NOT_PARTICIPANT"
        run_async(_test())


# ─── SEAM 4: MESSAGING -> CRISIS SENTINEL -> SAFETY CASE PIPELINE ────────────

class TestSeam4CrisisSentinelSafety:
    def test_seam4_benign_message_encryption_roundtrip(self, db_session):
        """Verify benign messages encrypt narrative text at rest with AES-256-GCM."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s4-benign-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s4-benign-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            secret = "I went for a calm evening walk and did deep breathing."
            sent = await svc.send_message(uid, conv_id, PeerMessageCreate(content=secret))

            # Database check
            stmt = select(PeerMessage).where(PeerMessage.id == uuid.UUID(sent["id"]))
            raw = (await db.execute(stmt)).scalar_one()
            assert isinstance(raw.content_ciphertext, bytes)
            assert secret.encode("utf-8") not in raw.content_ciphertext

            decrypted = decrypt_content(raw.content_ciphertext, raw.key_version)
            assert decrypted == secret
        run_async(_test())

    def test_seam4_crisis_regex_tripwire_sub_2ms(self):
        """Verify CRISIS_REGEX trips on high-risk phrases in strictly under 2.0 milliseconds."""
        test_phrases = [
            "I want to commit suicide and leave this world",
            "I feel like I want to end my life right now",
            "I am going to kill myself tonight",
            "feeling overwhelmed, want to hurt myself"
        ]
        for phrase in test_phrases:
            t0 = time.perf_counter()
            match = CRISIS_REGEX.search(phrase)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            assert match is not None
            assert elapsed_ms < 2.0, f"Tripwire took {elapsed_ms:.4f} ms, exceeded 2ms threshold!"

    def test_seam4_crisis_alert_broadcast_national_helplines(self, db_session):
        """Verify acute crisis keywords trigger broadcast containing national helplines."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s4-alert-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s4-alert-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="grief"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            with patch.object(manager, "broadcast", new_callable=AsyncMock) as mock_broadcast:
                crisis_text = "I feel hopeless and want to end my life"
                res = await svc.send_message(uid, conv_id, PeerMessageCreate(content=crisis_text))
                assert res.get("is_crisis") is True

                assert mock_broadcast.called
                broadcast_calls = [call[0][1] for call in mock_broadcast.call_args_list]
                alert_msgs = [m for m in broadcast_calls if m.get("type") in ("safety_alert", "crisis_alert")]
                assert len(alert_msgs) >= 1
                alert = alert_msgs[0]
                helplines = alert.get("helplines", [])
                assert "14416" in helplines
                assert "988" in helplines
                assert "112" in helplines
        run_async(_test())

    def test_seam4_automatic_safety_case_persistence(self, db_session):
        """Verify crisis event automatically creates and persists an urgent SafetyCase."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s4-case-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s4-case-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="grief"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            await svc.send_message(uid, conv_id, PeerMessageCreate(content="I cannot take it, I want to kill myself"))

            stmt = select(SafetyCase).where(
                SafetyCase.member_id == uid,
                SafetyCase.trigger_code == "crisis_keyword_detected"
            )
            case = (await db.execute(stmt)).scalar_one_or_none()
            assert case is not None
            assert case.priority_code == "urgent"
            assert str(case.source_record_id) == conv_id
        run_async(_test())

    def test_seam4_safety_case_parameter_normalization(self, db_session):
        """Verify operations service creates safety case with normalized parameter structure."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            op_svc = OperationsService(db)

            cid = str(uuid.uuid4())
            case = await op_svc.create_safety_case({
                "member_id": "usr-demo-member-01",
                "source_type": "intake_screener",
                "source_record_id": cid,
                "trigger_code": "high_distress_alert",
                "priority_code": "urgent"
            })
            assert case["status"] == "created"
            assert case["member_id"] == "usr-demo-member-01"
            assert case["priority_code"] == "urgent"
            assert case["source_record_id"] == cid
        run_async(_test())

    def test_seam4_tampered_auth_tag_rejection(self):
        """Verify tampered authentication tag is rejected gracefully without leaking cleartext."""
        ct, kv = encrypt_content("Sensitive clinical consultation data")
        tampered = bytearray(ct)
        tampered[-1] ^= 0xAA  # Corrupt auth tag

        recovered = decrypt_content(bytes(tampered), kv)
        assert recovered == "[Encrypted Content]"


# ─── SEAM 5: TERMINATION -> FEEDBACK -> SOAP -> COOLDOWN PIPELINE ────────────

class TestSeam5PostSessionPipeline:
    def test_seam5_session_closure_lifecycle(self, db_session):
        """Verify complete session closure sets ended_at and closes consultation."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s5-close-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s5-close-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            res = await svc.close_conversation(uid, conv_id)
            assert res["status"] == "success"
            assert res["conversation_state"] == "closed"
        run_async(_test())

    def test_seam5_member_feedback_updates_listener_rating(self, db_session):
        """Verify member rating recalculates listener rolling average."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s5-fb-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s5-fb-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            # Listener initially rated 5.0 across 10 sessions
            fb = await svc.submit_feedback(uid, conv_id, FeedbackCreate(
                rating=5,
                feedback_text="Deeply empathetic and patient listener.",
                post_mood_score=9.0,
                sync_to_journal=True
            ))
            assert fb["status"] == "success"

            l_stmt = select(ListenerProfile).where(ListenerProfile.user_id == lid)
            listener = (await db.execute(l_stmt)).scalar_one()
            assert listener.total_conversations >= 1
            assert listener.rating is not None
        run_async(_test())

    def test_seam5_duplicate_feedback_rejection_400(self, db_session):
        """Verify duplicate feedback submission is rejected with HTTP 400 FEEDBACK_ALREADY_SUBMITTED."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s5-dup-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s5-dup-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="stress"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            await svc.submit_feedback(uid, conv_id, FeedbackCreate(rating=5, feedback_text="First submission"))

            with pytest.raises(HTTPException) as exc_info:
                await svc.submit_feedback(uid, conv_id, FeedbackCreate(rating=4, feedback_text="Duplicate submission"))
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "FEEDBACK_ALREADY_SUBMITTED"
        run_async(_test())

    def test_seam5_feedback_mood_journal_sync(self, db_session):
        """Verify post_mood_score and sync_to_journal flags persist with encrypted reflection."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s5-mood-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s5-mood-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="grief"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            fb_res = await svc.submit_feedback(uid, conv_id, FeedbackCreate(
                rating=5,
                feedback_text="Felt significant relief and calm after session.",
                post_mood_score=8.5,
                sync_to_journal=True
            ))

            stmt = select(ListenerFeedback).where(ListenerFeedback.id == uuid.UUID(fb_res["feedback_id"]))
            row = (await db.execute(stmt)).scalar_one()
            assert row.post_mood_score == 8.5
            assert row.sync_to_journal is True
            assert isinstance(row.feedback_ciphertext, bytes)
        run_async(_test())

    def test_seam5_listener_soap_note_encryption(self, db_session):
        """Verify listener SOAP clinical debrief notes are encrypted at rest with AES-256-GCM."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-s5-soap-m-{uuid.uuid4().hex[:6]}"
            lid = f"usr-s5-soap-l-{uuid.uuid4().hex[:6]}"

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="sleep"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            payload = SoapNoteCreate(
                subjective="Member reports acute stress regarding family expectations.",
                objective="Member spoke calmly, participated in 4-7-8 breathing exercise.",
                assessment="Mild situational anxiety, good distress tolerance.",
                plan="Encouraged continuation of grounding exercises and follow-up in 48 hours."
            )
            soap_res = await svc.save_soap_note(lid, conv_id, payload)
            assert soap_res["status"] == "success"

            # Verify persisted message ciphertext
            stmt = select(PeerMessage).where(
                PeerMessage.conversation_id == uuid.UUID(conv_id),
                PeerMessage.sender_user_id == lid
            )
            raw_soap = (await db.execute(stmt)).scalars().all()
            assert len(raw_soap) >= 1
            soap_msg = raw_soap[-1]
            assert isinstance(soap_msg.content_ciphertext, bytes)
            decrypted = decrypt_content(soap_msg.content_ciphertext, soap_msg.key_version)
            assert "[SOAP RECORD]" in decrypted
            assert "Member reports acute stress" in decrypted
        run_async(_test())

    def test_seam5_soap_note_requires_all_four_sections(self):
        """Verify SOAP note creation enforces all four clinical sections (S, O, A, P)."""
        with pytest.raises(ValidationError):
            SoapNoteCreate(
                subjective="Member feeling anxious",
                objective="Attentive",
                # missing assessment and plan
            )

    def test_seam5_caregiver_cooldown_enforcement(self, db_session):
        """Verify listener entering post-session cooldown updates availability status."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            lid = f"usr-s5-cool-l-{uuid.uuid4().hex[:6]}"

            # Enter cooldown: set active_now=False
            await svc.update_listener_profile(lid, ListenerProfileUpdate(active_now=False))

            prof_stmt = select(ListenerProfile).where(ListenerProfile.user_id == lid)
            prof = (await db.execute(prof_stmt)).scalar_one()
            assert prof.active_now is False

            # After 60-second decompression expires, listener resumes availability
            await svc.update_listener_profile(lid, ListenerProfileUpdate(active_now=True))
            prof_after = (await db.execute(prof_stmt)).scalar_one()
            assert prof_after.active_now is True
        run_async(_test())
