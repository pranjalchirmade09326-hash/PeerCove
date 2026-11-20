# 🏛️ MindSpace / SevaHealth AI — System Architecture & Workflow Specifications

This document defines the architectural patterns, Clean Architecture layer mappings, and end-to-end operational workflows for both **Member (Patient/Citizen)** and **Listener (Doctor/Clinician)** personas.

**File Location:** `docs/ARCHITECTURE.md`

---

## 📐 1. Clean Architecture Paradigm

Both the frontend and backend follow Clean Architecture to ensure strict decoupling of business rules from UI frameworks, database engines, and external AI models.

```
       ┌─────────────────────────────────────────────────────────────┐
       │             Presentation Layer (UI / API)                   │
       │   - Next.js Views & Modals (React 19)                       │
       │   - FastAPI Routers & WebSockets                            │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ calls
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │             Application Layer (Use Cases)                   │
       │   - Consultation Workflow Orchestrator                      │
       │   - Matching Engine & Peer State Machine                    │
       │   - SOAP Note Synthesis & FHIR Extraction Pipeline          │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ executes
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │             Domain Layer (Core Entities & Rules)            │
       │   - Patient Profile, Doctor Entity, Appointment Schedule    │
       │   - SOAPNote, FHIRResourceBundle, ClinicalObservation       │
       │   - Crisis Sentinel Safety Rules (Deterministic)            │
       └──────────────────────────────▲──────────────────────────────┘
                                      │ implements
                                      │
       ┌──────────────────────────────┴──────────────────────────────┐
       │             Infrastructure Layer (Adapters & I/O)           │
       │   - PostgreSQL 16 (Ports 5433 & 5435) via SQLAlchemy/Prisma │
       │   - AES-256-GCM Envelope Encryption Storage                 │
       │   - Multi-Agent Voice Service (LangGraph, Sarvam AI)        │
       │   - External EMR / FHIR Server Connectors                   │
       └─────────────────────────────────────────────────────────────┘
```

### Layer Rules:
1. **Domain Layer:** Pure TypeScript / Python models with zero external third-party dependencies. Defines core business entities (`MemberQueue`, `ConsultationSession`, `SOAPRecord`, `FHIRBundle`).
2. **Application Layer:** Encapsulates business use cases. Coordinates domain entities and triggers infrastructure interfaces.
3. **Infrastructure Layer:** Implements database persistence, network clients, cryptographic envelopes, and AI provider integrations.
4. **Presentation Layer:** Renders the user interface and serves REST/WebSocket endpoints. Depends only on the Application and Domain layers.

---

## 👤 2. Member (Patient/Citizen) Workflow Architecture

The Member experience guides the user from symptom entry to clinical consultation:

```mermaid
flowchart TD
    classDef startNode fill:#047857,stroke:#065f46,stroke-width:2px,color:#fff;
    classDef processNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff;
    classDef aiNode fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef endNode fill:#059669,stroke:#047857,stroke-width:2px,color:#fff;
    classDef safetyNode fill:#e11d48,stroke:#be123c,stroke-width:2px,color:#fff;

    Start(["1. Patient Lands on Sanctuary"]):::startNode --> SymptomInput["2. Enter Symptoms in Intake Chatbot\ne.g., Tension Headache, Neck Stiffness"]:::processNode

    SymptomInput --> SentinelCheck{"Crisis Sentinel\nCircuit Breaker?"}:::safetyNode
    SentinelCheck -- "Crisis / Self-Harm Detected" --> CrisisOverlay["Display Emergency SOS Overlay\n(Tele-MANAS 14416 / 988 Helpline)"]:::safetyNode
    SentinelCheck -- "Normal Clinical Symptoms" --> AIAnalysis["3. AI Clinical Triage & Analysis\n(Evaluates urgency, severity, symptoms)"]:::aiNode

    AIAnalysis --> DoctorRec["4. Doctor Recommendation Card\nRecommends: Dr. Vikram Sen (Neurology)\nNext Available: May 11th at 10:00 AM"]:::aiNode

    DoctorRec --> ActionChoice{"User Action"}:::processNode
    ActionChoice -- "Click Book Consultation" --> BookingModal["5. Book Session Modal Opens\n- Select Doctor: Dr. Vikram Sen\n- Date: May 11th, 2026 at 10:00 AM\n- Format: Virtual Telehealth / In-Person\n- Chief Complaint pre-filled"]:::processNode
    ActionChoice -- "Continue Chatting" --> AIIntakeSupport["Intake Chatbot provides\nsymptom relief tips & guidance"]:::processNode

    BookingModal --> ConfirmBooking["6. Confirm Appointment\n- Writes to PostgreSQL DB\n- Updates Session Queue\n- Generates Telehealth Room ID"]:::processNode

    ConfirmBooking --> TelehealthRoom["7. Enter Telehealth Room\n- WebRTC Video Stream\n- Real-time Audio Streaming\n- Secure End-to-End Encryption"]:::endNode
```

---

## 🩺 3. Listener (Doctor/Clinician) Workflow Architecture

The Listener dashboard supports dual modalities: **Virtual Telehealth** and **In-Person Ambient AI Capture**:

