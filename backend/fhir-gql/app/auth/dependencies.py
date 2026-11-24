"""
FastAPI dependency functions for JWT-based authentication.

Flow overview:
  1. Client sends  `Authorization: Bearer <jwt>` in the request header.
  2. `get_current_user` extracts the raw token string.
  3. `decode_token` fetches the matching public key from the IAM JWKS endpoint
     and uses it to verify the JWT signature, expiry, issuer, and audience claims.
  4. The decoded payload is stored on `request.state.user` so downstream
     route handlers and middleware can read it without re-decoding.

The PyJWKClient is instantiated once at module level (module-level singleton) so
the JWKS response is cached between requests; it re-fetches only when the key
rotation requires it (handled internally by python-jose's PyJWKClient).
"""

import jwt
from jwt import PyJWKClient
from fastapi import Request

from app.config import settings
from app.errors.auth import AuthenticationError

# Module-level singleton for the JWKS client.
jwks_client = PyJWKClient(settings.IAM_JWKS_URL)


def decode_token(token: str) -> dict:
    """
    Validate and decode a raw JWT string.
    In development mode, allows dev tokens and falls back gracefully when JWKS is not running.
    """
    if settings.ENVIRONMENT == "development" and (token == "dev-jwt-token" or token.startswith("dev-")):
        if "patient" in token:
            return {
                "sub": "usr-patient-01",
                "name": "Sarah Jenkins",
                "email": "patient@peercove.com",
                "role": "patient",
                "org_id": "org-default-01",
                "permissions": ["*"],
            }
        elif "admin" in token:
            return {
                "sub": "usr-admin-01",
                "name": "System Administrator",
                "email": "admin@peercove.com",
                "role": "admin",
                "org_id": "org-default-01",
                "permissions": ["*"],
            }
        else:
            return {
                "sub": "usr-doctor-01",
                "name": "Dr. John Smith",
                "email": "doctor@peercove.com",
                "role": "practitioner",
                "org_id": "org-default-01",
                "permissions": ["*"],
            }

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            audience=settings.IAM_ISSUER,
            issuer=settings.IAM_ISSUER,
            algorithms=["EdDSA", "RS256"],
            options={"verify_aud": True},
        )
    except Exception as exc:
        if settings.ENVIRONMENT == "development":
            return {
                "sub": "usr-doctor-01",
                "name": "Dr. John Smith",
                "email": "doctor@peercove.com",
                "role": "practitioner",
                "org_id": "org-default-01",
                "permissions": ["*"],
            }
        raise exc


async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency that authenticates the incoming request.
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        if settings.ENVIRONMENT == "development":
            payload = {
                "sub": "usr-patient-01",
                "name": "Sarah Jenkins",
                "email": "patient@peercove.com",
                "role": "patient",
                "org_id": "org-default-01",
                "permissions": ["*"],
            }
            request.state.user = payload
            request.state.token = "dev-jwt-token"
            return payload
        raise AuthenticationError("Missing authentication token")

    token = auth_header.split(" ")[1]

    try:
        payload = decode_token(token)
        request.state.user = payload
        request.state.token = token
        return payload

    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token expired")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid token")
    except Exception:
        raise AuthenticationError("Invalid or expired token")
