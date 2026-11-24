# PeerCove FHIR MCP Integration Gateway

FastMCP interoperability gateway that dynamically generates Model Context Protocol (MCP) tools from the FHIR R4 OpenAPI specification and forwards authenticated requests to `fhir-server`.

```
AI Agent (LangGraph, Claude, etc.)
        │  Streamable-HTTP (/mcp)
        ▼
   fhir-mcp :8002
        │  Forwarded Bearer JWT
        ▼
   fhir-server :8000
        │  Async SQLAlchemy
        ▼
   PostgreSQL 15
```

---

## Service Overview

| Attribute | Specification |
|---|---|
| **Port** | `8002` |
| **MCP Endpoint** | `http://localhost:8002/mcp` |
| **Transport** | Streamable-HTTP |
| **Framework** | FastAPI + FastMCP |
| **Package Manager** | uv |
| **Python Version** | 3.12+ / 3.14+ |

### How It Works
1. **Dynamic Tool Generation:** On startup, `fhir-mcp` fetches the OpenAPI schema from `fhir-server` (`OPENAPI_SPEC` environment variable) and calls `FastMCP.from_openapi()` to auto-generate one typed MCP tool per FHIR endpoint.
2. **Auth Forwarding:** Every incoming MCP tool execution must carry a valid `Bearer` JWT in the `Authorization` header. `AuthForwardingMiddleware` verifies the token against the JWKS endpoint and forwards it to `fhir-server` via `BearerAuth`.
3. **Clinical Interoperability:** Exposes FHIR R4 clinical resources (`Patient`, `Encounter`, `Observation`, `ClinicalImpression`, `DocumentReference`, etc.) to AI reasoning engines without manual tool definitions.

---

## Environment Variables

Create a `.env` file in `backend/fhir-mcp` (refer to `.env.example`):

| Variable | Type | Default | Description |
|---|---|---|---|
| `ENVIRONMENT` | string | `development` | Deployment environment (`development`, `production`, `test`). |
| `HTTP_CLIENT` | string | `http://localhost:8000` | Base URL of the upstream `fhir-server`. |
| `OPENAPI_SPEC` | string | `http://localhost:8000/openapi.json` | Full URL to the OpenAPI specification endpoint of `fhir-server`. |
| `IAM_ISSUER` | string | `http://localhost:5001` | Expected JWT issuer URL for token validation. |
| `IAM_JWKS_URL` | string | `http://localhost:5001/.well-known/jwks.json` | JSON Web Key Set (JWKS) URL used to verify Ed25519/RSA signatures. |

---

## Local Development & Startup

### Prerequisites
- Python 3.12+
- Upstream `fhir-server` running on `http://localhost:8000`
- [uv](https://github.com/astral-sh/uv) package manager

### 1. Local Run with `uv`
```powershell
cd backend/fhir-mcp

# Copy environment template
cp .env.example .env

# Install dependencies
uv sync

# Run the FastMCP service
uv run python -m app.main
```
The MCP server is mounted and listening at:
`http://localhost:8002/mcp`

### 2. Run with Docker Compose
```powershell
cd backend/fhir-mcp
docker compose up -d
```
To view logs:
```powershell
docker compose logs -f
```
To stop the container:
```powershell
docker compose down
```

---

## Client Integration

### Claude Desktop Configuration
Add the following entry to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "peercove-fhir": {
      "url": "http://localhost:8002/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_PEERCOVE_JWT>"
      }
    }
  }
}
```

### Testing with MCP Inspector
You can visually inspect and test all generated FHIR tools using the official Model Context Protocol Inspector:

```powershell
npx @modelcontextprotocol/inspector
```
Connect to `http://localhost:8002/mcp` with your authorization headers to verify tool discovery and execution.
