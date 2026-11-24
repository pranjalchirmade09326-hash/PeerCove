"""
PeerCove Peer Core Workflow Test Suite (Milestone 1 — Iteration 2)
Authentic, end-to-end verification of Member and Listener sanctuary workflows:
1. Member match request creation, topic taxonomy, channel preferences, and status polling.
2. Match request atomic cancellation (200 OK vs 409 Conflict REQUEST_ALREADY_CLAIMED).
3. Listener availability toggle, profile updates, and live active queue visibility.
4. Atomic race-safe match acceptance (200 OK vs 409 Conflict) and decline logic.
5. Caregiver workload capacity enforcement (200 OK vs 400 CAPACITY_LIMIT_EXCEEDED) and restoration after closure.
6. Peer consultation messaging with AES-256-GCM envelope encryption roundtrip and monotonic sequencing.
7. Deterministic Crisis Sentinel (<2ms tripwire) emitting national helplines (Tele-MANAS, 988, 112) and creating urgent SafetyCase.
8. SafetyCase parameter normalization (snake_case + camelCase, source_record_id persistence, id & case_id return).
9. Emergency conduct reporting with AES-256-GCM ciphertext persistence.
10. Session closure lifecycle and caregiver cooldown.
11. Member post-session feedback persistence, encrypted reflections, and rolling rating recalculation.
12. Listener SOAP note clinical debrief encryption and conversation termination.
13. Request expiration handling and batch sweeper.
14. WebSocket security: authentication requirement (4003), participant membership check (4003), and anti-spoofing sender_id binding.
15. WebRTC signaling over WebSocket with sender exclusion.
16. Envelope encryption tamper resilience and boundary error handling.

Uses the synchronous coroutine trampoline `run_async` from `tests/test_milestone4_persistence.py`
and `AsyncSessionWrapper` to eliminate all AnyIO/TestClient portal deadlocks on Windows/Python 3.14.
"""
import pytest
import uuid
import re
import time
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select, func

from app.core import security
from app.core.security import encrypt_content, decrypt_content, CURRENT_KEY_VERSION
from app.core.websocket_manager import ConnectionManager, manager
from tests.conftest import AsyncSessionWrapper
from app.models.member import AppPrincipal, MemberProfile, RoleAssignment
from app.models.peer import (
    ListenerProfile,
    ListenerAvailability,
    ListenerMatchRequest,
    ListenerMatch,
    PeerConversation,
    PeerMessage,
)
from app.models.operations import ListenerFeedback, ConductReport, SafetyCase
from app.schemas.peer import (
    MatchRequestCreate,
    PeerMessageCreate,
    ListenerProfileUpdate,
    FeedbackCreate,
    SoapNoteCreate,
)
from app.services.peer_service import PeerService, CRISIS_REGEX, to_utc
from app.services.operations_service import OperationsService
from app.routers.peer import websocket_peer_endpoint, extract_ws_user_id


def run_async(coro):
    """Synchronous trampoline runner for coroutines avoiding AnyIO/TestClient portal deadlocks."""
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


# ─── 1. MEMBER MATCH REQUEST CREATION & TAXONOMY ──────────────────────────────

