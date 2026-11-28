# PeerCove — Detailed Architecture & End-to-End Project Workflows

**PeerCove** is an AI-assisted, stepped-care peer mental wellness platform built around a decoupled **Three-Engine Clean Architecture** with strict non-clinical boundaries, zero-knowledge admin isolation, application-level AES-256-GCM encryption, and deterministic crisis safety.

---

## 1. Three-Engine System Topology

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ENGINE 1: FRONTEND WORKSPACES (Next.js 16 / React 19 / Tailwind CSS :4000)  │
│ • Marketing & Trust Pages (/en, /how-it-works, /ai-agents, /hipaa)          │
│ • 5 Role Workspaces: Member · Listener · Supervisor · Safety Ops · Admin    │
│ • Consent-Gated Text & Voice Intake + Live Peer Listening Rooms             │
│ • Next.js API Proxies (/api/intake-agent, /api/intake-voice-agent,          │
│   /api/voice-transcribe, /api/voice-synthesize, /api/peercove/*)            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / WSS / Ed25519 JWT (JWKS)
               ┌───────────────────────┴───────────────────────┐
               ▼                                               ▼
┌───────────────────────────────────────────┐   ┌─────────────────────────────┐
│ ENGINE 2: MULTI-AGENT ENGINE (:8018)      │   │ ENGINE 3: CORE API (:8080)  │
│ (FastAPI + LangGraph StateGraph)          │   │ (Python FastAPI + Async PG) │
│ • Deterministic Safety Sentinel (<2ms)    │   │ • Clean Architecture:       │
│ • 7 Subagent Nodes + MemorySaver          │   │   routers / schemas /       │
│   1. safety_sentinel  5. peer_matcher     │   │   services / models         │
│   2. intake           6. coordination     │   │ • PeerCove MCP Gateway:     │
│   3. pathway          7. followup         │   │   /mcp/tools, /mcp/call     │
│   4. companion                            │   │ • AES-256-GCM Encryption    │
│ • Voice STT/TTS (/ws/audio, Sarvam AI)    │   │ • PostgreSQL (Neon / PG)    │
│ • Zero Direct DB Credentials              │   │ • IAM / BetterAuth (:5001)  │
└───────────────────────────────────────────┘   └─────────────────────────────┘
```

---

## 2. End-to-End Project Workflows

### Workflow A: Authentication, IAM & Role-Based Workspace Routing
1. **Sign-In / Demo Login (`/en/login`, `/en/demo-login`):** BetterAuth authenticates the user and `backend/peercove-iam-py` (`:5001`) issues short-lived **Ed25519 JWTs** verified via JWKS.
2. **Role Guard (`enforcePeerCoveRoleAccess`):** Every workspace route checks role and relationship permissions on the server before rendering:
   - `/en/peercove/member` — Member Sanctuary (Chat, Voice, Mood, Journal, Goals, Peer Rooms)
   - `/en/peercove/listener` — Peer Listener Sanctuary Hub (Live Queue, Listening Rooms, SOAP Summary, Profile)
   - `/en/peercove/listener-supervisor` — Pod Roster Eligibility, Conduct & Boundary Audits, Training Signoffs
   - `/en/peercove/safety-operations` — Safety Cases, Escalations, Follow-ups, Crisis Directories
   - `/en/peercove/platform-administrator` — RBAC Roles, Service Telemetry, Audit Logs, KMS Key Rotation (Zero-Knowledge boundary: no default access to private member conversations)

---

### Workflow B: Member AI Sanctuary, Chat & Voice Intake
1. **Member Dashboard (`/en/peercove/member` — `MemberDashboardView`):**
   - **Chat Mode (Default):** Full-height ChatGPT-style sanctuary with 4 PeerCove starter cards (*Guided 4-7-8 Grounding*, *Anxiety & Work Burnout*, *Sleep & Restlessness*, *Schedule Peer / Care Session*).
   - **Overview Mode:** Top-bar toggle (`Chat | Overview`) switches to 4 PostgreSQL-synced stat cards, Active Wellbeing Goals, Mood check-ins, and Recent Peer Sessions.
   - **Voice-to-Text & Auto-Voice Reply:** Mic button records audio and calls `/api/voice-transcribe` with parallel browser `SpeechRecognition` fallback; speaker toggle plays replies via `/api/voice-synthesize` with `window.speechSynthesis` fallback.
2. **Consent-Gated Guided Intake (`/peercove/member/chat` & `/peercove/member/voice`):**
   - `PeerCoveIntakeGate` requires explicit intake consent (and separate microphone/transcription consent for voice) before creating an encrypted intake session.
   - **Text Intake (`TextIntake`):** Streams SSE chunks (`text_delta`, `agent_end`) from `POST /api/intake-agent` → `agents` `:8018/api/agent/intake` (with contextual SSE fallback if `:8018` is offline).
   - **Live Voice Intake (`VoiceIntakeTest`):** Fetches `{ token, wsUrl }` from `GET /api/intake-voice-agent` and streams 16 kHz Int16 PCM over WebSocket (`/ws/audio`). If `:8018` is offline, automatically switches to **Browser Voice Mode** (`SpeechRecognition` → `/api/intake-agent` → `SpeechSynthesis`).
   - On **End Chat / End Call**, turns are encrypted and persisted via `completePeerCoveIntakeAction`.

---

### Workflow C: Multi-Agent Orchestration & Deterministic Safety (`agents/`)
1. **Safety Sentinel (`safety_sentinel_node`, `<2ms`):** Every user message enters `agents/src/orchestrator.py` at `safety_sentinel` first (non-LLM regex/lexical gate). If crisis/self-harm keywords match, LLM inference is skipped immediately, `is_crisis=True` is set, and emergency helplines (`14416` Tele-MANAS, `112`, `988`) + safety escalation are returned.
2. **Conditional Stepped-Care Routing (7 Subagents + `MemorySaver`):**
   - `intake_node`: Empathetic conversational intake and concern capture.
   - `pathway_node`: Recommends Tier 1 (Self-Help), Tier 2 (Peer Support), or Tier 3 (Care Coordination).
   - `companion_node`: Guides 4-7-8 somatic grounding, cognitive reframing, and journaling.
   - `peer_matcher_node`: Dispatches peer listener matching intent.
   - `coordination_node`: Guides video/voice/text session scheduling.
   - `followup_node`: Supports longitudinal mood and goal check-ins.
   - State is checkpointed per `session_id` (`thread_id`) via `MemorySaver`.

---

### Workflow D: Member → Peer Listener Matching & Live Consultation Lifecycle
1. **Request & Opt-In Consent (`BookSessionModal` / `MemberConsultationView`):**
   - Member fetches available listeners (`GET /api/peercove/member/listeners` → FastAPI `/api/v1/peer/listeners`), picks topic & channel (`video`, `voice`, `chat`), and explicitly chooses whether to opt in (`consentShareIntake` defaults to `false`) to share intake context.
   - Submitting creates a `ListenerMatchRequest` in PostgreSQL (`POST /api/peercove/member/match-requests`).
2. **Queue & Somatic Waiting (`MemberMatchingQueueModal`):**
   - State machine (`queued` → `matching` → `matched` / `cancelled` / `timeout`) polls status while running a 4-7-8 `BreathworkPacer`.
3. **Listener Queue & Race-Safe Accept (`ListenerDashboardView`):**
   - Listener polls `/api/peercove/listener/match-requests/active`, enforces active capacity limit (`openConversations < capacityLimit`) and cooldown state, and accepts via `POST /api/peercove/listener/offers/{id}/accept` (`409 Conflict` prevents double-claiming across listeners).
4. **Live Listening Room (`MemberSessionRoomModal` & `ListenerSessionRoomModal`):**
   - Both sides display the **non-clinical disclosure** (*"Peer Support Only • Not therapy or clinical treatment • AES-256-GCM Encrypted"*).
   - Supports WebRTC/live audio-video, real-time WebSocket chat (`/api/v1/peer/ws/{conversation_id}`), inline Safety Sentinel tripwire, and **Non-Clinical Listener Copilot** suggestions (review-before-send).
5. **Session Close, Reflection & Mandatory 60s Cooldown (`US-015`):**
   - Ending the session calls `PUT .../close` and broadcasts `session_closed` to sync both participants.
   - **Member** moves to post-session mood rating (`1–10`), optional listener feedback, and opt-in AES-256-GCM encrypted journal sync.
   - **Listener** completes the 4-part encrypted `[SOAP RECORD]` reflection summary, then enters the **mandatory 60-second Volunteer Cooldown Breather** (with 4-7-8 pacing) before returning to the queue.

---

### Workflow E: Supervision, Safety Ops & Admin Governance
- **Listener Supervisor (`/peercove/listener-supervisor`):** Toggles listener eligibility (`Eligible / Review Due / Suspended`), resolves member conduct/boundary reports, and verifies Safeguarding/CEU training modules (`US-031`).
- **Safety Operations (`/peercove/safety-operations`):** Manages assigned safety cases, human handoffs, and follow-up closures independently of AI availability (`US-033`).
- **Platform Admin (`/peercove/platform-administrator`):** Monitors service health, RBAC assignments, cryptographic audit logs, and KMS key rotation under Zero-Knowledge boundaries.

---

## 3. Core Backend & MCP Tool Gateway (`backend/peercove-fastapi/`)

- **Clean Architecture Layers:** `app/routers/` → `app/schemas/` (Pydantic) → `app/services/` → `app/models/` (SQLAlchemy Async) + `app/core/security.py` (JWT & AES-256-GCM envelope encryption).
- **PeerCove Typed MCP Gateway (`app/routers/mcp.py`):** Exposes `GET /mcp/tools` and `POST /mcp/call` across **4 MCP suites (12 tools)** so AI agents never access PostgreSQL directly:
  - **Intake MCP:** `record_intake_response`, `calculate_triage_score`, `update_care_tier`
  - **Listener MCP:** `query_available_listeners`, `request_listener_match`, `poll_assignment_status`
  - **Scheduling MCP:** `query_provider_availability`, `reserve_session_slot`, `dispatch_booking_confirmation`
  - **Safety MCP:** `trigger_crisis_escalation`, `fetch_local_hotlines`, `create_safety_incident_case`

---

## 4. Directory Map & Service Ports

| Path / Service | Port | Purpose | Run Command |
|---|---|---|---|
| `frontend/` | `4000` (or `4010`) | Next.js 16 UI, Prisma ORM, API proxies | `cd frontend && pnpm dev` |
| `backend/peercove-fastapi/` | `8080` | Core FastAPI REST API + MCP Gateway (`/docs`) | `cd backend/peercove-fastapi && .venv\Scripts\python.exe -m uvicorn app.main:app --port 8080 --reload` |
| `agents/` | `8018` | LangGraph 7-node orchestrator + Voice WS (`/docs`) | `cd agents && docker compose up -d` |
| `backend/peercove-iam-py/` | `5001` | BetterAuth / Ed25519 JWT & JWKS provider | `cd backend/peercove-iam-py && docker compose up -d` |
| `backend/fhir-*` | `8000–8005` | Auxiliary/legacy FHIR R4 interoperability services | Optional Docker Compose |
