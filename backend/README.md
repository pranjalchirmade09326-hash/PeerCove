# PeerCove Backend Services

The PeerCove backend is structured into primary core services (Health Data API and IAM Identity Provider) and an auxiliary healthcare interoperability tier (FHIR Platform).

```
backend/
├── peercove-fastapi/  → Core Health Data API (Port 8080) — Engine 3
├── peercove-iam-py/   → IAM Identity Provider (Port 5001)
├── fhir-server/        → Auxiliary FHIR R4 REST API (Port 8000)
├── fhir-mcp/           → FastMCP Interoperability Gateway (Port 8002)
├── fhir-gql/           → Auxiliary FHIR Middleware Service (Port 8001)
└── fhir-staging/       → Auxiliary FHIR Document Staging Pipeline
```

---

## Service Overview & Port Mapping

| Service | Directory | Port | Database / Storage | Primary Role |
|---|---|---|---|---|
| **Core Health Data API** | `peercove-fastapi/` | `8080` | PostgreSQL 16 (Port 5433) | Clean Architecture application service for member wellbeing, peer support, encrypted SOAP notes, conduct reports, safety triage, and supervisor oversight. |
| **IAM Identity Provider** | `peercove-iam-py/` | `5001` | PostgreSQL 16 (Port 5430) | Authentication service issuing Ed25519 asymmetric JWT tokens with RFC 7517 compliant JWKS endpoints (`/.well-known/jwks.json`). |
| **FHIR R4 Server** | `fhir-server/` | `8000` | PostgreSQL 15 (Port 5432), Redis 7 (Port 6379) | External interoperability API serving FHIR R4 clinical resources (Patient, Encounter, Observation, etc.) in dual `application/fhir+json` and `application/json` formats. |
| **FHIR FastMCP Gateway** | `fhir-mcp/` | `8002` | Fetches OpenAPI from `8000` | Dynamic FastMCP server exposing FHIR R4 endpoints as typed AI tools at `/mcp` over streamable-HTTP with token forwarding. |
| **FHIR Middleware** | `fhir-gql/` | `8001` | Connected to fhir-server | Middleware service bridging client requests to the FHIR interoperability tier. |
| **FHIR Staging** | `fhir-staging/` | N/A | Worker pipeline | Ingestion and extraction pipeline for unstructured clinical documents. |

---

## Architectural Interaction Pattern

```
                       Frontend Client (Port 4000)
                                    │
               ┌────────────────────┼────────────────────┐
               │ Bearer JWT         │ User Auth          │ Direct FHIR
               ▼                    ▼                    ▼
     peercove-fastapi      peercove-iam-py        fhir-server
        (Port 8080)            (Port 5001)          (Port 8000)
               │                                         ▲
               │ REST / Tools                            │ Forwarded JWT
               ▼                                         │
        LangGraph Agents ────────► fhir-mcp ─────────────┘
          (Port 8018)             (Port 8002)
```

---

## Core Services

### 1. Core Health Data API (`peercove-fastapi`)

The primary backend for PeerCove, implementing Clean Architecture to separate domain entities from framework routing:
- **Location:** `backend/peercove-fastapi/`
- **Port:** `8080` (Swagger UI at `http://localhost:8080/docs`)
- **Key Modules:**
  - `app/core/`: Configuration via Pydantic Settings (`SettingsConfigDict`), database engine, application-level AES-256-GCM envelope encryption.
  - `app/models/`: SQLAlchemy ORM models (`member.py`, `peer.py`, `wellbeing.py`, `intake.py`, `supervisor.py`, `safety.py`, `admin.py`, `operations.py`).
  - `app/services/`: Decoupled application use cases (`member_service.py`, `wellbeing_service.py`, `intake_service.py`, `peer_service.py`, `supervisor_service.py`, `safety_service.py`, `admin_service.py`, `operations_service.py`, `dashboard_service.py`, `health_service.py`).
  - `app/routers/`: FastAPI endpoints (`/api/v1/member/*`, `/api/v1/peer/*`, `/api/v1/wellbeing/*`, `/api/v1/intakes/*`, `/api/v1/supervisors/*`, `/api/v1/safetys/*`, `/api/v1/admins/*`, `/api/v1/operations/*`).
  - `app/schemas/`: Strongly-typed Pydantic request and response DTOs.
- **Local Startup:**
  ```powershell
  cd backend/peercove-fastapi
  uv sync
  uv run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
  ```
- **Tests:**
  ```powershell
  uv run pytest -v
  uv run pytest tests/test_safety.py -v
  uv run pytest tests/test_mcp.py -v
  ```

### 2. IAM Identity Provider (`peercove-iam-py`)

Dedicated authentication and token issuer service:
- **Location:** `backend/peercove-iam-py/`
- **Port:** `5001` (JWKS at `http://localhost:5001/.well-known/jwks.json`)
- **Features:** Password hashing via bcrypt, Ed25519 asymmetric key signing, RBAC role claim injection, and user profile management.
- **Local Startup:**
  ```powershell
  cd backend/peercove-iam-py
  cp .env.example .env
  uv sync
  uv run uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload
  # Or with Docker:
  docker compose -f docker-compose.dev.yml up -d
  ```

---

## Auxiliary Interoperability Tier (FHIR Platform)

### 3. FHIR R4 Server (`fhir-server`)
- **Port:** `8000`
- **Features:** Production-grade FHIR R4 REST API supporting `Patient`, `Encounter`, `Observation`, `Appointment`, `QuestionnaireResponse`, and 15+ clinical resources.
- **Startup:**
  ```powershell
  cd backend/fhir-server
  cp .env.example .env
  uv sync
  uv run alembic upgrade head
  uv run fastapi dev app/main.py
  ```

### 4. FHIR FastMCP Gateway (`fhir-mcp`)
- **Port:** `8002` (Endpoint: `http://localhost:8002/mcp`)
- **Features:** Reads `OPENAPI_SPEC` from `fhir-server` at boot, auto-generates MCP tools via FastMCP, and forwards caller JWTs.
- **Startup:**
  ```powershell
  cd backend/fhir-mcp
  cp .env.example .env
  uv sync
  uv run python -m app.main
  ```

---

## Quick Start (All Backend Services)

Start each service in its own terminal using the per-service startup commands above (`peercove-fastapi` on `:8080` and `peercove-iam-py` on `:5001`, or via `docker compose -f docker-compose.dev.yml up -d`).