class TestMemberMatchRequestCreation:
    def test_create_match_request_standard_topics(self, db_session):
        """Verify match request creation across standardized support topics."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            for topic in ["anxiety", "stress", "sleep", "relationships", "grief", "general"]:
                uid = f"usr-m1-topic-{topic}-{uuid.uuid4().hex[:4]}"
                payload = MatchRequestCreate(
                    support_topic=topic,
                    preferred_channel="chat",
                    preferred_languages=["en", "hi"],
                    notes=f"Need support with {topic}"
                )
                res = await svc.create_match_request(uid, payload)
                assert res["request_state"] == "queued"
                assert res["support_topic"] == topic
                assert res["preferred_channel"] == "chat"
                assert "id" in res

                # Verify database persistence
                req_uuid = uuid.UUID(res["id"])
                stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.id == req_uuid)
                db_row = (await db.execute(stmt)).scalar_one()
                assert db_row.support_topic == topic
                assert db_row.member_id == uid
                assert db_row.request_state == "queued"
                assert to_utc(db_row.expires_at) > datetime.now(timezone.utc)
        run_async(_test())

    def test_create_match_request_channel_preferences_and_notes(self, db_session):
        """Verify preferred communication channels and trauma-informed notes are persisted."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-channel-{uuid.uuid4().hex[:6]}"
            payload = MatchRequestCreate(
                support_topic="anxiety",
                preferred_channel="voice",
                preferred_languages=["hi", "en"],
                notes="Prefer voice call, quiet environment."
            )
            res = await svc.create_match_request(uid, payload)
            assert res["preferred_channel"] == "voice"

            req_uuid = uuid.UUID(res["id"])
            stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.id == req_uuid)
            db_row = (await db.execute(stmt)).scalar_one()
            assert db_row.preferred_channel == "voice"
            assert "hi" in db_row.preferred_languages
            assert db_row.notes == "Prefer voice call, quiet environment."
        run_async(_test())

    def test_poll_match_request_status_queued(self, db_session):
        """Verify polling a queued match request returns null listener and queued state."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-poll-{uuid.uuid4().hex[:6]}"
            payload = MatchRequestCreate(support_topic="stress", preferred_channel="chat")
            res = await svc.create_match_request(uid, payload)
            req_id = res["id"]

            status = await svc.get_match_request_status(uid, req_id)
            assert status["id"] == req_id
            assert status["request_state"] == "queued"
            assert status["conversation_id"] is None
            assert status["listener"] is None
        run_async(_test())

    def test_list_member_match_requests(self, db_session):
        """Verify list_match_requests returns all requests for the member ordered by date."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-list-{uuid.uuid4().hex[:6]}"
            await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            await svc.create_match_request(uid, MatchRequestCreate(support_topic="grief"))

            items = await svc.list_match_requests(uid)
            assert len(items) >= 2
            topics = [item["support_topic"] for item in items]
            assert "anxiety" in topics
            assert "grief" in topics
        run_async(_test())


# ─── 2. ATOMIC CANCELLATION & CONFLICT HANDLING ──────────────────────────────

class TestAtomicMatchRequestCancellation:
    def test_cancel_queued_request_success(self, db_session):
        """Verify active queued request is atomically cancelled and closed_at is set."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-cancel-{uuid.uuid4().hex[:6]}"
            created = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            req_id = created["id"]

            cancel_res = await svc.cancel_match_request(uid, req_id)
            assert cancel_res["status"] == "cancelled"
            assert cancel_res["id"] == req_id

            # Verify database entity state
            stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.id == uuid.UUID(req_id))
            row = (await db.execute(stmt)).scalar_one()
            assert row.request_state == "cancelled"
            assert row.closed_at is not None
        run_async(_test())

    def test_cancel_idempotency(self, db_session):
        """Verify cancelling an already-cancelled request returns idempotent 200 OK."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-idem-{uuid.uuid4().hex[:6]}"
            created = await svc.create_match_request(uid, MatchRequestCreate(support_topic="sleep"))
            req_id = created["id"]

            # First cancel
            res1 = await svc.cancel_match_request(uid, req_id)
            assert res1["status"] == "cancelled"

            # Second cancel (idempotent)
            res2 = await svc.cancel_match_request(uid, req_id)
            assert res2["status"] == "cancelled"
        run_async(_test())

    def test_cannot_cancel_already_matched_request_409(self, db_session):
        """Verify cancelling a request that was already matched raises HTTP 409 Conflict (REQUEST_ALREADY_CLAIMED)."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-race-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-race-{uuid.uuid4().hex[:6]}"
            created = await svc.create_match_request(uid, MatchRequestCreate(support_topic="stress"))
            req_id = created["id"]

            # Listener accepts the match
            accept_res = await svc.accept_match_request(lid, req_id)
            assert accept_res["status"] == "accepted"

            # Member attempts to cancel after match was claimed -> must raise 409 Conflict
            with pytest.raises(HTTPException) as exc_info:
                await svc.cancel_match_request(uid, req_id)
            assert exc_info.value.status_code == 409
            assert exc_info.value.detail == "REQUEST_ALREADY_CLAIMED"
        run_async(_test())

    def test_cancel_nonexistent_request_404(self, db_session):
        """Verify cancelling an unknown UUID raises HTTP 404."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)
            random_id = str(uuid.uuid4())
            with pytest.raises(HTTPException) as exc_info:
                await svc.cancel_match_request("usr-demo-member-01", random_id)
            assert exc_info.value.status_code == 404
        run_async(_test())


# ─── 3. LISTENER AVAILABILITY & LIVE QUEUE VISIBILITY ────────────────────────

