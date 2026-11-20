# 🛠️ SevaHealth AI / MindSpace — Complete Commands Quick Reference Guide

A comprehensive, categorized reference for all operational, development, deployment, database, and testing commands across the entire platform.

---

## ⚡ 1. One-Click Platform Launch (Windows)

Start or stop the entire ecosystem (PostgreSQL databases, IAM service, FastAPI Core, Multi-Agent Engine, and Next.js Frontend) with a single command from the project root:

```powershell
# Start everything in parallel
.\START-ALL.bat

# Gracefully terminate all services and background processes
.\STOP-ALL.bat
```

---

## 🐳 2. Docker & Container Management Commands

### Start Services via Docker Compose

```powershell
# 1. Core Health API (Port 8080) & PostgreSQL Core DB (Port 5433)
docker compose -f backend\mindspace-fastapi\docker-compose.yml up -d --build

# 2. Frontend PostgreSQL Application Database (Port 5435)
docker compose -f frontend\docker-compose.yml up -d --build

# 3. IAM Identity Provider & JWKS (Port 5001)
docker compose -f backend\mindspace-iam-py\docker-compose.yml up -d --build

# 4. Multi-Agent Intelligence & Voice Engine (Port 8018)
docker compose -f agents\docker-compose.yml up -d --build
```

### Quick Database-Only Start (Minimal Setup)

If running the Python and Node.js servers locally outside Docker:

```powershell
# Start only the two PostgreSQL databases
docker compose -f backend\mindspace-fastapi\docker-compose.yml up -d mindspace-postgres
docker compose -f frontend\docker-compose.yml up -d
```

### Inspect Container Status & Logs

```powershell
# View all running containers and port mappings
docker ps

# Stream logs from specific services
docker logs -f mindspace-fastapi        # Core FastAPI backend & Peer router
docker logs -f mindspace-agents         # Multi-Agent voice engine
docker logs -f mindspace-iam            # IAM identity provider

# Stop containers while safely preserving database volumes
docker compose -f agents\docker-compose.yml down
docker compose -f frontend\docker-compose.yml down
docker compose -f backend\mindspace-fastapi\docker-compose.yml down
docker compose -f backend\mindspace-iam-py\docker-compose.yml down
```

---

## 💻 3. Frontend Development Commands (`frontend/`)

Run these commands inside the `frontend/` directory:

```powershell
cd frontend

# Install package dependencies
pnpm install

# Database & Prisma ORM (Port 5435)
pnpm db:generate             # Generate Prisma client types
pnpm db:push                 # Push schema to PostgreSQL (Port 5435)
pnpm seed:test-data          # Seed test users and initial state

# Local Development Server (Port 4000)
pnpm dev                     # Starts Next.js Turbopack development server

# Run Automated Test Suite (Vitest)
pnpm test --run              # Runs 405 unit & integration tests

# Code Quality & Linting
pnpm lint                    # Run ESLint (0 errors certified)

# Production Build & Run
pnpm build                   # Compile production Next.js build
pnpm start                   # Start production server
```

---

## 🐍 4. Backend Local Execution Commands

### Engine 3: Core Health API (`backend/mindspace-fastapi/`)

```powershell
cd backend\mindspace-fastapi

# Run locally using uv (Python 3.12+)
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# Run Automated Test Suite (Pytest)
uv run pytest tests/ -v       # Runs all 37 backend tests

# Run specific test file
uv run pytest tests/test_peer_workflow.py -v
```

- **Swagger API Docs:** `http://localhost:8080/docs`
- **ReDoc API Docs:** `http://localhost:8080/redoc`
- **Health Probe:** `http://localhost:8080/health/ready`

### Engine 1: IAM Identity Provider (`backend/mindspace-iam-py/`)

```powershell
cd backend\mindspace-iam-py

# Run IAM server locally (Port 5001)
uv run uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload
```

- **JWKS Endpoint:** `http://localhost:5001/.well-known/jwks.json`

### Engine 2: Multi-Agent Intelligence (`agents/`)

```powershell
cd agents

# Run multi-agent orchestrator locally (Port 8018)
uv run python -m src.server
```

- **Audio WebSocket Endpoint:** `ws://localhost:8018/ws/audio`

---

## 🧪 5. Testing & Quality Assurance Verification

Run the full platform test suite with two commands:

```powershell
# Frontend Suite (405 tests)
cd frontend
pnpm test --run

# Backend Suite (37 tests)
cd ..\backend\mindspace-fastapi
uv run pytest tests/ -v
```

---

## 🔍 6. Port Check & Troubleshooting Commands

If a port is already in use on Windows, inspect and free it:

```powershell
# Check which process is using a port (e.g. 4000, 8080, 5433, 5435)
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object OwningProcess

# Kill a specific process by PID
Stop-Process -Id <PID> -Force

# Verify PostgreSQL connection
Test-NetConnection -ComputerName localhost -Port 5433
Test-NetConnection -ComputerName localhost -Port 5435
```

---

## 🌐 7. Application URLs & Endpoints

| Service / Interface | Local URL | Description |
|---|---|---|
| **Web Portal** | `http://localhost:4000/` | Main portal landing & role selection |
| **Member Dashboard** | `http://localhost:4000/mindspace/member` | Patient intake, doctor recommendation, booking |
| **Listener Dashboard** | `http://localhost:4000/mindspace/listener` | Doctor hub, in-person ambient audio capture, SOAP review |
| **Supervisor Workspace** | `http://localhost:4000/mindspace/supervisor` | Safety monitoring, risk escalation review |
| **FastAPI Swagger Docs**| `http://localhost:8080/docs` | Interactive OpenAPI REST endpoints |
| **FastAPI Health Check**| `http://localhost:8080/health/ready` | Readiness and database probe |
| **IAM JWKS Keys** | `http://localhost:5001/.well-known/jwks.json`| RFC 7517 public keys for JWT verification |