```mermaid
flowchart TD
    classDef startNode fill:#047857,stroke:#065f46,stroke-width:2px,color:#fff;
    classDef processNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff;
    classDef aiNode fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef recordNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef fhirNode fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;

    DoctorHub(["1. Doctor Enters Clinical Hub"]):::startNode --> ModeSelection{"Choose Consultation Modality"}:::processNode

    %% Branch A: In-Person Ambient AI
    ModeSelection -- "In-Person Consultation" --> AmbientModal["2A. Launch In-Person Consultation Modal"]:::recordNode
    AmbientModal --> StartMic["Click 'Start Recording'\n(Ambient audio capture via Web Audio API)"]:::recordNode
    StartMic --> LiveCapture["Real-Time Consultation:\n- Animated Soundwave Visualizer\n- Live Transcript Streaming\n- Doctor & Patient Dialogue"]:::recordNode
    LiveCapture --> StopMic["Click 'Stop Recording'\n(Finalizes audio buffer)"]:::recordNode
    StopMic --> AISynthesis["3A. AI Synthesis Pipeline\n- Generates Full SOAP Note\n- Extracts FHIR Clinical Entities"]:::aiNode

    %% Branch B: Virtual Telehealth
    ModeSelection -- "Virtual Telehealth" --> TelehealthModal["2B. Launch Telehealth Room\n(Session with scheduled patient)"]:::processNode
    TelehealthModal --> CDSCopilot["Live Clinical Decision Support (CDS):\n- Real-time Diagnostic Copilot\n- Suggested Probing Questions\n- Vitals & Risk Metrics Monitor"]:::aiNode
    CDSCopilot --> EndCall["End Telehealth Session"]:::processNode
    EndCall --> AISynthesis

    %% Common Documentation & EHR
    AISynthesis --> ReviewScreen["4. Post-Consultation Review Modal\n- Tab 1: Comprehensive SOAP Note\n  (Subjective, Objective, Assessment, Plan)\n- Tab 2: FHIR R4 Clinical Extractions\n  • Condition: Tension Headache\n  • Observation: BP 120/80 mmHg, HR 72 bpm\n  • Medication: Acetaminophen 500mg Q6H\n  • Order: Complete Blood Count (CBC)"]:::fhirNode

    ReviewScreen --> PushEMR["5. Click 'Push to Electronic Medical Record (FHIR)'\n- Commits FHIR Bundle to Clinical Server\n- Updates Patient EHR History\n- Completes Clinical Encounter"]:::fhirNode
```

---

## 🔄 4. Unified End-to-End System Integration

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Member (Patient)
    participant Front as Next.js 16 Web App
    participant Fast as FastAPI Backend (8080)
    participant AI as LangGraph / Gemini CDS
    participant DB as PostgreSQL (5433/5435)
    actor Doctor as Listener (Doctor)

    Note over Patient,Front: Step 1: Patient Intake
    Patient->>Front: Enters symptoms ("Tension headache, stiffness")
    Front->>Fast: POST /api/mindspace/member/conversations
    Fast->>AI: Analyze symptoms & triage
    AI-->>Fast: Triage: Moderate tension, recommend Dr. Vikram Sen
    Fast-->>Front: Doctor Card: Dr. Vikram Sen (May 11th)

    Note over Patient,Doctor: Step 2: Appointment Booking
    Patient->>Front: Books May 11th at 10:00 AM (Virtual / In-Person)
    Front->>DB: Persist appointment record
    DB-->>Doctor: Real-time update in Listener Clinical Hub

    Note over Doctor,AI: Step 3: Clinical Consultation & Ambient AI
    alt In-Person Consultation
        Doctor->>Front: Clicks "Start Recording" (Ambient Audio)
        Front->>Front: Live soundwave visualization & transcript
        Doctor->>Front: Clicks "Stop Recording"
    else Virtual Telehealth
        Doctor->>Front: Enters Telehealth Room
        Front->>AI: Stream dialogue for live CDS Copilot
        AI-->>Front: Render suggested probing questions
    end

    Note over AI,Front: Step 4: Auto-Documentation (SOAP & FHIR)
    Front->>AI: Synthesize encounter dialogue
    AI-->>Front: SOAP Note + FHIR Entities (Acetaminophen, CBC, BP)

    Note over Doctor,DB: Step 5: Push to EHR
    Doctor->>Front: Reviews & clicks "Push to EMR / FHIR"
    Front->>Fast: POST /api/v1/clinical/fhir/bundle
    Fast->>DB: Encrypt & store clinical encounter (AES-256-GCM)
    Fast-->>Front: 200 OK (Encounter Finalized)
```

---

## 🗄️ 5. Database & Security Architecture

1. **Envelope Encryption (AES-256-GCM):**
   - Health journals, clinical notes, and private conversations are encrypted with individual data encryption keys (DEK).
   - Key encryption keys (KEK) are managed securely by the backend key management service.
2. **Dual PostgreSQL Architecture:**
   - **Port 5433 (`mindspace-postgres`):** Core health records, peer matching queues, clinical encounters, and FHIR resources.
   - **Port 5435 (`mindspace-frontend-postgres`):** Local user profiles, sessions, and Prisma application state.
3. **FHIR R4 Standardized Resources:**
   - `Condition`: Diagnoses and chief complaints.
   - `Observation`: Vital signs (blood pressure, heart rate, temperature).
   - `MedicationRequest`: Prescriptions and dosages.
   - `ServiceRequest`: Laboratory orders and diagnostic imaging.