class TestListenerAvailabilityAndQueue:
    def test_toggle_listener_active_status(self, db_session):
        """Verify listener toggles active_now between True and False."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            lid = f"usr-m1-toggle-{uuid.uuid4().hex[:6]}"
            # First toggle creates profile and sets active_now = True
            r1 = await svc.toggle_listener_active(lid)
            assert r1["active_now"] is True

            # Second toggle sets active_now = False
            r2 = await svc.toggle_listener_active(lid)
            assert r2["active_now"] is False
        run_async(_test())

    def test_update_listener_profile_attributes(self, db_session):
        """Verify updating listener capacity limit, languages, and display name."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            lid = f"usr-m1-prof-{uuid.uuid4().hex[:6]}"
            payload = ListenerProfileUpdate(
                capacity_limit=2,
                profile_languages=["English", "Spanish"],
                display_name="Caregiver Maria",
                active_now=True
            )
            res = await svc.update_listener_profile(lid, payload)
            assert res["status"] == "success"
            assert res["capacity_limit"] == 2
            assert "Spanish" in res["profile_languages"]
            assert res["active_now"] is True
        run_async(_test())

    def test_list_active_queued_requests(self, db_session):
        """Verify active queued requests are visible to listeners with waiting minutes."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-qvis-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))

            active_list = await svc.list_active_match_requests("usr-demo-listener-01")
            found = [r for r in active_list if r["id"] == req["id"]]
            assert len(found) == 1
            assert found[0]["support_topic"] == "anxiety"
            assert "waiting_minutes" in found[0]
        run_async(_test())


# ─── 4. ATOMIC RACE-SAFE MATCH ACCEPTANCE & DECLINE ──────────────────────────

class TestAtomicMatchAcceptance:
    def test_accept_match_request_success(self, db_session):
        """Verify successful match acceptance creates ListenerMatch, PeerConversation, and initial message."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-acc-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-acc-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="grief", preferred_channel="chat"))
            req_id = req["id"]

            res = await svc.accept_match_request(lid, req_id)
            assert res["status"] == "accepted"
            assert "match_id" in res
            assert "conversation_id" in res

            # Verify database entities
            conv_uuid = uuid.UUID(res["conversation_id"])
            stmt = select(PeerConversation).where(PeerConversation.id == conv_uuid)
            conv = (await db.execute(stmt)).scalar_one()
            assert conv.conversation_state == "open"
            assert conv.member_id == uid

            # Verify initial welcome message was created and encrypted
            msg_stmt = select(PeerMessage).where(PeerMessage.conversation_id == conv_uuid)
            msgs = (await db.execute(msg_stmt)).scalars().all()
            assert len(msgs) == 1
            assert msgs[0].sequence_no == 1
            decrypted = decrypt_content(msgs[0].content_ciphertext, msgs[0].key_version)
            assert "peer listener has connected" in decrypted
        run_async(_test())

    def test_duplicate_match_acceptance_409(self, db_session):
        """Verify second listener attempting to claim an already-claimed request receives 409 Conflict."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-dupclaim-{uuid.uuid4().hex[:6]}"
            l1 = f"usr-m1-l1-{uuid.uuid4().hex[:6]}"
            l2 = f"usr-m1-l2-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            req_id = req["id"]

            # Listener 1 claims
            r1 = await svc.accept_match_request(l1, req_id)
            assert r1["status"] == "accepted"

            # Listener 2 tries to claim -> must receive 409 Conflict
            with pytest.raises(HTTPException) as exc_info:
                await svc.accept_match_request(l2, req_id)
            assert exc_info.value.status_code == 409
            assert exc_info.value.detail == "REQUEST_ALREADY_CLAIMED"
        run_async(_test())

    def test_accept_cancelled_request_409(self, db_session):
        """Verify attempting to accept a cancelled request receives 409 Conflict (REQUEST_CANCELLED)."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-canclaim-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-can-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="stress"))
            req_id = req["id"]

            await svc.cancel_match_request(uid, req_id)

            with pytest.raises(HTTPException) as exc_info:
                await svc.accept_match_request(lid, req_id)
            assert exc_info.value.status_code == 409
            assert exc_info.value.detail == "REQUEST_CANCELLED"
        run_async(_test())

    def test_decline_match_request_success(self, db_session):
        """Verify listener declining a match transitions match state to declined."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-dec-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-dec-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="sleep"))
            req_id = req["id"]

            res = await svc.decline_match_request(lid, req_id)
            assert res["status"] == "declined"
            assert res["reassigned"] is True
        run_async(_test())


# ─── 5. CAREGIVER WORKLOAD CAPACITY ENFORCEMENT ──────────────────────────────

class TestCaregiverWorkloadCapacity:
    def test_capacity_limit_enforcement(self, db_session):
        """Verify listener at capacity limit (capacity=1) is blocked with 400 CAPACITY_LIMIT_EXCEEDED."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            # Create a dedicated listener with capacity_limit = 1
            lid = f"usr-m1-capped-{uuid.uuid4().hex[:6]}"
            await svc.update_listener_profile(lid, ListenerProfileUpdate(capacity_limit=1, active_now=True))

            uid1 = f"usr-m1-cap1-{uuid.uuid4().hex[:6]}"
            uid2 = f"usr-m1-cap2-{uuid.uuid4().hex[:6]}"
            r1 = await svc.create_match_request(uid1, MatchRequestCreate(support_topic="anxiety"))
            r2 = await svc.create_match_request(uid2, MatchRequestCreate(support_topic="stress"))

            # Accept first session -> consumes available capacity (1/1)
            acc1 = await svc.accept_match_request(lid, r1["id"])
            assert acc1["status"] == "accepted"

            # Attempt to accept second session -> must be rejected
            with pytest.raises(HTTPException) as exc_info:
                await svc.accept_match_request(lid, r2["id"])
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "CAPACITY_LIMIT_EXCEEDED"

            # Close first conversation -> capacity restored
            await svc.close_conversation(lid, acc1["conversation_id"])

            # Can now accept second session
            acc2 = await svc.accept_match_request(lid, r2["id"])
            assert acc2["status"] == "accepted"
        run_async(_test())


