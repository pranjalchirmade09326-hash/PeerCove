# PeerCove — AI Voice & Chat Agent Service

The **Agent Intelligence Engine (Engine 2)** for the PeerCove platform. It powers conversational AI companions, active-listening voice agents, and structured wellbeing reflection assistance.

---

## 🏛️ Clean Architectural Boundaries

In accordance with PeerCove's Clean Architecture and Three-Engine isolation model:

```
┌────────────────────────────────────────────────────────┐
│              PeerCove Agent Runtime                   │
│                                                        │
│  ┌────────────────────────┐  ┌──────────────────────┐  │
│  │   Conversational AI    │  │ Voice Stream Server  │  │
│  │   Supportive Companion │  │ (LiveKit / Sarvam)   │  │
│  └───────────┬────────────┘  └──────────┬───────────┘  │
│              │                          │              │
│              ▼                          ▼              │
│  ┌──────────────────────────────────────────────────┐  │
│  │       Interface Adapters / MCP Tool Gateway      │  │
│  │  (Zero Direct DB Access · Strict Typed Protocols)│  │
│  └──────────────────────────┬───────────────────────┘  │
└─────────────────────────────┼──────────────────────────┘
                              │ Authenticated REST / MCP
                              ▼
               ┌──────────────────────────────┐
               │    Engine 3: Core API        │
               │    (Health Data & Storage)   │
               └──────────────────────────────┘
```

### Safety & Isolation Guarantees
1. **Zero Database Credentials**: The agent container has no database connection strings or direct SQL access.
2. **Deterministic Safety Sentinel**: Crisis-screening circuit breakers run in the core API gateway prior to model inference.
3. **Non-Clinical Boundary**: Prompts and system instructions explicitly guide the agent in active listening, grounding exercises, and peer companionship, preventing any medical diagnosis or clinical claims.

---

## ⚙️ Configuration & Run

### Prerequisites
- Docker & Docker Compose
- API Key for LLM inference (e.g. Gemini / OpenAI)
- (Optional) Speech synthesis key (e.g. Sarvam API Key)

### Local Deployment

1. **Navigate to the agents directory:**
   ```bash
   cd agents
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   Configure the following in `.env`:
   ```ini
   API_KEY=your_gemini_or_openai_api_key
   SARVAM_API_KEY=your_sarvam_api_key
   JINA_API_KEY=your_jina_key_if_used
   ```

3. **Start the agent service:**
   ```bash
   docker compose up -d
   ```

4. The service will be available at `http://localhost:8018`.

---

## 🧪 Health & Logs

Check running agent logs:
```bash
docker compose logs -f peercove-agents
```

Check container status:
```bash
docker compose ps
```

