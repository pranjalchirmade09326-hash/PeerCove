# PeerCove IAM Identity Provider (Python / FastAPI)

High-performance Python FastAPI Identity & Access Management (IAM) service providing user authentication, role assignment, and cryptographic JWT issuance for the PeerCove platform.

- **Service Port:** `5001`
- **Database Port:** `5433` (shared PeerCove PostgreSQL cluster, `iam` schema) / `5430` (dedicated IAM container)
- **JWKS Endpoint:** `http://localhost:5001/.well-known/jwks.json`
- **Supported Endpoints:** `/api/auth/sign-up/email`, `/sign-in/email`, `/sign-out`, `/get-session`, `/token`, `/jwks`, `/health/ready`, `/health/live`.
- **Token Format:** EdDSA (Ed25519) asymmetric JWTs (1-hour validity) containing claims: `sub`, `name`, `email`, `role`, `iat`, `exp`, `iss`, `aud`.

---

## Getting Started

### Local Development with `uv`

```powershell
cd backend/peercove-iam-py

# Copy environment file
cp .env.example .env

# Install dependencies
uv sync

# Seed development test users & credentials (dev only)
uv run python -m app.seed

# Run the IAM FastAPI service
uv run uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload
```

### Docker Deployment

To launch the IAM service and PostgreSQL backing store in detached mode:

```powershell
cd backend/peercove-iam-py
docker compose up -d
```

To inspect logs:
```powershell
docker compose logs -f
```

To stop the service:
```powershell
docker compose down
```

---

## Architectural & Security Notes

- **Automated Schema Provisioning:** PostgreSQL tables under the `iam` schema are automatically initialized on startup via idempotent scripts in `migrations/*.sql`.
- **Password Security:** Passwords use salted scrypt hashing for strong brute-force resistance.
- **Cryptographic Key Management:** Ed25519 signing keys are managed internally, and public keys are exported dynamically via RFC 7517 compliant JWKS endpoints for stateless verification by `peercove-fastapi` and other platform services.
- **Role-Based Access Control (RBAC):** Injects user roles (`member`, `listener`, `supervisor`, `safety`, `admin`) directly into JWT claims for fine-grained authorization.