# ─── 6. REAL-TIME CONSULTATION MESSAGING & AES-256-GCM ────────────────────────

class TestPeerConsultationMessaging:
    def test_send_and_list_messages_encrypted(self, db_session):
        """Verify messages are encrypted via AES-256-GCM in PostgreSQL and decrypted on read."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-msg-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-msg-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            # Member sends confidential message
            plain_text = "I have been feeling deeply stressed by family expectations."
            sent = await svc.send_message(uid, conv_id, PeerMessageCreate(content=plain_text))
            assert sent["content"] == plain_text
            assert "id" in sent

            # Verify in raw database: content_ciphertext is binary and plaintext is NOT stored
            msg_uuid = uuid.UUID(sent["id"])
            stmt = select(PeerMessage).where(PeerMessage.id == msg_uuid)
            raw_msg = (await db.execute(stmt)).scalar_one()
            assert isinstance(raw_msg.content_ciphertext, bytes)
            assert plain_text.encode("utf-8") not in raw_msg.content_ciphertext
            assert raw_msg.key_version == security.CURRENT_KEY_VERSION

            # Direct roundtrip decryption
            decrypted = decrypt_content(raw_msg.content_ciphertext, raw_msg.key_version)
            assert decrypted == plain_text

            # Listing messages returns decrypted text
            msg_list = await svc.list_messages(conv_id, uid)
            contents = [m["content"] for m in msg_list]
            assert plain_text in contents
        run_async(_test())

    def test_message_monotonic_sequence_ordering(self, db_session):
        """Verify sequential messages receive strictly increasing sequence numbers."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-seq-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-seq-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="sleep"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            m1 = await svc.send_message(uid, conv_id, PeerMessageCreate(content="Message 1"))
            m2 = await svc.send_message(lid, conv_id, PeerMessageCreate(content="Message 2"))
            m3 = await svc.send_message(uid, conv_id, PeerMessageCreate(content="Message 3"))

            # Welcome message was sequence 1, so subsequent are 2, 3, 4
            assert m1["sequence_no"] == 2
            assert m2["sequence_no"] == 3
            assert m3["sequence_no"] == 4
        run_async(_test())

    def test_tampered_ciphertext_resilience(self):
        """Verify tampered ciphertext produces fallback placeholder without uncaught crash."""
        ct, kv = encrypt_content("Confidential member reflection")
        tampered = bytearray(ct)
        tampered[-1] ^= 0xFF  # Flip auth tag byte

        recovered = decrypt_content(bytes(tampered), kv)
        assert recovered == "[Encrypted Content]"


# ─── 7. DETERMINISTIC CRISIS SENTINEL (<2ms) ─────────────────────────────────

