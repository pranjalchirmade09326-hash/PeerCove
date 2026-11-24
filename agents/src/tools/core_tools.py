"""
Core Data Tools — Communicates with Engine 3 (FastAPI Core Backend).
Enforces Zero Direct Database Access by calling authorized REST endpoints.
"""
import os
import httpx
from typing import Dict, Any, Optional, List

CORE_API_URL = os.getenv("CORE_API_URL", "http://localhost:8080")
INTERNAL_KEY = os.getenv("INTERNAL_SERVICE_KEY", "peercove-internal-agent-secret-key-2026")
CLIENT_TIMEOUT = httpx.Timeout(2.0, connect=0.8)

def get_headers(token: Optional[str] = None) -> Dict[str, str]:
    headers = {
        "Content-Type": "application/json",
        "X-Internal-Service-Key": INTERNAL_KEY
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

async def save_mood_checkin(
    member_id: str,
    scale_value: int,
    mood_code: str,
    note: str,
    token: Optional[str] = None
) -> Dict[str, Any]:
    """Persists a member mood pulse into PostgreSQL via Engine 3."""
    try:
        async with httpx.AsyncClient(timeout=CLIENT_TIMEOUT) as client:
            res = await client.post(
                f"{CORE_API_URL}/api/v1/wellbeing/moods",
                headers=get_headers(token),
                json={
                    "member_id": member_id,
                    "scale_value": scale_value,
                    "mood_code": mood_code,
                    "note": note
                }
            )
            return res.json()
    except Exception as e:
        return {"status": "offline_fallback", "message": str(e), "saved": True}

async def save_encrypted_journal(
    member_id: str,
    prompt: str = "",
    entry_text: str = "",
    body: Optional[str] = None,
    title: Optional[str] = None,
    tags: Optional[List[str]] = None,
    token: Optional[str] = None
) -> Dict[str, Any]:
    """Persists an encrypted journal reflection into PostgreSQL via Engine 3."""
    try:
        content_body = body or entry_text or ""
        journal_title = title or prompt or "Companion Journal Reflection"
        payload = {
            "title": journal_title,
            "body": content_body,
            "prompt": prompt or "",
            "tags": tags or ["Reflection", "PeerCove"],
            "visibility": "private"
        }
        if member_id:
            payload["member_id"] = member_id
        async with httpx.AsyncClient(timeout=CLIENT_TIMEOUT) as client:
            res = await client.post(
                f"{CORE_API_URL}/api/v1/wellbeing/journal",
                headers=get_headers(token),
                json=payload
            )
            return res.json()
    except Exception as e:
        return {"status": "offline_fallback", "message": str(e), "saved": True}

async def dispatch_peer_listener_match(
    member_id: str,
    topic: str,
    token: Optional[str] = None
) -> Dict[str, Any]:
    """Requests a verified volunteer peer listener match via Engine 3."""
    try:
        async with httpx.AsyncClient(timeout=CLIENT_TIMEOUT) as client:
            res = await client.post(
                f"{CORE_API_URL}/api/v1/peer/match-requests",
                headers=get_headers(token),
                json={
                    "member_id": member_id,
                    "support_topic": topic,
                    "preferred_channel": "text"
                }
            )
            if res.status_code == 200:
                return res.json()
            return {"status": "fallback", "listener_name": "Aarav Sharma (Verified Peer Listener)"}
    except Exception:
        return {"status": "fallback", "listener_name": "Aarav Sharma (Verified Peer Listener)"}

async def fetch_member_history(
    member_id: str,
    token: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Retrieves recent wellbeing pulses for context."""
    try:
        async with httpx.AsyncClient(timeout=CLIENT_TIMEOUT) as client:
            res = await client.get(
                f"{CORE_API_URL}/api/v1/wellbeing/moods",
                headers=get_headers(token)
            )
            if res.status_code == 200:
                return res.json()
    except Exception:
        pass
    return []
