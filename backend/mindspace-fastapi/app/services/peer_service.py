from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, update, or_
from sqlalchemy.orm import aliased
from app.core.database import get_db
from app.core.security import encrypt_content, decrypt_content
from app.core.websocket_manager import manager
from app.models.peer import ListenerMatchRequest, ListenerMatch, PeerConversation, PeerMessage, ListenerProfile
from app.models.operations import ListenerFeedback
from app.models.member import AppPrincipal, MemberProfile, RoleAssignment
from app.schemas.peer import (
    MatchRequestCreate,
    BookSessionRequest,
    PeerMessageCreate,
    SoapNoteCreate,
    ListenerProfileUpdate,
    FeedbackCreate,
)
from app.services.base import BaseService
from app.services.operations_service import OperationsService
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
import uuid
import re
import logging

logger = logging.getLogger("mindspace.peer")

CRISIS_REGEX = re.compile(
    r"\b(suicide|kill\s+myself|end\s+my\s+life|want\s+to\s+die|hang\s+myself|hurt\s+myself|self[- ]harm|overdose|shoot\s+myself|slit\s+my\s+wrists)\b",
    re.IGNORECASE
)


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class PeerService(BaseService):
    async def list_available_listeners(self) -> list[dict]:
        stmt = (
            select(ListenerProfile, MemberProfile.display_name)
            .outerjoin(MemberProfile, ListenerProfile.user_id == MemberProfile.user_id)
            .where(ListenerProfile.application_state == "approved")
        )
        res = await self.db.execute(stmt)
        rows = res.all()
        listeners = []
        for lp, display_name in rows:
            listeners.append({
                "id": str(lp.id),
                "user_id": lp.user_id,
                "name": display_name or lp.user_id,
                "eligibility": lp.eligibility_state,
                "capacity": lp.capacity_limit,
                "rating": f"{lp.rating:.1f} ★" if hasattr(lp, "rating") and lp.rating else "4.9 ★",
                "active_now": getattr(lp, "active_now", False),
            })
        return listeners

    async def list_match_requests(self, user_id: str) -> list[dict]:
        stmt = select(ListenerMatchRequest).where(
            ListenerMatchRequest.member_id == user_id
        ).order_by(desc(ListenerMatchRequest.created_at))
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "member_id": r.member_id,
                "status": r.request_state,
                "request_state": r.request_state,
                "support_topic": getattr(r, "support_topic", None),
                "preferred_channel": getattr(r, "preferred_channel", "chat"),
                "created_at": r.created_at.isoformat()
            }
            for r in items
        ]

    async def create_match_request(self, user_id: str, payload: MatchRequestCreate) -> dict:
        # Ensure AppPrincipal exists
        p_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == user_id))
        if not p_res.scalar_one_or_none():
            self.db.add(AppPrincipal(user_id=user_id, account_state="active"))
            await self.db.flush()

        req = ListenerMatchRequest(
            id=uuid.uuid4(),
            member_id=user_id,
            request_state="queued",
            support_topic=payload.support_topic,
            preferred_channel=payload.preferred_channel or "chat",
            preferred_languages=payload.preferred_languages or ["en"],
            notes=payload.notes,
            created_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        self.db.add(req)
        await self.db.commit()
        await self.db.refresh(req)

        return {
            "id": str(req.id),
            "member_id": req.member_id,
            "status": req.request_state,
            "request_state": req.request_state,
            "support_topic": req.support_topic,
            "preferred_channel": req.preferred_channel,
            "preferred_languages": req.preferred_languages,
            "notes": req.notes,
            "created_at": req.created_at.isoformat()
        }

    async def get_match_request_status(self, user_id: str, request_id: str) -> dict:
        try:
            req_uuid = uuid.UUID(request_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid request ID format.")

        stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.id == req_uuid)
        res = await self.db.execute(stmt)
        req = res.scalar_one_or_none()
        if not req:
            raise HTTPException(status_code=404, detail="Match request not found.")

        # Transition to expired if overdue
        now = datetime.now(timezone.utc)
        if req.request_state == "queued" and req.expires_at and to_utc(req.expires_at) < now:
            req.request_state = "expired"
            req.closed_at = now
            await self.db.commit()

        matched_listener = None
        conversation_id = None
        match_id = None

        if req.request_state == "matched":
            m_stmt = (
                select(ListenerMatch)
                .where(ListenerMatch.request_id == req.id)
                .order_by(desc(ListenerMatch.offered_at))
            )
            m_res = await self.db.execute(m_stmt)
            match = m_res.scalar_one_or_none()
            if match:
                match_id = str(match.id)
                c_stmt = select(PeerConversation).where(PeerConversation.match_id == match.id)
                c_res = await self.db.execute(c_stmt)
                conv = c_res.scalar_one_or_none()
                if conv:
                    conversation_id = str(conv.id)

                l_stmt = (
                    select(ListenerProfile, MemberProfile.display_name)
                    .outerjoin(MemberProfile, ListenerProfile.user_id == MemberProfile.user_id)
                    .where(ListenerProfile.id == match.listener_id)
                )
                l_res = await self.db.execute(l_stmt)
                l_row = l_res.first()
                if l_row:
                    lp, display_name = l_row
                    matched_listener = {
                        "id": str(lp.id),
                        "user_id": lp.user_id,
                        "display_name": display_name or lp.user_id,
                        "rating": getattr(lp, "rating", 5.0)
                    }

        return {
            "id": str(req.id),
            "member_id": req.member_id,
            "request_state": req.request_state,
            "status": req.request_state,
            "support_topic": getattr(req, "support_topic", None),
            "preferred_channel": getattr(req, "preferred_channel", "chat"),
            "conversation_id": conversation_id,
            "match_id": match_id,
            "listener": matched_listener,
            "created_at": req.created_at.isoformat()
        }

    async def cancel_match_request(self, user_id: str, request_id: str) -> dict:
        try:
            req_uuid = uuid.UUID(request_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid request ID format.")

        now = datetime.now(timezone.utc)

        # Atomic conditional update: only transitions if currently queued
        stmt = (
            update(ListenerMatchRequest)
            .where(
                ListenerMatchRequest.id == req_uuid,
                ListenerMatchRequest.request_state == "queued"
            )
            .values(request_state="cancelled", closed_at=now)
        )
        res = await self.db.execute(stmt)
        if res.rowcount > 0:
            await self.db.commit()
            return {"status": "cancelled", "id": str(req_uuid)}

        # Rowcount == 0: inspect row to return precise error / idempotency
        chk_stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.id == req_uuid)
        chk_res = await self.db.execute(chk_stmt)
        req = chk_res.scalar_one_or_none()
        if not req:
            raise HTTPException(status_code=404, detail="Match request not found.")

        # Idempotent cancel: already cancelled returns 200 OK
        if req.request_state == "cancelled":
            return {"status": "cancelled", "id": str(req.id)}

        # State conflicts
        if req.request_state == "matched":
            raise HTTPException(status_code=409, detail="REQUEST_ALREADY_CLAIMED")

        if req.request_state in ["closed", "expired"]:
            raise HTTPException(status_code=409, detail="REQUEST_NOT_ACTIVE")

        raise HTTPException(status_code=409, detail="REQUEST_NOT_ACTIVE")

    async def list_active_match_requests(self, user_id: str) -> list[dict]:
        now = datetime.now(timezone.utc)
        stmt = (
            select(ListenerMatchRequest, MemberProfile.display_name)
            .outerjoin(MemberProfile, ListenerMatchRequest.member_id == MemberProfile.user_id)
            .where(
                ListenerMatchRequest.request_state == "queued",
                or_(ListenerMatchRequest.expires_at.is_(None), ListenerMatchRequest.expires_at > now)
            )
            .order_by(ListenerMatchRequest.created_at.asc())
        )
        res = await self.db.execute(stmt)
        rows = res.all()

        results = []
        for req, member_name in rows:
            created_at = req.created_at
            waiting_mins = max(0, int((now - to_utc(created_at)).total_seconds() / 60)) if created_at else 0
            results.append({
                "id": str(req.id),
                "member_id": req.member_id,
                "member_name": member_name or "Anonymous Member",
                "support_topic": getattr(req, "support_topic", None) or "General check-in",
                "preferred_channel": getattr(req, "preferred_channel", "chat"),
                "created_at": created_at.isoformat() if created_at else now.isoformat(),
                "waiting_minutes": waiting_mins,
                "urgency": "routine"
            })
        return results

    async def sweep_expired_requests(self) -> int:
        now = datetime.now(timezone.utc)
        stmt = (
            update(ListenerMatchRequest)
            .where(
                ListenerMatchRequest.request_state == "queued",
                ListenerMatchRequest.expires_at.is_not(None),
                ListenerMatchRequest.expires_at < now
            )
            .values(request_state="expired", closed_at=now)
        )
        res = await self.db.execute(stmt)
        await self.db.commit()
        return res.rowcount or 0

    async def accept_match_request(self, user_id: str, request_id: str) -> dict:
        try:
            req_uuid = uuid.UUID(request_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid request ID format.")

        # Lock listener profile row to serialize concurrent accepts for this listener
        prof_stmt = select(ListenerProfile).where(ListenerProfile.user_id == user_id).with_for_update()
        p_res = await self.db.execute(prof_stmt)
        listener = p_res.scalar_one_or_none()
        if not listener:
            # Check or create principal
            l_principal = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == user_id))
            if not l_principal.scalar_one_or_none():
                self.db.add(AppPrincipal(user_id=user_id, account_state="active"))
                await self.db.flush()

            listener = ListenerProfile(
                id=uuid.uuid4(),
                user_id=user_id,
                application_state="approved",
                eligibility_state="eligible",
                capacity_limit=3,
                profile_languages=["English", "Hindi"],
                active_now=True
            )
            self.db.add(listener)
            await self.db.flush()

        # Check workload capacity limit
        open_convs_res = await self.db.execute(
            select(func.count(PeerConversation.id)).where(
                PeerConversation.listener_id == listener.id,
                PeerConversation.conversation_state == "open"
            )
        )
        open_count = open_convs_res.scalar() or 0
        if open_count >= (listener.capacity_limit or 1):
            raise HTTPException(status_code=400, detail="CAPACITY_LIMIT_EXCEEDED")

        now = datetime.now(timezone.utc)
        # Atomic conditional update to claim request (must be queued and not expired)
        stmt = (
            update(ListenerMatchRequest)
            .where(
                ListenerMatchRequest.id == req_uuid,
                ListenerMatchRequest.request_state == "queued",
                or_(ListenerMatchRequest.expires_at.is_(None), ListenerMatchRequest.expires_at > now)
            )
            .values(request_state="matched")
        )
        res = await self.db.execute(stmt)
        if res.rowcount == 0:
            # Check if row exists or was already claimed/cancelled/expired
            chk_stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.id == req_uuid)
            chk_res = await self.db.execute(chk_stmt)
            existing = chk_res.scalar_one_or_none()
            if not existing:
                raise HTTPException(status_code=404, detail="Match request not found.")
            if existing.request_state == "cancelled":
                raise HTTPException(status_code=409, detail="REQUEST_CANCELLED")
            if existing.request_state == "expired" or (existing.expires_at and to_utc(existing.expires_at) < now):
                if existing.request_state == "queued":
                    existing.request_state = "expired"
                    existing.closed_at = now
                    await self.db.commit()
                raise HTTPException(status_code=409, detail="REQUEST_EXPIRED")
            raise HTTPException(status_code=409, detail="REQUEST_ALREADY_CLAIMED")

        # Fetch the claimed request
        req = (await self.db.execute(select(ListenerMatchRequest).where(ListenerMatchRequest.id == req_uuid))).scalar_one()

        # Create ListenerMatch
        match = ListenerMatch(
            id=uuid.uuid4(),
            request_id=req.id,
            listener_id=listener.id,
            match_state="accepted",
            offered_at=datetime.now(timezone.utc),
            accepted_at=datetime.now(timezone.utc)
        )
        self.db.add(match)
        await self.db.flush()

        # Create PeerConversation
        channel = getattr(req, "preferred_channel", "chat") or "chat"
        conv = PeerConversation(
            id=uuid.uuid4(),
            match_id=match.id,
            member_id=req.member_id,
            listener_id=listener.id,
            channel=channel,
            conversation_state="open",
            started_at=datetime.now(timezone.utc)
        )
        self.db.add(conv)
        await self.db.flush()

        # Create initial encrypted welcome message
        topic_text = getattr(req, "support_topic", None) or "General Support"
        welcome_text = f"Hello! A peer listener has connected with you. Topic: {topic_text}."
        ct, kv = encrypt_content(welcome_text)
        msg = PeerMessage(
            id=uuid.uuid4(),
            conversation_id=conv.id,
            sequence_no=1,
            sender_user_id=listener.user_id,
            content_ciphertext=ct,
            key_version=kv,
            delivery_state="delivered",
            sent_at=datetime.now(timezone.utc)
        )
        self.db.add(msg)
        await self.db.commit()

        # Broadcast room ready signal if WebSocket listeners exist
        await manager.broadcast(str(conv.id), {
            "type": "match_accepted",
            "conversation_id": str(conv.id),
            "listener_id": str(listener.id),
            "channel": channel
        })

        return {
            "status": "accepted",
            "match_id": str(match.id),
            "conversation_id": str(conv.id),
            "channel": channel,
            "member_id": req.member_id
        }

    async def decline_match_request(self, user_id: str, request_id: str) -> dict:
        try:
            req_uuid = uuid.UUID(request_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid request ID format.")

        prof_stmt = select(ListenerProfile).where(ListenerProfile.user_id == user_id)
        p_res = await self.db.execute(prof_stmt)
        listener = p_res.scalar_one_or_none()
        if not listener:
            listener = ListenerProfile(
                id=uuid.uuid4(),
                user_id=user_id,
                application_state="approved",
                eligibility_state="eligible",
                capacity_limit=3
            )
            self.db.add(listener)
            await self.db.flush()

        # Record decline on ListenerMatch
        m_stmt = select(ListenerMatch).where(
            ListenerMatch.request_id == req_uuid,
            ListenerMatch.listener_id == listener.id
        )
        m_res = await self.db.execute(m_stmt)
        match = m_res.scalar_one_or_none()
        if match:
            match.match_state = "declined"
            match.end_reason_code = "listener_declined"
            match.ended_at = datetime.now(timezone.utc)
        else:
            match = ListenerMatch(
                id=uuid.uuid4(),
                request_id=req_uuid,
                listener_id=listener.id,
                match_state="declined",
                offered_at=datetime.now(timezone.utc),
                ended_at=datetime.now(timezone.utc),
                end_reason_code="listener_declined"
            )
            self.db.add(match)

        # Ensure request remains queued for another listener
        req_res = await self.db.execute(select(ListenerMatchRequest).where(ListenerMatchRequest.id == req_uuid))
        req = req_res.scalar_one_or_none()
        if req and req.request_state == "offered":
            req.request_state = "queued"

        await self.db.commit()
        return {"status": "declined", "reassigned": True}

    async def toggle_listener_active(self, user_id: str) -> dict:
        stmt = select(ListenerProfile).where(ListenerProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        profile = res.scalar_one_or_none()
        if not profile:
            p_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == user_id))
            if not p_res.scalar_one_or_none():
                self.db.add(AppPrincipal(user_id=user_id, account_state="active"))
                await self.db.flush()

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
            profile.active_now = not profile.active_now

        await self.db.commit()
        await self.db.refresh(profile)
        return {
            "status": "success",
            "active_now": profile.active_now,
            "is_online": profile.active_now
        }

    async def list_conversations(self, user_id: str) -> list[dict]:
        MemberAlias = aliased(MemberProfile)
        stmt = (
            select(
                PeerConversation,
                ListenerProfile.user_id.label("listener_user_id"),
                MemberProfile.display_name.label("listener_name"),
                MemberAlias.display_name.label("member_name"),
            )
            .join(ListenerProfile, PeerConversation.listener_id == ListenerProfile.id)
            .outerjoin(MemberProfile, ListenerProfile.user_id == MemberProfile.user_id)
            .outerjoin(MemberAlias, PeerConversation.member_id == MemberAlias.user_id)
            .where(
                (PeerConversation.member_id == user_id) | (ListenerProfile.user_id == user_id) | (PeerConversation.closed_by_user_id == user_id)
            )
            .order_by(desc(PeerConversation.started_at))
        )
        res = await self.db.execute(stmt)
        rows = res.all()
        result = []
        for conv, l_user_id, l_name, m_name in rows:
            display_listener = l_name or (l_user_id.replace("usr-demo-", "").replace("-", " ").title() if l_user_id else "Verified Peer Listener")
            display_member = m_name or (conv.member_id.replace("usr-demo-", "").replace("-", " ").title() if conv.member_id else "Member")
            result.append({
                "id": str(conv.id),
                "member_id": conv.member_id,
                "member_name": display_member,
                "listener_id": str(conv.listener_id),
                "listener_name": display_listener,
                "channel": conv.channel,
                "status": "completed" if conv.conversation_state == "closed" else ("active" if conv.conversation_state == "open" else conv.conversation_state),
                "started_at": conv.started_at.isoformat(),
                "ended_at": conv.ended_at.isoformat() if conv.ended_at else None,
                "note": "Peer reflection & support session"
            })
        return result

    async def book_peer_session(self, user_id: str, payload: BookSessionRequest) -> dict:
        p_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == user_id))
        if not p_res.scalar_one_or_none():
            new_principal = AppPrincipal(user_id=user_id, account_state="active")
            self.db.add(new_principal)
            await self.db.commit()

        listener = None
        if payload.listener_id:
            try:
                l_uuid = uuid.UUID(payload.listener_id)
                l_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.id == l_uuid))
                listener = l_res.scalar_one_or_none()
            except ValueError:
                pass

        if not listener:
            l_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.application_state == "approved").limit(1))
            listener = l_res.scalar_one_or_none()

        if not listener:
            demo_l_id = "usr-demo-listener-01"
            l_principal = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == demo_l_id))
            if not l_principal.scalar_one_or_none():
                self.db.add(AppPrincipal(user_id=demo_l_id, account_state="active"))
                await self.db.commit()
            
            listener = ListenerProfile(
                id=uuid.uuid4(),
                user_id=demo_l_id,
                application_state="approved",
                eligibility_state="eligible",
                capacity_limit=3
            )
            self.db.add(listener)
            await self.db.commit()
            await self.db.refresh(listener)

        match_req = ListenerMatchRequest(
            id=uuid.uuid4(),
            member_id=user_id,
            request_state="matched",
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(match_req)
        await self.db.flush()

        match = ListenerMatch(
            id=uuid.uuid4(),
            request_id=match_req.id,
            listener_id=listener.id,
            match_state="accepted",
            offered_at=datetime.now(timezone.utc),
            accepted_at=datetime.now(timezone.utc)
        )
        self.db.add(match)
        await self.db.flush()

        db_channel = "voice" if payload.channel in ["voice", "video"] else "text"

        conversation = PeerConversation(
            id=uuid.uuid4(),
            match_id=match.id,
            member_id=user_id,
            listener_id=listener.id,
            channel=db_channel,
            conversation_state="open",
            started_at=datetime.now(timezone.utc)
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)

        welcome_text = f"Hello! Session scheduled with {payload.listener_name or 'Peer Listener'}. Topic: {payload.note or 'General check-in'}."
        ct, kv = encrypt_content(welcome_text)
        msg = PeerMessage(
            id=uuid.uuid4(),
            conversation_id=conversation.id,
            sequence_no=1,
            sender_user_id=listener.user_id,
            content_ciphertext=ct,
            key_version=kv,
            delivery_state="delivered",
            sent_at=datetime.now(timezone.utc)
        )
        self.db.add(msg)
        await self.db.commit()

        return {
            "id": str(conversation.id),
            "date": conversation.started_at.isoformat(),
            "listenerName": payload.listener_name or "Aarav Sharma (Verified Peer Listener)",
            "channel": payload.channel,
            "status": "active",
            "note": payload.note or "Evening reflection & mindfulness check-in"
        }

    async def list_messages(self, conversation_id: str, user_id: str) -> list[dict]:
        c_uuid = uuid.UUID(conversation_id)
        stmt = select(PeerMessage).where(PeerMessage.conversation_id == c_uuid).order_by(PeerMessage.sequence_no)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [
            {
                "id": str(m.id),
                "conversation_id": str(m.conversation_id),
                "sender_user_id": m.sender_user_id,
                "content": decrypt_content(m.content_ciphertext, m.key_version),
                "sent_at": m.sent_at.isoformat()
            }
            for m in items
        ]

    async def send_message(self, user_id: str, conversation_id: str, payload: PeerMessageCreate) -> dict:
        try:
            c_uuid = uuid.UUID(str(conversation_id))
        except (ValueError, AttributeError):
            c_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(conversation_id))

        # Check if conversation is open
        conv_res = await self.db.execute(select(PeerConversation).where(PeerConversation.id == c_uuid))
        conv = conv_res.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        if conv.conversation_state == "closed":
            raise HTTPException(status_code=400, detail="CONVERSATION_CLOSED")

        # Deterministic Crisis Sentinel Check (<2ms)
        is_crisis = bool(CRISIS_REGEX.search(payload.content or ""))
        safety_case_id = None
        if is_crisis:
            try:
                ops = OperationsService(self.db)
                sc_res = await ops.create_safety_case({
                    "member_id": getattr(conv, "member_id", None) or user_id,
                    "source_type": "peer_chat",
                    "source_record_id": str(c_uuid),
                    "trigger_code": "crisis_keyword_detected",
                    "priority_code": "urgent",
                    "policy_version": "v1.0",
                    "jurisdiction": "IN"
                })
                safety_case_id = sc_res.get("id")
                logger.warning(
                    f"Live Crisis Sentinel tripped in conversation {c_uuid} by user {user_id}. "
                    f"Created urgent SafetyCase: {safety_case_id}"
                )
            except Exception as e:
                logger.error(f"Failed to create SafetyCase on crisis sentinel trip: {e}")

        seq_q = await self.db.execute(select(func.coalesce(func.max(PeerMessage.sequence_no), 0)).where(PeerMessage.conversation_id == c_uuid))
        seq = (seq_q.scalar() or 0) + 1

        ct, kv = encrypt_content(payload.content)
        msg = PeerMessage(
            id=uuid.uuid4(),
            conversation_id=c_uuid,
            sequence_no=seq,
            sender_user_id=user_id,
            content_ciphertext=ct,
            key_version=kv,
            delivery_state="delivered",
            sent_at=datetime.now(timezone.utc)
        )
        self.db.add(msg)
        await self.db.commit()

        msg_dict = {
            "id": str(msg.id),
            "conversation_id": str(msg.conversation_id),
            "sequence_no": msg.sequence_no,
            "sender_user_id": user_id,
            "content": payload.content,
            "sent_at": msg.sent_at.isoformat()
        }
        if is_crisis:
            msg_dict["is_crisis"] = True
            if safety_case_id:
                msg_dict["safety_case_id"] = safety_case_id

        # Broadcast via WebSocket manager to both participants in room
        await manager.broadcast(str(c_uuid), {
            "type": "new_message",
            "message": msg_dict
        })

        if is_crisis:
            await manager.broadcast(str(c_uuid), {
                "type": "safety_alert",
                "severity": "urgent",
                "alert": "Safety sentinel detected potential crisis in consultation.",
                "message": "🚨 Immediate Support is Available (24/7 & Confidential): Tele-MANAS (14416) or Dial 112/988",
                "conversation_id": str(c_uuid),
                "helplines": ["14416", "112", "988"],
                "safety_case_id": safety_case_id,
            })

        return msg_dict

    async def close_conversation(self, user_id: str, conversation_id: str) -> dict:
        c_uuid = None
        try:
            c_uuid = uuid.UUID(conversation_id)
        except (ValueError, AttributeError):
            c_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(conversation_id))

        stmt = select(PeerConversation).where(PeerConversation.id == c_uuid)
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            return {"status": "success", "conversation_id": str(c_uuid), "conversation_state": "closed", "state": "closed"}

        # Idempotent closure
        if conv.conversation_state != "closed":
            conv.conversation_state = "closed"
            conv.ended_at = datetime.now(timezone.utc)
            conv.closed_by_user_id = user_id

            # End linked match
            m_res = await self.db.execute(select(ListenerMatch).where(ListenerMatch.id == conv.match_id))
            match = m_res.scalar_one_or_none()
            if match and not match.ended_at:
                match.ended_at = datetime.now(timezone.utc)
                match.end_reason_code = "completed"

            await self.db.commit()

            # Broadcast session closed signal
            await manager.broadcast(str(c_uuid), {
                "type": "session_closed",
                "conversation_id": str(c_uuid),
                "closed_by_user_id": user_id
            })

        return {"status": "success", "conversation_id": str(c_uuid), "conversation_state": "closed", "state": "closed"}

    async def submit_feedback(self, user_id: str, conversation_id: str, payload: FeedbackCreate) -> dict:
        try:
            c_uuid = uuid.UUID(conversation_id)
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid conversation ID format.")

        stmt = select(PeerConversation).where(PeerConversation.id == c_uuid)
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")

        # Check if feedback was already submitted for this conversation (idempotency enforcement)
        fb_stmt = select(ListenerFeedback).where(ListenerFeedback.conversation_id == c_uuid)
        fb_res = await self.db.execute(fb_stmt)
        if fb_res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="FEEDBACK_ALREADY_SUBMITTED")

        # Encrypt narrative feedback with AES-256-GCM
        raw_text = payload.feedback_text or ""
        ct, kv = encrypt_content(raw_text)

        feedback = ListenerFeedback(
            id=uuid.uuid4(),
            conversation_id=c_uuid,
            member_id=user_id,
            rating=payload.rating,
            feedback_ciphertext=ct,
            key_version=kv,
            post_mood_score=payload.post_mood_score,
            sync_to_journal=payload.sync_to_journal,
            review_state="received",
            submitted_at=datetime.now(timezone.utc)
        )
        self.db.add(feedback)

        # Update listener rolling rating and total conversations with row lock
        l_stmt = select(ListenerProfile).where(ListenerProfile.id == conv.listener_id).with_for_update()
        l_res = await self.db.execute(l_stmt)
        listener = l_res.scalar_one_or_none()
        if listener:
            prev_total = listener.total_conversations or 0
            prev_rating = listener.rating if listener.rating is not None else 5.0
            new_total = prev_total + 1
            new_rating = round(((prev_rating * prev_total) + payload.rating) / new_total, 2)
            listener.total_conversations = new_total
            listener.rating = new_rating

        await self.db.commit()
        await self.db.refresh(feedback)

        return {
            "status": "success",
            "feedback_id": str(feedback.id)
        }

    async def save_soap_note(self, user_id: str, conversation_id: str, payload: SoapNoteCreate) -> dict:
        c_uuid = None
        try:
            c_uuid = uuid.UUID(conversation_id)
        except (ValueError, AttributeError):
            c_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(conversation_id))

        stmt = select(PeerConversation).where(PeerConversation.id == c_uuid)
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()

        if not conv:
            l_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
            listener = l_res.scalar_one_or_none()
            if not listener:
                p_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == user_id))
                if not p_res.scalar_one_or_none():
                    self.db.add(AppPrincipal(user_id=user_id, account_state="active"))
                    await self.db.flush()
                listener = ListenerProfile(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    application_state="approved",
                    eligibility_state="eligible",
                    capacity_limit=3
                )
                self.db.add(listener)
                await self.db.flush()

            member_uid = "usr-demo-member-01"
            m_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == member_uid))
            if not m_res.scalar_one_or_none():
                self.db.add(AppPrincipal(user_id=member_uid, account_state="active"))
                await self.db.flush()

            m_req = ListenerMatchRequest(
                id=uuid.uuid4(),
                member_id=member_uid,
                request_state="matched"
            )
            self.db.add(m_req)
            await self.db.flush()

            l_match = ListenerMatch(
                id=uuid.uuid4(),
                request_id=m_req.id,
                listener_id=listener.id,
                match_state="accepted"
            )
            self.db.add(l_match)
            await self.db.flush()

            conv = PeerConversation(
                id=c_uuid,
                match_id=l_match.id,
                member_id=member_uid,
                listener_id=listener.id,
                channel="voice",
                conversation_state="closed",
                started_at=datetime.now(timezone.utc) - timedelta(minutes=45),
                ended_at=datetime.now(timezone.utc),
                closed_by_user_id=user_id
            )
            self.db.add(conv)
            await self.db.flush()
        else:
            conv.conversation_state = "closed"
            conv.ended_at = datetime.now(timezone.utc)
            conv.closed_by_user_id = user_id

        soap_content = f"[SOAP RECORD]\nS: {payload.subjective}\nO: {payload.objective}\nA: {payload.assessment}\nP: {payload.plan}"
        ct, kv = encrypt_content(soap_content)

        seq_q = await self.db.execute(select(func.coalesce(func.max(PeerMessage.sequence_no), 0)).where(PeerMessage.conversation_id == c_uuid))
        seq = (seq_q.scalar() or 0) + 1

        msg = PeerMessage(
            id=uuid.uuid4(),
            conversation_id=c_uuid,
            sequence_no=seq,
            sender_user_id=user_id,
            content_ciphertext=ct,
            key_version=kv,
            delivery_state="delivered",
            sent_at=datetime.now(timezone.utc)
        )
        self.db.add(msg)
        await self.db.commit()

        return {
            "status": "success",
            "conversation_id": str(c_uuid),
            "message": "SOAP record encrypted and saved to PostgreSQL",
            "saved_at": datetime.now(timezone.utc).isoformat()
        }

    async def update_listener_profile(self, user_id: str, payload: ListenerProfileUpdate) -> dict:
        p_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == user_id))
        if not p_res.scalar_one_or_none():
            self.db.add(AppPrincipal(user_id=user_id, account_state="active"))
            await self.db.flush()

        online_val = payload.active_now
        if online_val is None:
            online_val = payload.is_online if payload.is_online is not None else payload.isOnline

        prof_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            profile = ListenerProfile(
                id=uuid.uuid4(),
                user_id=user_id,
                application_state="approved",
                eligibility_state="eligible",
                capacity_limit=payload.capacity_limit or 3,
                profile_languages=payload.profile_languages or ["English", "Hindi"],
                active_now=online_val if online_val is not None else False
            )
            self.db.add(profile)
        else:
            if payload.capacity_limit is not None:
                profile.capacity_limit = payload.capacity_limit
            if payload.profile_languages is not None:
                profile.profile_languages = payload.profile_languages
            if online_val is not None:
                profile.active_now = online_val

        if payload.display_name:
            m_res = await self.db.execute(select(MemberProfile).where(MemberProfile.user_id == user_id))
            m_prof = m_res.scalar_one_or_none()
            if m_prof:
                m_prof.display_name = payload.display_name
            else:
                self.db.add(MemberProfile(user_id=user_id, display_name=payload.display_name))

        await self.db.commit()
        return {
            "status": "success",
            "message": "Listener profile updated successfully in PostgreSQL",
            "capacity_limit": profile.capacity_limit,
            "profile_languages": profile.profile_languages,
            "display_name": payload.display_name,
            "active_now": profile.active_now,
            "is_online": profile.active_now,
            "isOnline": profile.active_now
        }

    async def verify_conversation_participant(self, conversation_id: str, user_id: str) -> tuple[bool, Optional[PeerConversation]]:
        try:
            c_uuid = uuid.UUID(str(conversation_id))
        except (ValueError, AttributeError):
            c_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(conversation_id))

        stmt = select(PeerConversation).where(PeerConversation.id == c_uuid)
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            return False, None

        # Check member ownership
        if conv.member_id == user_id:
            return True, conv

        # Check direct listener_id match (if UUID string passed)
        if str(conv.listener_id) == user_id:
            return True, conv

        # Check listener user_id via ListenerProfile
        lp_stmt = select(ListenerProfile).where(ListenerProfile.id == conv.listener_id)
        lp_res = await self.db.execute(lp_stmt)
        listener = lp_res.scalar_one_or_none()
        if listener and listener.user_id == user_id:
            return True, conv

        # Check supervisor or safety role
        ra_stmt = select(RoleAssignment).where(
            RoleAssignment.user_id == user_id,
            RoleAssignment.role_code.in_(["listener_supervisor", "safety_operations_specialist"]),
            RoleAssignment.assignment_state == "active"
        )
        ra_res = await self.db.execute(ra_stmt)
        if ra_res.scalar_one_or_none():
            return True, conv

        return False, conv


def get_peer_service(db: AsyncSession = Depends(get_db)) -> PeerService:
    return PeerService(db)
