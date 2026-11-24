# PeerCove Core API — Python FastAPI

[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12%2B-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Database: PostgreSQL + SQLAlchemy](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLAlchemy%20Async-336791.svg?logo=postgresql)](https://www.sqlalchemy.org/)
[![Security: AES-256-GCM](https://img.shields.io/badge/Security-AES--256--GCM%20Envelope-green.svg)](#)

The **PeerCove Core Platform API** (Engine 3) built with **Python FastAPI**, strictly adhering to **Clean Architecture** principles. It connects asynchronously to the PostgreSQL database (Port `5433`), handles application-level **AES-256-GCM envelope encryption** for sensitive wellbeing disclosures, and serves live dynamic data to the Next.js frontend across 5 role workspaces.

---

## 🏛️ Clean Architecture Layout

```
backend/peercove-fastapi/
├── app/
│   ├── core/                   # Infrastructure: Config, Database Engine, Security
│   │   ├── config.py           # Environment settings (SettingsConfigDict, DB URL, CORS, JWKS)
│   │   ├── database.py         # Async SQLAlchemy engine + AsyncSessionLocal
│   │   ├── init_db.py          # Database schema bootstrapping
│   │   └── security.py         # AES-256-GCM Cipher & JWT extraction
│   ├── models/                 # Domain Entities: SQLAlchemy PostgreSQL Models
│   │   ├── member.py           # AppPrincipal, MemberProfile, Preferences
│   │   ├── wellbeing.py        # MoodEntry, JournalEntry, WellbeingGoal, Checkin
│   │   ├── intake.py           # IntakeSession, IntakeResponse, Recommendation
│   │   ├── peer.py             # MatchRequest, PeerConversation, PeerMessage, ListenerProfile
│   │   ├── supervisor.py       # PodRoster, ListenerEligibility, ConductReport, TrainingReview
│   │   ├── safety.py           # SafetyIncident, CrisisAuditLog, EscalationRecord
│   │   ├── admin.py            # AuditLog, KeyRotationRecord, AdminConfig
│   │   └── operations.py       # ServiceHealth, QueueMetric, TelemetryEvent
│   ├── schemas/                # Interface Adapters: Pydantic DTOs
│   │   ├── member.py
│   │   ├── wellbeing.py
│   │   ├── intake.py
│   │   ├── peer.py
│   │   ├── dashboard.py
│   │   ├── supervisor.py
│   │   ├── safety.py
│   │   └── admin.py
│   ├── services/               # Use-Case Business Logic Layer (Clean Architecture)
│   │   ├── base.py             # BaseService with transaction management
│   │   ├── member_service.py   # Profile and preferences business logic
│   │   ├── wellbeing_service.py# Mood tracking, encrypted journal & goals
│   │   ├── intake_service.py   # Conversational intake & screener evaluation
│   │   ├── peer_service.py     # Peer matching, live sessions, SOAP notes
│   │   ├── supervisor_service.py # Pod oversight, conduct audits & eligibility
│   │   ├── safety_service.py   # Crisis triage, escalation & audit logging
│   │   ├── admin_service.py    # Zero-knowledge mode & KMS key tracking
│   │   ├── operations_service.py # Telemetry, health aggregation & metrics
│   │   ├── dashboard_service.py# Aggregate metrics for role sanctuaries
│   │   └── health_service.py   # Liveness and readiness checks
│   ├── routers/                # Delivery Layer: FastAPI Route Controllers
│   │   ├── health.py           # /health/ready, /health/live
│   │   ├── member.py           # /api/v1/me, /api/v1/members/me/profile, preferences
│   │   ├── dashboards.py       # /api/v1/members/me/summary
│   │   ├── wellbeing.py        # /api/v1/wellbeing/moods, journal, goals
│   │   ├── intakes.py          # /api/v1/intakes, responses
│   │   ├── peer.py             # /api/v1/peer/match-requests, conversations, soap, close
│   │   ├── supervisors.py      # /api/v1/supervisors/pod/listeners, conduct-reports, training-reviews
│   │   ├── safetys.py          # /api/v1/safetys, /api/v1/safetys/{id}
│   │   ├── admins.py           # /api/v1/admins/overview, audit-logs
│   │   └── operations.py       # /api/v1/operations/metrics, telemetry
│   └── main.py                 # FastAPI Application entrypoint & CORS middleware
├── tests/
│   ├── test_api_and_security.py # Cryptographic roundtrip & auth tests
│   ├── test_safety.py           # Safety schema & emergency escalation protocol tests
│   └── test_mcp.py              # FastMCP tool definitions & FHIR compatibility tests
├── pyproject.toml              # Dependencies managed via uv (Python 3.12+)
├── Dockerfile                  # Production container definition
└── .env                        # Local environment variables
```

---

## 🚀 How to Run

### Local Execution with `uv`
```powershell
cd backend/peercove-fastapi

# Install dependencies
uv sync

# Run the FastAPI server on Port 8080
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

### Docker Execution
```powershell
cd backend/peercove-fastapi
docker compose up -d
```

- **Interactive Swagger Docs**: [http://localhost:8080/docs](http://localhost:8080/docs)
- **ReDoc**: [http://localhost:8080/redoc](http://localhost:8080/redoc)
- **Health Check**: [http://localhost:8080/health/ready](http://localhost:8080/health/ready)

---

## 🧪 Testing

Execute the test suites using `uv`:

```powershell
cd backend/peercove-fastapi

# Run all test suites:
uv run pytest -v

# Run specific domain test suites:
uv run pytest tests/test_safety.py -v
uv run pytest tests/test_mcp.py -v
uv run pytest tests/test_api_and_security.py -v
```
