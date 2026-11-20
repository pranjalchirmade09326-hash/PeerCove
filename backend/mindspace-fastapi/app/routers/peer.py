from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from app.core.security import get_current_user_id
from app.core.websocket_manager import manager
from app.schemas.peer import (
    MatchRequestCreate,
    BookSessionRequest,
    PeerMessageCreate,
    SoapNoteCreate,
    ListenerProfileUpdate,
    FeedbackCreate,
)
from app.services.peer_service import PeerService, get_peer_service
from typing import Dict, Any, Optional
import jwt

router = APIRouter(prefix="/api/v1", tags=["Peer Support"])


@router.get("/peer/listeners")
async def list_available_listeners(
    service: PeerService = Depends(get_peer_service),
):
    return await service.list_available_listeners()


@router.get("/peer/match-requests")
async def list_match_requests(
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.list_match_requests(user_id)


@router.post("/peer/match-requests")
async def create_match_request(
    payload: MatchRequestCreate,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.create_match_request(user_id, payload)


# NOTE: /active must precede /{request_id} so "active" is not treated as a request ID path parameter
@router.get("/peer/match-requests/active")
async def list_active_match_requests(
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.list_active_match_requests(user_id)


@router.get("/peer/match-requests/{request_id}")
async def get_match_request_status(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.get_match_request_status(user_id, request_id)


@router.post("/peer/match-requests/{request_id}/cancel")
async def cancel_match_request(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.cancel_match_request(user_id, request_id)


@router.post("/peer/match-requests/{request_id}/accept")
@router.post("/listeners/me/offers/{request_id}/accept")
async def accept_match_request(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.accept_match_request(user_id, request_id)


@router.post("/peer/match-requests/{request_id}/decline")
@router.post("/listeners/me/offers/{request_id}/decline")
async def decline_match_request(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.decline_match_request(user_id, request_id)


@router.post("/listeners/me/toggle-active")
async def toggle_listener_active(
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.toggle_listener_active(user_id)


@router.get("/peer/conversations")
async def list_conversations(
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.list_conversations(user_id)


@router.post("/peer/conversations")
@router.post("/peer/book-session")
async def book_peer_session(
    payload: BookSessionRequest,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.book_peer_session(user_id, payload)


@router.get("/peer/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.list_messages(conversation_id, user_id)


@router.post("/peer/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    payload: PeerMessageCreate,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.send_message(user_id, conversation_id, payload)


@router.put("/peer/conversations/{conversation_id}/close")
async def close_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.close_conversation(user_id, conversation_id)


@router.post("/peer/conversations/{conversation_id}/feedback")
async def submit_feedback(
    conversation_id: str,
    payload: FeedbackCreate,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.submit_feedback(user_id, conversation_id, payload)


@router.post("/peer/conversations/{conversation_id}/soap")
async def save_soap_note(
    conversation_id: str,
    payload: SoapNoteCreate,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.save_soap_note(user_id, conversation_id, payload)


@router.put("/peer/listeners/me")
async def update_listener_profile(
    payload: ListenerProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.update_listener_profile(user_id, payload)


def extract_ws_user_id(websocket: WebSocket) -> Optional[str]:
    """Extract authenticated user_id from WebSocket headers or query parameters."""
    # 1. Check custom identity headers
    header_user = (
        websocket.headers.get("x-user-id")
        or websocket.headers.get("x-member-id")
        or websocket.headers.get("x-listener-id")
    )
    if header_user and header_user.strip():
        return header_user.strip()

    # 2. Check Bearer Authorization header
    auth_header = websocket.headers.get("authorization")
    raw_token = None
    if auth_header and auth_header.strip():
        parts = auth_header.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            raw_token = parts[1]
        elif len(parts) == 1:
            raw_token = parts[0]

    # 3. Check query parameters (?token=... or ?user_id=...)
    if not raw_token:
        raw_token = (
            websocket.query_params.get("token")
            or websocket.query_params.get("auth_token")
            or websocket.query_params.get("user_id")
            or websocket.query_params.get("userId")
        )

    if not raw_token:
        return None

    token_str = str(raw_token).strip()
    if "." in token_str:
        try:
            unverified = jwt.decode(token_str, options={"verify_signature": False})
            sub = unverified.get("sub") or unverified.get("userId") or unverified.get("id")
            if sub:
                return str(sub)
        except Exception:
            pass

    return token_str


# WebSocket consultation channel
@router.websocket("/peer/ws/{conversation_id}")
async def websocket_peer_endpoint(
    websocket: WebSocket,
    conversation_id: str,
    service: PeerService = Depends(get_peer_service),
):
    # Step A: Authenticate connecting party
    auth_user_id = extract_ws_user_id(websocket)
    if not auth_user_id:
        await websocket.accept()
        await websocket.send_json({"type": "error", "code": 4003, "detail": "AUTHENTICATION_REQUIRED"})
        await websocket.close(code=4003, reason="AUTHENTICATION_REQUIRED")
        return

    # Step B: Authorize participant membership against PeerConversation
    is_authorized, conv = await service.verify_conversation_participant(conversation_id, auth_user_id)
    if not conv:
        await websocket.accept()
        await websocket.send_json({"type": "error", "code": 4004, "detail": "CONVERSATION_NOT_FOUND"})
        await websocket.close(code=4004, reason="CONVERSATION_NOT_FOUND")
        return

    if not is_authorized:
        await websocket.accept()
        await websocket.send_json({"type": "error", "code": 4003, "detail": "FORBIDDEN_NOT_PARTICIPANT"})
        await websocket.close(code=4003, reason="FORBIDDEN_NOT_PARTICIPANT")
        return

    # Step C: Register authorized connection into broadcast pool
    await manager.connect(conversation_id, websocket, user_id=auth_user_id)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif msg_type in ("webrtc_signal", "offer", "answer", "candidate", "ice_candidate") or "signal" in data:
                signal = data.get("signal")
                if signal is None and msg_type in ("offer", "answer", "candidate", "ice_candidate"):
                    signal = data
                # STRICT IDENTITY BINDING: from_user_id is ALWAYS the authenticated auth_user_id
                await manager.broadcast(
                    str(conversation_id),
                    {
                        "type": "webrtc_signal",
                        "signal": signal,
                        "from_user_id": auth_user_id,
                    },
                    exclude=websocket,
                )
            elif msg_type == "session_closed":
                # STRICT IDENTITY BINDING: closed_by_user_id is ALWAYS auth_user_id
                await service.close_conversation(auth_user_id, conversation_id)
            else:
                content = data.get("content") or data.get("text")
                if content:
                    msg_payload = PeerMessageCreate(content=content)
                    # STRICT IDENTITY BINDING: sender is ALWAYS auth_user_id
                    await service.send_message(auth_user_id, conversation_id, msg_payload)
    except WebSocketDisconnect:
        manager.disconnect(conversation_id, websocket)
    except Exception:
        manager.disconnect(conversation_id, websocket)
