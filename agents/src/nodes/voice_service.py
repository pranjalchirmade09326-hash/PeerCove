"""
Sarvam AI Voice Service — Low-latency Speech-to-Text and Text-to-Speech Gateway.
Supports Indian languages, regional accents, and soothing companion synthesis.
"""
import os
import base64
import logging
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger("mindspace.voice")

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

def get_sarvam_key() -> str:
    return os.getenv("SARVAM_API_KEY", "").strip() or SARVAM_API_KEY.strip()

async def synthesize_speech(
    text: str,
    target_language_code: str = "hi-IN",
    speaker: str = "priya",
    pitch: float = 0.0,
    pace: float = 0.95
) -> Dict[str, Any]:
    """
    Synthesizes natural, calming audio for the member companion using Sarvam TTS (bulbul:v3).
    Returns base64 encoded wav audio.
    """
    api_key = get_sarvam_key()
    if not SARVAM_API_KEY and not api_key:
        return {"status": "mock", "message": "SARVAM_API_KEY not configured", "audio_base64": None}

    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    # Ensure speaker is valid for bulbul:v3
    valid_speakers = {
        "priya", "kavya", "simran", "pooja", "neha", "ritu", "shreya", "roopa",
        "aditya", "ashutosh", "rahul", "rohan", "amit", "dev", "kabir", "aayan"
    }
    chosen_speaker = speaker if speaker in valid_speakers else "priya"

    payload = {
        "inputs": [text[:500]],
        "target_language_code": target_language_code or "hi-IN",
        "speaker": chosen_speaker,
        "model": "bulbul:v3",
        "speech_sample_rate": 24000
    }

    async with httpx.AsyncClient(timeout=12.0) as client:
        try:
            res = await client.post(SARVAM_TTS_URL, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                audios = data.get("audios", [])
                return {
                    "status": "success",
                    "audio_base64": audios[0] if audios else None
                }
            return {"status": "error", "code": res.status_code, "detail": res.text}
        except Exception as e:
            return {"status": "error", "message": str(e)}

async def transcribe_with_gemini(audio_file_bytes: bytes, mime_type: str = "audio/webm") -> Optional[str]:
    """
    Multimodal audio transcription fallback using Google Gemini.
    Accepts arbitrary browser audio containers (audio/webm, audio/wav, audio/ogg, audio/mp4).
    """
    from src.nodes.llm_client import get_api_key
    gemini_key = get_api_key()
    if not gemini_key:
        return None

    # Normalize MIME type for Gemini inlineData
    normalized_mime = mime_type.split(";")[0].strip().lower()
    if not normalized_mime.startswith("audio/"):
        normalized_mime = "audio/webm"

    b64_audio = base64.b64encode(audio_file_bytes).decode("utf-8")

    prompt = (
        "Transcribe the spoken audio verbatim in its original spoken language (Hindi, English, or Hinglish). "
        "Return ONLY the plain transcript text without quotes, formatting, commentary, or speaker tags. "
        "If the audio contains only silence, background static, or is completely unintelligible, return exactly [SILENCE]."
    )

    payload = {
        "contents": [{
            "parts": [
                {
                    "inline_data": {
                        "mime_type": normalized_mime,
                        "data": b64_audio
                    }
                },
                {
                    "text": prompt
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.0,
            "maxOutputTokens": 400
        }
    }

    for model in ["gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-flash-latest"]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": gemini_key
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "").strip()
                            # Strip silence indicators
                            if raw_text == "[SILENCE]" or "[SILENCE]" in raw_text.upper():
                                return ""
                            return raw_text.strip(' "\'')
        except Exception as e:
            logger.warning(f"[transcribe_with_gemini] Model {model} transcription error: {e}")

    return None

async def transcribe_audio(
    audio_file_bytes: bytes,
    mime_type: str = "audio/webm",
    language_code: str = "unknown",
    model: str = "saaras:v3"
) -> Dict[str, Any]:
    """
    Transcribes spoken voice audio input from the user into text.
    Uses Sarvam STT (saaras:v3) as primary Indian speech engine, with seamless
    fallback to Google Gemini multimodal audio transcription when Sarvam is unconfigured or unavailable.
    Supports browser WebM, WAV, OGG, and MP4 audio containers.
    """
    if not audio_file_bytes or len(audio_file_bytes) < 44:
        return {"status": "empty", "transcript": ""}

    # 1. Primary: Sarvam AI STT
    sarvam_key = get_sarvam_key()
    if sarvam_key:
        norm_mime = mime_type.split(";")[0].strip().lower()
        ext = "webm"
        if "wav" in norm_mime:
            ext = "wav"
        elif "ogg" in norm_mime or "opus" in norm_mime:
            ext = "ogg"
        elif "mp4" in norm_mime or "m4a" in norm_mime:
            ext = "m4a"
        elif "mp3" in norm_mime or "mpeg" in norm_mime:
            ext = "mp3"

        headers = {
            "api-subscription-key": sarvam_key
        }
        files = {
            "file": (f"audio.{ext}", audio_file_bytes, norm_mime)
        }
        data = {
            "language_code": language_code or "unknown",
            "model": model or "saaras:v3",
            "mode": "transcribe"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(SARVAM_STT_URL, headers=headers, data=data, files=files)
                if res.status_code == 200:
                    resp_data = res.json()
                    transcript = resp_data.get("transcript", "")
                    return {"status": "success", "transcript": transcript}
                else:
                    logger.warning(f"[transcribe_audio] Sarvam STT returned {res.status_code}: {res.text[:150]}")
        except Exception as e:
            logger.warning(f"[transcribe_audio] Sarvam STT error: {e}")

    # 2. Resilient Fallback: Google Gemini Multimodal Audio Transcription
    gemini_transcript = await transcribe_with_gemini(audio_file_bytes, mime_type=mime_type)
    if gemini_transcript is not None:
        return {"status": "success", "transcript": gemini_transcript}

    return {"status": "empty", "transcript": ""}