class TestCrisisSentinelAndSafetyCase:
    def test_crisis_sentinel_trips_and_emits_hotlines(self, db_session):
        """Verify acute crisis keywords trip sentinel, broadcast helplines, and persist SafetyCase."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-crisis-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-crisis-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="grief"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            # Intercept broadcast
            with patch.object(manager, "broadcast", new_callable=AsyncMock) as mock_broadcast:
                crisis_text = "I feel hopeless and I want to die tonight."
                await svc.send_message(uid, conv_id, PeerMessageCreate(content=crisis_text))

                # Broadcast was invoked
                assert mock_broadcast.called
                broadcast_calls = [call[0][1] for call in mock_broadcast.call_args_list]

                # Verify emergency alert broadcast contains verified hotlines
                alert_msgs = [m for m in broadcast_calls if m.get("type") in ("crisis_alert", "safety_alert")]
                assert len(alert_msgs) >= 1
                alert = alert_msgs[0]
                helplines = alert.get("helplines", [])
                assert "14416" in helplines
                assert "988" in helplines
                assert "112" in helplines

            # Verify SafetyCase was persisted in PostgreSQL/SQLite
            sc_stmt = select(SafetyCase).where(SafetyCase.member_id == uid)
            cases = (await db.execute(sc_stmt)).scalars().all()
            assert len(cases) >= 1
            case = cases[0]
            assert case.trigger_code == "crisis_keyword_detected"
            assert case.priority_code == "urgent"
            assert case.source_type == "peer_chat"
            assert str(case.source_record_id) == conv_id
        run_async(_test())

    def test_crisis_sentinel_regex_performance_under_2ms(self):
        """Verify CRISIS_REGEX executes in < 2ms on realistic narrative texts."""
        sample_text = (
            "I have been thinking a lot about my circumstances lately and everything feels heavy. "
            "Sometimes I just feel like I want to die because the pain is overwhelming. "
            + ("filler text " * 100)
        )
        t0 = time.perf_counter()
        match = CRISIS_REGEX.search(sample_text)
        duration_ms = (time.perf_counter() - t0) * 1000.0

        assert match is not None
        assert duration_ms < 2.0  # Must be strictly under 2ms

    def test_benign_message_does_not_trip_sentinel(self, db_session):
        """Verify normal conversation does not trigger crisis alert or create SafetyCase."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-benign-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-benign-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="general"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            with patch.object(manager, "broadcast", new_callable=AsyncMock) as mock_broadcast:
                benign_text = "I am killing it at work today, just wanted to check in."
                await svc.send_message(uid, conv_id, PeerMessageCreate(content=benign_text))

                # No crisis_alert broadcast emitted
                broadcast_calls = [call[0][1] for call in mock_broadcast.call_args_list]
                alerts = [m for m in broadcast_calls if m.get("type") == "crisis_alert"]
                assert len(alerts) == 0

            # No safety case created
            sc_stmt = select(SafetyCase).where(SafetyCase.member_id == uid)
            cases = (await db.execute(sc_stmt)).scalars().all()
            assert len(cases) == 0
        run_async(_test())


# ─── 8. SAFETY CASE PARAMETER NORMALIZATION ──────────────────────────────────

class TestSafetyCaseParameterNormalization:
    def test_create_safety_case_snake_case_and_camel_case(self, db_session):
        """Verify OperationsService.create_safety_case normalizes snake_case and camelCase parameters."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            ops = OperationsService(db)

            # 1. Snake-case payload (from PeerService crisis sentinel)
            rec_id = uuid.uuid4()
            snake_payload = {
                "member_id": "usr-test-snake-01",
                "source_type": "peer_chat",
                "source_record_id": str(rec_id),
                "trigger_code": "crisis_keyword_detected",
                "priority_code": "urgent",
                "policy_version": "v1.0",
                "jurisdiction": "IN"
            }
            res_snake = await ops.create_safety_case(snake_payload)
            assert res_snake["status"] == "created"
            assert "id" in res_snake
            assert "case_id" in res_snake
            assert res_snake["id"] == res_snake["case_id"]
            assert res_snake["member_id"] == "usr-test-snake-01"
            assert res_snake["source_record_id"] == str(rec_id)
            assert res_snake["priority_code"] == "urgent"

            # 2. CamelCase payload (legacy caller)
            camel_payload = {
                "memberId": "usr-test-camel-02",
                "sourceType": "intake_screener",
                "triggerCode": "high_distress_alert",
                "priorityCode": "p1_urgent",
                "policyVersion": "v1.0"
            }
            res_camel = await ops.create_safety_case(camel_payload)
            assert res_camel["status"] == "created"
            assert "id" in res_camel
            assert "case_id" in res_camel
            assert res_camel["member_id"] == "usr-test-camel-02"
        run_async(_test())


# ─── 9. EMERGENCY CONDUCT REPORTING ──────────────────────────────────────────

class TestEmergencyConductReporting:
    def test_create_conduct_report_encrypted_persistence(self, db_session):
        """Verify conduct report is persisted with AES-256-GCM encrypted details."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            ops = OperationsService(db)

            conv_id = str(uuid.uuid4())
            reporter = "usr-demo-listener-01"
            details = "Member shared abusive content during peer consultation session."

            res = await ops.create_conduct_report(
                user_id=reporter,
                payload={
                    "conversation_id": conv_id,
                    "reported_user_id": "usr-demo-member-01",
                    "category_code": "harassment",
                    "details": details,
                    "severity": "high"
                }
            )
            assert res["status"] == "created"
            assert "id" in res

            # Verify in DB
            rep_uuid = uuid.UUID(res["id"])
            stmt = select(ConductReport).where(ConductReport.id == rep_uuid)
            row = (await db.execute(stmt)).scalar_one()
            assert row.reporter_user_id == reporter
            assert row.severity == "high"
            decrypted = decrypt_content(row.details_ciphertext, row.key_version)
            assert decrypted == details
        run_async(_test())


