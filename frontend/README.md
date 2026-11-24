# PeerCove — Frontend Application

[![Stack: Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016%20(App%20Router)-black)](https://nextjs.org/)
[![UI: React 19](https://img.shields.io/badge/UI-React%2019%20%7C%20Tailwind%20CSS-blue)](https://react.dev/)
[![Auth: Better Auth](https://img.shields.io/badge/Auth-Better%20Auth-purple)](https://better-auth.com/)
[![Realtime: LiveKit & Vapi](https://img.shields.io/badge/Voice-LiveKit%20%26%20Vapi-red)](https://livekit.io/)

The modern, responsive web frontend for the **PeerCove** peer-support and emotional wellbeing platform. Built on **Next.js 16 (16.2.4) App Router** and **React 19 (19.2.4)**, it provides accessible workspaces for members, listeners, supervisors, and platform administrators.

---

## 🏛️ Clean Module Architecture

The frontend follows a domain-driven Clean Architecture structure inside `src/`:

```
frontend/src/
├── app/                        # Delivery Layer: Next.js 16 App Router pages & API routes
│   ├── api/                    # Serverless API routes (auth, workflow, speech, status)
│   └── [locale]/               # Internationalized localized routing (/en, etc.)
│       ├── (auth)/             # Authentication flows (login, signup, forgot-password)
│       ├── (marketing)/        # Public landing pages & educational content
│       └── (peercove)/        # PeerCove Core Role Dashboards
│           └── peercove/
│               ├── member/     # Member Wellbeing Sanctuary (consultation, goals, journal, mood)
│               ├── listener/   # Volunteer Listener Hub (members, profile)
│               ├── listener-supervisor/ # Supervisor Sanctuary (conduct-reports, listeners, training-reviews)
│               ├── safety-operations/   # Emergency crisis triage & safety incident desk
│               └── platform-administrator/ # Platform admin, zero-knowledge controls & audit logs
├── components/                 # Presentation Layer: Reusable atomic design components
│   ├── ui/                     # Base design system widgets (buttons, modals, forms)
│   └── common/                 # Layouts, navigation headers, and footers
├── modules/                    # Application / Use Case Layer: Feature-driven domain modules
│   ├── client/peercove/       # Client-side domain modules:
│   │   ├── member/             # Member workflows: mood trackers, encrypted journal, goals
│   │   ├── listener/           # Listener tools: offer acceptance, active peer chat, SOAP
│   │   ├── supervisor/         # Supervisor tools: pod roster, conduct audits, eligibility
│   │   ├── safety/             # Safety triage, crisis escalation desk, hotline cards
│   │   ├── admin/              # Admin controls: zero-knowledge mode, telemetry
│   │   ├── companion/          # Voice & conversational grounding companion
│   │   └── intake/             # Conversational intake & screener questionnaires
│   └── server/peercove/       # Server-side integration modules:
│       ├── api-client.ts       # Backend API client communicating with Port 8080
│       ├── member-dashboard.ts # Server-side data fetching for member sanctuary
│       ├── role-dashboards.ts  # Server-side data aggregators for role dashboards
│       └── role-guard.ts       # RBAC role verification and authorization guards
├── hooks/                      # Interface Adapters: TanStack React Query & custom state hooks
├── lib/                        # Infrastructure Layer: API client, Better Auth client, helpers
├── providers/                  # Application Contexts: Theme, Auth, QueryClient, Toast
└── types/                      # Domain interfaces, API schemas, and DTOs
```

---

## 🚀 Key User Experiences (5 Role Workspaces)

1. **Member Workspace (`/peercove/member`)**:
   - **AI Companion & Grounding**: Interactive voice & chat wellbeing companion.
   - **Private Mood Journal**: Mood check-ins, personal reflection prompts, and emotional trajectory graphs.
   - **Peer Support Requests**: Connect with trained listeners based on shared topics and availability.
   - **Consultation Room**: Live audio/video peer sessions with in-call somatic breathing pacer (4-7-8).
2. **Listener Hub (`/peercove/listener`)**:
   - **Match Offers & Live Queue**: View, accept, or decline pending member match requests.
   - **Secure Peer Chat**: Real-time supportive conversations with members and post-session SOAP documentation.
   - **Cooldown Breather**: Mandatory restorative pause between peer support encounters.
3. **Supervisor Sanctuary (`/peercove/listener-supervisor`)**:
   - **Pod Roster Oversight**: Volunteer readiness, workload capacity, and eligibility toggles.
   - **Conduct & Boundary Audits**: Review member-reported boundary concerns and record resolutions.
   - **Training Reviews**: Verify CEU completions and sign off Safeguarding V2 credentials.
4. **Safety Operations Desk (`/peercove/safety-operations`)**:
   - **Crisis Escalation Desk**: Human-led crisis triage for urgent interventions.
   - **Emergency Routing**: Direct connections to Tele-MANAS (+91 9999 666 555), AASRA, and 112/988 hotlines.
5. **Platform Administration (`/peercove/platform-administrator`)**:
   - **Governance & Zero-Knowledge Mode**: Cryptographic key rotation tracking, KMS metrics, and RBAC directory.

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** `>= 22`
- **pnpm** `>= 9`
- Running Backend API (`http://localhost:8080`)
- Running IAM Service (`http://localhost:5001`)

### Installation & Run

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   *Ensure `NEXT_PUBLIC_API_URL` points to `peercove-fastapi` (`http://localhost:8080`).*

3. **Generate Prisma client:**
   ```bash
   pnpm db:generate
   ```

4. **Run the development server:**
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:4000/en/peercove/member](http://localhost:4000/en/peercove/member) in your browser.

---

## 🧪 Testing & Linting

```bash
# Run ESLint validation
pnpm lint

# Production build check
pnpm build
```

---

## 🔒 Security & Data Boundaries

- All sensitive member interactions are protected by JWT tokens validated against the PeerCove identity provider (Port 5001).
- Audio streams are ephemeral via LiveKit / Vapi; no raw audio is retained on the client or sent to persistent browser storage.
