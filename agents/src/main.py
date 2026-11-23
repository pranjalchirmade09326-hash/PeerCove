"""
MindSpace Multi-Agent Service Entrypoint (Port :8018).
Exposes HTTP, streaming, and voice endpoints for Next.js frontend consumption.
"""
import os
import sys
import asyncio
import logging
from pathlib import Path

# Add project root to sys.path
current_dir = Path(__file__).resolve().parent
agents_root = current_dir.parent
sys.path.insert(0, str(agents_root))

import json
import io
import time
import base64
import wave
import struct
from collections import deque
from fastapi import FastAPI, HTTPException, Header, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
from dotenv import load_dotenv

# Load environment variables from agents/.env
load_dotenv(agents_root / ".env")

from src.orchestrator import orchestrator_app
from src.nodes.voice_service import synthesize_speech, transcribe_audio
from src.nodes.llm_client import invoke_gemini_chat
from src.auth import validate_token, validate_token_async, verify_token, AuthenticationError

app = FastAPI(
    title="MindSpace Multi-Agent Service",
    description="Engine 2: Multi-Agent Intelligence and Triage Service",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    session_id: str
    member_id: str
    messages: List[Dict[str, Any]]
    active_tier: Optional[int] = 1

class IntakeRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    member_id: Optional[str] = "member-user"

class VoiceSynthesizeRequest(BaseModel):
    text: str
    target_language_code: Optional[str] = "hi-IN"
    speaker: Optional[str] = "priya"

@app.get("/")
def root():
    """Root endpoint for quick browser verification."""
    return {
        "service": "MindSpace Multi-Agent Engine",
        "status": "online",
        "port": 8018,
        "health": "/health",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Service health verification endpoint."""
    return {
        "status": "healthy",
        "service": "MindSpace Multi-Agent Engine",
        "port": 8018,
        "framework": "LangGraph (StateGraph)"
    }

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Silence browser favicon requests."""
    return Response(status_code=204)

@app.post("/api/v1/chat")
async def chat_endpoint(req: ChatRequest, authorization: Optional[str] = Header(None)):
    """Primary chat endpoint executing the LangGraph multi-agent cycle."""
    token = authorization.replace("Bearer ", "") if authorization else None
    
    initial_state = {
        "session_id": req.session_id,
        "member_id": req.member_id,
        "auth_token": token,
        "messages": req.messages,
        "active_tier": req.active_tier or 1,
        "is_crisis": False,
        "crisis_reason": None,
        "matched_listener_name": None,
        "next_node": ""
    }
    
    # Execute the Multi-Agent State Machine
    final_state = orchestrator_app.invoke(initial_state)
    latest_reply = final_state["messages"][-1]
    
    return {
        "session_id": req.session_id,
        "reply": latest_reply,
        "is_crisis": final_state.get("is_crisis", False),
        "matched_listener": final_state.get("matched_listener_name")
    }

logger = logging.getLogger("mindspace.agents")

# Global in-memory multi-turn session cache
SESSION_MEMORIES: Dict[str, List[Dict[str, str]]] = {}

@app.post("/api/agent/intake")
async def intake_stream_endpoint(req: IntakeRequest, authorization: Optional[str] = Header(None)):
    """
    Direct endpoint for Next.js frontend proxy (INTAKE_AGENT_URL).
    Supports token streaming back to MemberDashboardView with full multi-turn conversational memory,
    emitting standards-compliant SSE (text_delta, agent_end, error) chunks matching parseChunkLine().
    """
    token = authorization.replace("Bearer ", "") if authorization else None
    sess_id = req.session_id or f"sess-{int(asyncio.get_event_loop().time() * 1000)}"

    # Retrieve or initialize conversation history for this session
    history = SESSION_MEMORIES.get(sess_id, [])
    history.append({"role": "user", "content": req.message})

    initial_state = {
        "session_id": sess_id,
        "member_id": req.member_id or "member-sanctuary",
        "auth_token": token,
        "messages": list(history),
        "active_tier": 1,
        "is_crisis": False,
        "crisis_reason": None,
        "matched_listener_name": None,
        "next_node": ""
    }

    try:
        # Offload synchronous LangGraph execution to worker thread to avoid blocking the event loop
        final_state = await asyncio.to_thread(orchestrator_app.invoke, initial_state)
        latest_reply = final_state["messages"][-1]
        reply_content = latest_reply.get("content", "I am holding space for you.")
        is_crisis = bool(final_state.get("is_crisis", False))
        active_tier = int(final_state.get("active_tier", 1))
    except Exception as e:
        logger.error(f"[intake_stream_endpoint] LangGraph orchestration error: {e}", exc_info=True)
        reply_content = "Thank you for sharing. I am here listening to you with empathy and care."
        is_crisis = False
        active_tier = 1

    # Commit assistant response to session memory so subsequent turns have complete context
    history.append({"role": "assistant", "content": reply_content})
    SESSION_MEMORIES[sess_id] = history[-20:]

    async def sse_generator():
        try:
            words = reply_content.split(" ")
            for i, word in enumerate(words):
                token_text = word + (" " if i < len(words) - 1 else "")
                delta_payload = json.dumps({
                    "type": "text_delta",
                    "data": {"content": token_text}
                })
                yield f"data: {delta_payload}\n\n"
                await asyncio.sleep(0.02)

            end_payload = json.dumps({
                "type": "agent_end",
                "session_id": sess_id,
                "is_crisis": is_crisis,
                "active_tier": active_tier
            })
            yield f"data: {end_payload}\n\n"
        except Exception as gen_err:
            logger.error(f"[intake_stream_endpoint] Generator streaming error: {gen_err}", exc_info=True)
            err_payload = json.dumps({
                "type": "error",
                "error": "A streaming interruption occurred."
            })
            yield f"data: {err_payload}\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream; charset=utf-8",
        headers={
            "X-Session-Id": sess_id,
            "X-Is-Crisis": str(is_crisis).lower(),
            "X-Active-Tier": str(active_tier),
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.post("/api/v1/voice/synthesize")
async def voice_synthesize_endpoint(req: VoiceSynthesizeRequest):
    """Synthesizes text into natural audio using Sarvam TTS."""
    result = await synthesize_speech(
        text=req.text,
        target_language_code=req.target_language_code or "hi-IN",
        speaker=req.speaker or "priya"
    )
    return result

@app.post("/api/v1/voice/transcribe")
async def voice_transcribe_endpoint(request: Request, authorization: Optional[str] = Header(None)):
    """
    Transcribes user spoken voice audio into text using Sarvam STT with Google Gemini multimodal fallback.
    Accepts both multipart/form-data and raw binary audio bodies with arbitrary audio/webm, audio/wav, or audio/ogg MIME types.
    """
    if authorization and authorization.strip():
        token = authorization.replace("Bearer ", "").strip()
        try:
            valid, member_id, _ = await validate_token_async(token)
            if not valid:
                raise HTTPException(status_code=401, detail="Invalid or expired authentication token")
        except AuthenticationError as e:
            raise HTTPException(status_code=401, detail=str(e))

    content_type = request.headers.get("content-type", "")
    audio_bytes = b""
    mime_type = "audio/webm"

    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("file")
        if uploaded_file and hasattr(uploaded_file, "read"):
            audio_bytes = await uploaded_file.read()
            mime_type = getattr(uploaded_file, "content_type", "audio/webm") or "audio/webm"
    else:
        audio_bytes = await request.body()
        if content_type:
            mime_type = content_type.split(";")[0].strip()

    if not audio_bytes:
        return {"status": "empty", "transcript": ""}

    result = await transcribe_audio(audio_bytes, mime_type=mime_type)
    return result

def pcm16_to_wav(pcm_bytes: bytes, sample_rate: int = 16000, channels: int = 1) -> bytes:
    """Wraps raw 16-bit PCM audio frames into valid WAV container."""
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_bytes)
    return buf.getvalue()

def calculate_energy(pcm_chunk: bytes) -> float:
    """Computes average absolute amplitude of PCM-16 chunk."""
    if not pcm_chunk:
        return 0.0
    count = len(pcm_chunk) // 2
    if count == 0:
        return 0.0
    samples = struct.unpack(f"{count}h", pcm_chunk[:count*2])
    return sum(abs(s) for s in samples) / count

@app.websocket("/ws/audio")
@app.websocket("/audio")
async def voice_websocket_endpoint(websocket: WebSocket):
    """
    Real-time bidirectional WebSocket voice streaming endpoint.
    Communicates directly with VoiceIntakeTest and frontend voice components.
    Features:
      - Authenticated connection with cryptographic EdDSA JWT validation & session isolation.
      - Integrated LangGraph orchestration executing Safety Sentinel before generation.
      - Adaptive Voice Activity Detection (VAD) with pre-speech roll buffer.
      - Automatic language detection (Hindi, Hinglish, English) via Sarvam STT (saaras:v3).
      - Multi-turn conversational memory with non-blocking async execution.
      - Crisis voice response synthesis with Tele-MANAS (14416) emergency audio.
    """
    # 1. Authenticate WebSocket connection
    token = websocket.query_params.get("token")
    is_valid, member_id, claims = await validate_token_async(token)
    if not is_valid:
        logger.warning("[ws/audio] Unauthorized connection attempt rejected (missing or invalid token)")
        await websocket.close(code=4401, reason="Unauthorized: Valid authentication token required")
        return

    await websocket.accept()
    sess_id = f"voice-sess-{int(asyncio.get_event_loop().time() * 1000)}"
    session_history: List[Dict[str, str]] = []

    # 2. Send greeting phase
    await websocket.send_json({"type": "status", "status": "greeting"})
    greeting_text = "Namaste. I am your MindSpace Voice Companion. I am here listening to you with care. How are you feeling today?"
    session_history.append({"role": "assistant", "content": greeting_text})

    greeting_voice = await synthesize_speech(greeting_text)
    greeting_b64 = greeting_voice.get("audio_base64")
    
    await websocket.send_json({
        "type": "text",
        "text": greeting_text,
        "audio": greeting_b64
    })
    await websocket.send_json({"type": "status", "status": "ready"})

    # Natural conversational cooldown (allows natural barge-in / speech)
    greeting_bytes_len = (len(greeting_b64) * 3 // 4 - 44) if greeting_b64 else 0
    greeting_duration = max(1.5, min(4.0, greeting_bytes_len / 48000.0)) if greeting_bytes_len > 0 else 2.0
    ai_speaking_until = asyncio.get_event_loop().time() + greeting_duration

    audio_buffer = bytearray()
    pre_speech_ring = deque(maxlen=30)  # ~300ms pre-roll to preserve starting syllables
    silence_frames = 0
    speech_confirm_frames = 0
    speech_detected = False
    ambient_noise = 80.0

    # Common single-syllable acoustic noise / false triggers to ignore
    NOISE_TOKENS = {"कि", "वाह", "आ", "जी", "हां", "हाँ", "uh", "um", "ah", "oh"}

    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                chunk = message["bytes"]
                energy = calculate_energy(chunk)

                # Dynamic background noise floor estimation
                if not speech_detected:
                    ambient_noise = 0.95 * ambient_noise + 0.05 * energy
                    pre_speech_ring.append(chunk)

                # Robust threshold: speech is significantly above ambient floor
                speech_threshold = max(280.0, ambient_noise * 1.85)

                if energy > speech_threshold:
                    speech_confirm_frames += 1
                    if speech_confirm_frames >= 5:  # ~50ms sustained sound confirms speech
                        if not speech_detected:
                            speech_detected = True
                            silence_frames = 0
                            for pre_chunk in pre_speech_ring:
                                audio_buffer.extend(pre_chunk)
                            pre_speech_ring.clear()
                        audio_buffer.extend(chunk)
                        silence_frames = 0
                elif speech_detected:
                    audio_buffer.extend(chunk)
                    silence_frames += 1
                    speech_confirm_frames = max(0, speech_confirm_frames - 1)
                else:
                    speech_confirm_frames = max(0, speech_confirm_frames - 1)

                # Turn-End detection:
                # Requires at least ~0.75s (24,000 bytes) of actual speech and a natural pause (~0.85s, 80 frames)
                should_process = False
                if speech_detected and silence_frames >= 75 and len(audio_buffer) >= 24000:
                    should_process = True
                elif len(audio_buffer) >= 384000:  # Safety cap at ~12 seconds
                    should_process = True

                if should_process:
                    wav_data = pcm16_to_wav(bytes(audio_buffer), sample_rate=16000, channels=1)
                    audio_buffer.clear()
                    pre_speech_ring.clear()
                    speech_detected = False
                    speech_confirm_frames = 0
                    silence_frames = 0

                    # Transcribe user speech via Sarvam STT with auto-detect (Hindi, Hinglish, English) and Gemini fallback
                    stt_result = await transcribe_audio(wav_data, mime_type="audio/wav", language_code="unknown")
                    transcript = stt_result.get("transcript", "").strip()
                    logger.info(f"[ws/audio] Captured user speech: '{transcript}'")

                    # Valid speech check: ignore empty, single punctuation, or isolated noise words
                    clean_words = [w for w in transcript.split() if w not in NOISE_TOKENS]
                    if transcript and len(transcript) >= 3 and len(clean_words) >= 1:
                        await websocket.send_json({"type": "transcript", "text": transcript})
                        await websocket.send_json({"type": "status", "status": "thinking"})

                        # Construct MindSpaceAgentState according to schema
                        initial_state = {
                            "session_id": sess_id,
                            "member_id": member_id or "member-sanctuary",
                            "auth_token": token,
                            "messages": list(session_history) + [{"role": "user", "content": transcript}],
                            "active_tier": 1,
                            "is_crisis": False,
                            "crisis_reason": None,
                            "matched_listener_name": None,
                            "next_node": ""
                        }

                        try:
                            # Execute LangGraph asynchronously via worker thread
                            final_state = await asyncio.to_thread(orchestrator_app.invoke, initial_state)
                            latest_reply = final_state["messages"][-1]
                            reply = latest_reply.get("content", "I am holding space for you.")
                            is_crisis = bool(final_state.get("is_crisis", False))
                        except Exception as e:
                            logger.error(f"[ws/audio] LangGraph execution error: {e}", exc_info=True)
                            reply = "Thank you for sharing. I am here listening to you with empathy and care."
                            is_crisis = False

                        session_history.append({"role": "user", "content": transcript})
                        session_history.append({"role": "assistant", "content": reply})

                        # Spoken guidance synthesis (TTS)
                        spoken_text = reply
                        if is_crisis:
                            spoken_text = (
                                "Please know that immediate support is available. "
                                "You can call Tele-MANAS at 14416 or dial emergency at 112. "
                                "We are here with you."
                            )

                        # Synthesize speech via Sarvam TTS (bulbul:v3 @ 24kHz)
                        tts_result = await synthesize_speech(spoken_text)
                        audio_b64 = tts_result.get("audio_base64")

                        # Cooldown calculation
                        if audio_b64:
                            audio_raw_len = len(audio_b64) * 3 // 4 - 44
                            audio_duration = max(2.0, min(6.0, audio_raw_len / 48000.0))
                        else:
                            audio_duration = max(2.0, min(5.0, len(reply.split()) * 0.35))

                        ai_speaking_until = asyncio.get_event_loop().time() + audio_duration

                        await websocket.send_json({
                            "type": "text",
                            "text": reply,
                            "audio": audio_b64,
                            "is_crisis": is_crisis
                        })
                        await websocket.send_json({"type": "status", "status": "ready"})
            elif "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                    user_text = data.get("text") or data.get("message")
                    if user_text:
                        await websocket.send_json({"type": "transcript", "text": user_text})
                        await websocket.send_json({"type": "status", "status": "thinking"})

                        initial_state = {
                            "session_id": sess_id,
                            "member_id": member_id or "member-sanctuary",
                            "auth_token": token,
                            "messages": list(session_history) + [{"role": "user", "content": user_text}],
                            "active_tier": 1,
                            "is_crisis": False,
                            "crisis_reason": None,
                            "matched_listener_name": None,
                            "next_node": ""
                        }

                        try:
                            final_state = await asyncio.to_thread(orchestrator_app.invoke, initial_state)
                            latest_reply = final_state["messages"][-1]
                            reply = latest_reply.get("content", "I am holding space for you.")
                            is_crisis = bool(final_state.get("is_crisis", False))
                        except Exception as e:
                            logger.error(f"[ws/audio] Text frame LangGraph error: {e}", exc_info=True)
                            reply = "Thank you for sharing. I am here listening to you with empathy and care."
                            is_crisis = False

                        session_history.append({"role": "user", "content": user_text})
                        session_history.append({"role": "assistant", "content": reply})

                        spoken_text = reply
                        if is_crisis:
                            spoken_text = (
                                "Please know that immediate support is available. "
                                "You can reach Tele-MANAS at 14416 or call emergency services at 112. "
                                "We are here with you."
                            )

                        tts_result = await synthesize_speech(spoken_text)
                        audio_b64 = tts_result.get("audio_base64")

                        await websocket.send_json({
                            "type": "text",
                            "text": reply,
                            "audio": audio_b64,
                            "is_crisis": is_crisis
                        })
                        await websocket.send_json({"type": "status", "status": "ready"})
                except Exception as e:
                    logger.error(f"[ws/audio] Text frame handling error: {e}", exc_info=True)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[ws/audio] connection closed: {e}")

def main():
    import uvicorn
    port = int(os.getenv("PORT", 8018))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=True)

if __name__ == "__main__":
    main()