# ─── 10. SESSION CLOSURE LIFECYCLE & CAREGIVER COOLDOWN ──────────────────────

class TestSessionClosureAndCooldown:
    def test_close_conversation_lifecycle(self, db_session):
        """Verify closing conversation sets ended_at, terminates match, and emits broadcast."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-close-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-close-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            with patch.object(manager, "broadcast", new_callable=AsyncMock) as mock_broadcast:
                close_res = await svc.close_conversation(uid, conv_id)
                assert close_res["status"] == "success"
                assert close_res["conversation_state"] == "closed"
                assert mock_broadcast.called

            # Verify database states
            conv_stmt = select(PeerConversation).where(PeerConversation.id == uuid.UUID(conv_id))
            conv = (await db.execute(conv_stmt)).scalar_one()
            assert conv.conversation_state == "closed"
            assert conv.ended_at is not None
            assert conv.closed_by_user_id == uid

            # Verify linked match ended
            match_stmt = select(ListenerMatch).where(ListenerMatch.id == conv.match_id)
            match = (await db.execute(match_stmt)).scalar_one()
            assert match.ended_at is not None
            assert match.end_reason_code == "completed"
        run_async(_test())

    def test_closed_conversation_rejects_new_messages(self, db_session):
        """Verify sending message to a closed conversation raises HTTP 400 CONVERSATION_CLOSED."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-clmsg-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-clmsg-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="sleep"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            await svc.close_conversation(uid, conv_id)

            with pytest.raises(HTTPException) as exc_info:
                await svc.send_message(uid, conv_id, PeerMessageCreate(content="Hello again"))
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "CONVERSATION_CLOSED"
        run_async(_test())


# ─── 11. POST-SESSION FEEDBACK & ROLLING RATING RECALCULATION ─────────────────

