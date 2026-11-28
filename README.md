# PeerCove 🏥 🌊
**AI-Native Peer Support, Mental Wellness & Connected Telehealth Platform**
PeerCove is an AI-assisted mental wellness and collaborative care platform designed to provide a calm, supportive harbor for individuals seeking guided conversations, peer-to-peer listening, and professional telehealth care.

The platform seamlessly connects citizens, peer listeners, healthcare providers, and clinical supervisors through guided intake, real-time matching, encrypted telehealth rooms, and FHIR-compliant electronic health records.
---
## 🌐 Live Deployments

- **Production URL:** [https://peercove.space](https://peercove.space)
- **Alternate Domain:** [https://www.peercove.space](https://www.peercove.space)

---

## ✨ Key Features

- **Guided Mental Wellness Intake**: Conversational text and voice intake that adapts to patient pace and comfort level.
- **Peer & Listener Matching**: Real-time matching queue connecting individuals with empathetic, trained listeners and clinicians.
- **Live Consultation Rooms**: LiveKit-powered WebRTC video, audio, and secure text rooms with in-session clinical safety monitors.
- **Ambient Voice & SOAP Notes**: Real-time clinical audio capture with automated transcript synthesis and clinician SOAP note generation.
- **FHIR R4 Electronic Health Records**: Native HL7 FHIR R4 clinical data storage (Conditions, Observations, Encounters, and ServiceRequests).
- **Model Context Protocol (MCP)**: Built-in MCP server allowing authenticated AI assistants to query clinical records safely under HIPAA boundaries.
- **Deterministic Crisis Sentinel**: Automatic keyword and sentiment circuit breakers routing to emergency resources (Tele-MANAS 14416 / US 988).
- **Multi-Role Workspaces**: Tailored dashboards for Members, Listeners, Supervisors, and Safety Administrators.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | **Next.js 16 & React 19** | Clean Architecture, Server Components, multi-language internationalization (`next-intl`) |
| **Styling & UI** | **Tailwind CSS & Radix UI** | Modern, accessible, responsive design with Lucide icons and Framer Motion animations |
| **Backend API** | **FastAPI (Python 3.12)** | Asynchronous REST and WebSocket endpoints powered by Uvicorn |
| **Database** | **PostgreSQL 18 on Neon** | Serverless PostgreSQL with SSL connection pooling (`-pooler`) and auto-scaling |
| **ORM & Schema** | **Prisma ORM & SQLAlchemy** | Type-safe database queries and schema migrations |
| **Realtime Media** | **LiveKit WebRTC** | Low-latency audio/video consultation and listening rooms |
| **AI & Intelligence** | **Google Gemini & LangGraph** | Guided conversational agents, ambient documentation, and advisory triage |
| **Security & Privacy** | **AES-256-GCM & JWT** | Envelope encryption for sensitive intakes, role-based access control, and audit logging |
| **Hosting** | **Vercel & Render** | Global Edge CDN hosting for Next.js; containerized Docker deployment for FastAPI |

---

## 🏗️ Clean Architecture

PeerCove follows Clean Architecture principles with strict layer boundaries across frontend and backend services:

```text
Intake / Reflection → Triage & Safety Check → Peer / Clinician Match → Video Consultation → FHIR Documentation
```

### Architecture Layers:
1. **Domain Layer**: Pure business entities, value objects, and repository interfaces (zero external dependencies).
2. **Application Layer**: Use cases, matching logic, and intake orchestration.
3. **Infrastructure Layer**: PostgreSQL adapters, Neon connection poolers, LiveKit SDK, and external AI connectors.
4. **Presentation Layer**: Next.js App Router views, interactive modals, WebRTC rooms, and FastAPI REST routers.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ & pnpm
- Python 3.12+ & uv
- Git

### Installation & Local Setup

```powershell
# 1. Clone the repository
git clone https://github.com/pranjalchirmade09326-hash/PeerCove.git

# 2. Frontend Setup (Next.js)
cd frontend
pnpm install
pnpm exec prisma generate
pnpm dev

# 3. Backend Setup (FastAPI)
cd ..\backend\peercove-fastapi
uv pip install -r pyproject.toml
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

### Local Access Points
- **Web Portal:** [http://localhost:4000/](http://localhost:4000/)
- **Member Workspace:** [http://localhost:4000/en/peercove/member](http://localhost:4000/en/peercove/member)
- **Listener Workspace:** [http://localhost:4000/en/peercove/listener](http://localhost:4000/en/peercove/listener)
- **API Swagger Documentation:** [http://localhost:8080/docs](http://localhost:8080/docs)
- **Health Check Probe:** [http://localhost:8080/health/ready](http://localhost:8080/health/ready)

---

## 🧪 Testing

```powershell
# Run frontend unit & component tests
cd frontend
pnpm test

# Run backend API & safety tests
cd ..\backend\peercove-fastapi
pytest tests/ -v
```

---

## 🔐 Clinical Safety & Crisis Sentinel

- PeerCove is designed for **peer listening, supportive guidance, and care coordination**.
- It is **not** a replacement for emergency psychiatric intervention or emergency medical care.
- Automated crisis detection continuously monitors intake text and voice transcripts for acute distress or self-harm markers.
- When triggered, immediate crisis hotlines (Tele-MANAS: **14416** in India, **988** Suicide & Crisis Lifeline in the US) and local emergency resources are presented to the user.

---

## 📄 License & Attribution

All rights reserved &copy; 2026 PeerCove. Built with modern open-source foundations.
