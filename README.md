# SevaHealth AI 🏥
**AI-Native Preventive Healthcare & NCD Early-Warning Platform**

SevaHealth AI is an AI-assisted preventive healthcare platform designed to support early identification of Non-Communicable Disease (NCD) risks, explain contributing risk factors, and encourage preventive lifestyle changes.

The platform supports citizens, healthcare workers, clinicians, and public health administrators through integrated screening, risk assessment, care planning, and health monitoring workflows.

---

## ✨ Key Features

- **Health Screening**: CBAC (Community-Based Assessment Checklist) and IDRS (Indian Diabetes Risk Score) screening workflows.
- **Risk Assessment**: Multi-factor NCD risk stratification with explainable risk factors.
- **Preventive Care Plans**: Personalized 30-day lifestyle, nutrition, and habit recommendations.
- **Health Monitoring**: Daily check-ins, encrypted reflections, and wearable biometric integration.
- **Clinical Triage & Telehealth**: High-risk alerts, automated doctor recommendation, video rooms, and AI-assisted SOAP notes.
- **Ambient Voice Capture**: In-person clinical ambient audio recording with real-time waveform and transcript synthesis.
- **FHIR Clinical Data Extractions**: Automated extraction of FHIR resources (Conditions, Observations, Medications, and Orders).
- **Population Health Analytics**: District-level dashboards, supervisor oversight, and outcome monitoring.
- **Clinical Safety**: Deterministic crisis sentinel circuit breakers and human-in-the-loop review for escalated cases.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **Python 3.12+** | Backend development |
| **FastAPI** | High-performance asynchronous REST & WebSocket API development |
| **Next.js 16 & React 19** | Modern frontend web portal with Clean Architecture |
| **TypeScript & Tailwind CSS** | Type-safe UI components with Radix UI and Lucide icons |
| **PostgreSQL 16** | Relational database (Core Data on port 5433, App Data on port 5435) |
| **JSONB & AES-256-GCM** | Flexible data storage with envelope encryption |
| **Prisma ORM & SQLAlchemy** | Database modeling and asynchronous queries |
| **AI/LLM Providers & LangGraph** | Google Gemini 2.5/Flash, Sarvam AI voice models, CDS Copilot |
| **Docker & Docker Compose** | Multi-service containerization |
| **Swagger/OpenAPI** | Interactive API documentation |

---

## 🏗️ Architecture

The project follows Clean Architecture with strict separation of concerns across Domain, Application, Infrastructure, and Presentation layers for screening, risk assessment, preventive interventions, clinical workflows, wearable data, and population health analytics.

### Core Workflow:
```text
Screen → Understand → Assess Risk → Predict → Intervene → Monitor → Escalate → Measure
```

### Clean Architecture Layers:
1. **Domain Layer**: Pure business entities, value objects, and repository interfaces (zero external dependencies).
2. **Application Layer**: Use cases, workflow orchestrators, and validation logic.
3. **Infrastructure Layer**: PostgreSQL adapters, external AI connectors, FHIR mappers, WebSocket gateways, and envelope encryption.
4. **Presentation Layer**: Next.js views, interactive components, modals, and FastAPI routers.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+ & pnpm
- Git
- Docker & Docker Compose (optional for containerized setup)

### Installation & Local Setup

```powershell
# 1. Clone the repository
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd sevahealth-ai

# 2. Start PostgreSQL Databases (Ports 5433 & 5435)
docker compose -f backend\mindspace-fastapi\docker-compose.yml up -d mindspace-postgres
docker compose -f frontend\docker-compose.yml up -d

# 3. Backend Setup (FastAPI)
cd backend\mindspace-fastapi
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# 4. Frontend Setup (Next.js)
cd ..\..\frontend
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

### Access the Application
- **Web Portal:** [http://localhost:4000/](http://localhost:4000/)
- **Member / Citizen Workspace:** [http://localhost:4000/mindspace/member](http://localhost:4000/mindspace/member)
- **Doctor / Listener Hub:** [http://localhost:4000/mindspace/listener](http://localhost:4000/mindspace/listener)
- **API Documentation (Swagger):** [http://localhost:8080/docs](http://localhost:8080/docs)
- **API Documentation (ReDoc):** [http://localhost:8080/redoc](http://localhost:8080/redoc)
- **Health Check Probe:** [http://localhost:8080/health/ready](http://localhost:8080/health/ready)

*Note: These commands assume the project dependencies and local environment configuration (`.env`) are set up correctly.*

---

## 🧪 Testing

```powershell
# Run frontend automated tests (Vitest - 405 unit & integration tests)
cd frontend
pnpm test --run

# Run backend automated tests (Pytest - 37 unit & workflow tests)
cd ..\backend\mindspace-fastapi
uv run pytest tests/ -v
```

---

## 🔐 Clinical Safety

- SevaHealth AI is designed as a **clinical decision-support platform**, not a diagnostic system.
- Risk estimates and triage recommendations do not represent confirmed diagnoses.
- AI supports preventive guidance, ambient documentation, and doctor recommendation.
- Medication prescribing and autonomous medical decisions are strictly outside the intended scope.
- Escalated cases require mandatory human-in-the-loop review by qualified healthcare professionals.
- Deterministic crisis sentinel circuit breakers monitor inputs to immediately trigger emergency resources (e.g. Tele-MANAS 14416 / 988).

---

## 📂 Project Structure

```text
sevahealth-ai/
├── apps/ / frontend/         # Citizen, clinician, supervisor, and public health interfaces
│   ├── src/
│   │   ├── app/              # Next.js App Router endpoints & route handlers
│   │   ├── components/       # Shared UI primitives, consultation modals, soundwaves
│   │   └── modules/client/   # Clean Architecture domains (member, listener, supervisor)
│   │       ├── domain/       # Pure entities & value objects
│   │       ├── application/  # Use cases & workflow handlers
│   │       ├── infrastructure/# API clients & storage adapters
│   │       └── presentation/ # View components & consultation rooms
├── services/ / backend/      # API, screening, risk, and clinical services
│   ├── mindspace-fastapi/    # Engine 3: Core Health API, peer matching, AES-256 encryption
│   └── mindspace-iam-py/     # Identity provider, JWT verification & JWKS
├── agents/                   # Engine 2: LangGraph multi-agent intelligence & voice companion
├── packages/                 # Shared schemas, FHIR converters, and validation utilities
├── infrastructure/           # Docker compose definitions, database migrations, Caddy proxies
├── docs/                     # Architecture specifications, diagrams, and operational guides
└── tests/                    # Automated unit, integration, and security verification tests
```

---

## 📜 Open-Source Attribution

Third-party repositories, licenses, and reuse details are documented in [docs/REUSE_MATRIX.md](docs/REUSE_MATRIX.md) and [docs/repository-reuse-analysis.md](docs/repository-reuse-analysis.md).

---

## ⚠️ Disclaimer

This project is intended for preventive health support, education, clinical documentation assistance, and demonstration. It is not a substitute for professional medical advice, diagnosis, or treatment. Use synthetic data for demonstrations and protect all sensitive health information.

**Project:** SevaHealth AI  
**Focus:** Preventive Healthcare • AI-Assisted Risk Assessment • NCD Early Warning • Clinical Decision Support