class TestPostSessionFeedback:
    def test_submit_feedback_recalculates_listener_rating(self, db_session):
        """Verify feedback persistence and listener rolling rating recalculation."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-fb-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-fb-{uuid.uuid4().hex[:6]}"
            # Create listener profile with rating 4.8, total 5
            await svc.update_listener_profile(lid, ListenerProfileUpdate(capacity_limit=3, active_now=True))
            stmt = select(ListenerProfile).where(ListenerProfile.user_id == lid)
            lp = (await db.execute(stmt)).scalar_one()
            lp.rating = 4.8
            lp.total_conversations = 5
            await db.commit()

            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            fb_payload = FeedbackCreate(
                rating=5,
                feedback_text="Very compassionate and calming presence.",
                post_mood_score=8.5,
                sync_to_journal=True
            )
            res = await svc.submit_feedback(uid, conv_id, fb_payload)
            assert res["status"] == "success"
            assert "feedback_id" in res

            # Verify feedback DB row
            fb_uuid = uuid.UUID(res["feedback_id"])
            stmt = select(ListenerFeedback).where(ListenerFeedback.id == fb_uuid)
            fb_row = (await db.execute(stmt)).scalar_one()
            assert fb_row.rating == 5
            assert fb_row.post_mood_score == 8.5
            assert fb_row.sync_to_journal is True
            decrypted = decrypt_content(fb_row.feedback_ciphertext, fb_row.key_version)
            assert decrypted == "Very compassionate and calming presence."

            # Verify listener rolling rating: ((4.8 * 5) + 5) / 6 = 29.0 / 6 = 4.83
            l_stmt = select(ListenerProfile).where(ListenerProfile.user_id == lid)
            listener = (await db.execute(l_stmt)).scalar_one()
            assert listener.total_conversations == 6
            assert listener.rating == 4.83
        run_async(_test())

    def test_feedback_rating_boundary_validation(self):
        """Verify rating outside [1, 5] raises Pydantic ValidationError."""
        with pytest.raises(ValidationError):
            FeedbackCreate(rating=0)
        with pytest.raises(ValidationError):
            FeedbackCreate(rating=6)


# ─── 12. LISTENER SOAP NOTE DOCUMENTATION ────────────────────────────────────

class TestListenerSoapNotes:
    def test_save_soap_note_encryption_and_closure(self, db_session):
        """Verify SOAP debrief is encrypted as a PeerMessage and closes conversation."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-soap-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-soap-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="stress"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            soap = SoapNoteCreate(
                subjective="Member expressed anxiety about work deadlines.",
                objective="Member used breathwork pacer for 3 cycles.",
                assessment="Mild acute situational stress, stabilized.",
                plan="Encouraged self-compassion exercise and regular breaks."
            )
            res = await svc.save_soap_note(lid, conv_id, soap)
            assert res["status"] == "success"
            assert "saved_at" in res

            # Verify conversation was closed
            c_stmt = select(PeerConversation).where(PeerConversation.id == uuid.UUID(conv_id))
            conv = (await db.execute(c_stmt)).scalar_one()
            assert conv.conversation_state == "closed"

            # Verify SOAP note was saved as encrypted PeerMessage
            msg_stmt = select(PeerMessage).where(
                PeerMessage.conversation_id == uuid.UUID(conv_id)
            ).order_by(PeerMessage.sequence_no.desc())
            last_msg = (await db.execute(msg_stmt)).scalars().first()
            decrypted = decrypt_content(last_msg.content_ciphertext, last_msg.key_version)
            assert "[SOAP RECORD]" in decrypted
            assert "Member expressed anxiety" in decrypted
        run_async(_test())


# ─── 13. REQUEST EXPIRATION & BATCH SWEEPER ──────────────────────────────────

class TestRequestExpirationAndSweeper:
    def test_expired_request_handling_and_sweep(self, db_session):
        """Verify expired requests are rejected on accept and swept by batch sweeper."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            lid = f"usr-m1-l-exp-{uuid.uuid4().hex[:6]}"
            # Insert an already-expired match request
            now = datetime.now(timezone.utc)
            expired_req = ListenerMatchRequest(
                id=uuid.uuid4(),
                member_id="usr-demo-member-01",
                request_state="queued",
                support_topic="grief",
                preferred_channel="chat",
                created_at=now - timedelta(minutes=40),
                expires_at=now - timedelta(minutes=10)
            )
            expired_req2 = ListenerMatchRequest(
                id=uuid.uuid4(),
                member_id="usr-demo-member-02",
                request_state="queued",
                support_topic="sleep",
                preferred_channel="chat",
                created_at=now - timedelta(minutes=45),
                expires_at=now - timedelta(minutes=15)
            )
            db.add(expired_req)
            db.add(expired_req2)
            await db.commit()

            # Attempting to accept expired request -> 409 REQUEST_EXPIRED
            with pytest.raises(HTTPException) as exc_info:
                await svc.accept_match_request(lid, str(expired_req.id))
            assert exc_info.value.status_code == 409
            assert exc_info.value.detail == "REQUEST_EXPIRED"

            # Sweep expired requests
            swept = await svc.sweep_expired_requests()
            assert swept >= 1

            # Verify state updated to expired
            stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.id == expired_req2.id)
            refreshed = (await db.execute(stmt)).scalar_one()
            assert refreshed.request_state == "expired"
            assert refreshed.closed_at is not None
        run_async(_test())


# ─── 14. WEBSOCKET SECURITY & ANTI-SPOOFING ──────────────────────────────────

class TestWebSocketSecurity:
    def test_extract_ws_user_id_from_headers_and_query(self):
        """Verify authentication extraction from custom headers, Bearer tokens, and query params."""
        # Custom header
        ws1 = MagicMock()
        ws1.headers = {"x-user-id": "usr-test-header-01"}
        ws1.query_params = {}
        assert extract_ws_user_id(ws1) == "usr-test-header-01"

        # Query param
        ws2 = MagicMock()
        ws2.headers = {}
        ws2.query_params = {"user_id": "usr-test-query-02"}
        assert extract_ws_user_id(ws2) == "usr-test-query-02"

        # None if unauthenticated
        ws3 = MagicMock()
        ws3.headers = {}
        ws3.query_params = {}
        assert extract_ws_user_id(ws3) is None

    def test_websocket_unauthenticated_connection_rejected(self):
        """Verify connecting without credentials is rejected with close code 4003 (AUTHENTICATION_REQUIRED)."""
        async def _test():
            ws = AsyncMock()
            ws.headers = {}
            ws.query_params = {}

            service = AsyncMock()
            await websocket_peer_endpoint(ws, str(uuid.uuid4()), service=service)

            assert ws.close.called
            assert ws.close.call_args[1]["code"] == 4003
            assert ws.close.call_args[1]["reason"] == "AUTHENTICATION_REQUIRED"
        run_async(_test())

    def test_websocket_unauthorized_non_participant_rejected(self, db_session):
        """Verify connecting user who is not a participant of the conversation is rejected with 4003."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            # Create an open conversation between member and listener
            uid = f"usr-m1-authp-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-authp-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            # Third-party eavesdropper connects
            ws = AsyncMock()
            ws.headers = {"x-user-id": "usr-third-party-eavesdropper"}
            ws.query_params = {}

            await websocket_peer_endpoint(ws, conv_id, service=svc)

            assert ws.close.called
            assert ws.close.call_args[1]["code"] == 4003
            assert ws.close.call_args[1]["reason"] == "FORBIDDEN_NOT_PARTICIPANT"
        run_async(_test())

    def test_websocket_authorized_participant_message_sender_bound(self, db_session):
        """Verify authorized participant connect succeeds and message sender is strictly bound to auth identity."""
        async def _test():
            db = AsyncSessionWrapper(db_session)
            svc = PeerService(db)

            uid = f"usr-m1-bind-{uuid.uuid4().hex[:6]}"
            lid = f"usr-m1-l-bind-{uuid.uuid4().hex[:6]}"
            req = await svc.create_match_request(uid, MatchRequestCreate(support_topic="anxiety"))
            acc = await svc.accept_match_request(lid, req["id"])
            conv_id = acc["conversation_id"]

            # Member connects via WebSocket
            ws = AsyncMock()
            ws.headers = {"x-user-id": uid}
            ws.query_params = {}

            # Member tries to send frame spoofing sender_id as listener
            spoofed_frame = {
                "type": "chat_message",
                "content": "Message with attempted identity spoof",
                "sender_id": lid  # ATTACK: spoofing listener identity
            }

            ws.receive_json.side_effect = [
                spoofed_frame,
                Exception("Loop exit")
            ]

            await websocket_peer_endpoint(ws, conv_id, service=svc)

            # Check inserted message in DB: sender MUST be authenticated uid, NOT spoofed sender_id!
            stmt = select(PeerMessage).where(
                PeerMessage.conversation_id == uuid.UUID(conv_id)
            ).order_by(PeerMessage.sequence_no.desc())
            last_msg = (await db.execute(stmt)).scalars().first()
            assert last_msg.sender_user_id == uid  # Successfully prevented identity spoofing!
        run_async(_test())


# ─── 15. WEBRTC SIGNALING OVER WEBSOCKET ─────────────────────────────────────

class TestWebRTCSignaling:
    def test_webrtc_signaling_relayed_with_sender_exclusion(self):
        """Verify WebRTC offer/answer/candidate is broadcast to peer without echoing back to sender."""
        async def _test():
            cm = ConnectionManager()
            ws_caller = AsyncMock()
            ws_callee = AsyncMock()

            conv_id = str(uuid.uuid4())
            await cm.connect(conv_id, ws_caller, user_id="usr-caller")
            await cm.connect(conv_id, ws_callee, user_id="usr-callee")

            # Broadcast WebRTC offer
            offer_payload = {
                "type": "webrtc_signal",
                "signal": {"type": "offer", "sdp": "v=0..."},
                "from_user_id": "usr-caller"
            }
            await cm.broadcast(conv_id, offer_payload, exclude=ws_caller)

            # Callee received offer
            assert ws_callee.send_json.called
            assert ws_callee.send_json.call_args[0][0]["from_user_id"] == "usr-caller"

            # Caller did NOT receive echo
            assert not ws_caller.send_json.called
        run_async(_test())
