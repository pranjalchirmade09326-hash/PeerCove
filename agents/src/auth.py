"""
Authentication & Cryptographic JWT Verification Module for MindSpace Agents Service.

Validates incoming JWT tokens using the MindSpace IAM public key infrastructure:
- Algorithm: Strictly restricted to EdDSA (Ed25519)
- Key Discovery: IAM JWKS endpoint (/api/auth/jwks)
- Key Caching: In-memory cache with TTL and automatic re-fetch on unknown Key ID (kid)
- Claims Verification: Validates signature, expiration (exp), issuer (iss), and audience (aud)
- Environment Isolation: 'dev-*' tokens are strictly rejected unless ENVIRONMENT is explicitly 'development' or 'local'
"""

import os
import logging
import asyncio
from typing import Optional, Dict, Any, Tuple
from functools import lru_cache

import jwt
from jwt import PyJWKClient
from jwt.exceptions import (
    PyJWTError,
    ExpiredSignatureError,
    InvalidSignatureError,
    InvalidIssuerError,
    InvalidAudienceError,
    InvalidAlgorithmError,
    PyJWKClientError,
    PyJWKSetError,
    PyJWKClientConnectionError,
)

logger = logging.getLogger("mindspace.agents.auth")

# Configuration Constants
DEFAULT_JWKS_URL = "http://localhost:5001/api/auth/jwks"
DEFAULT_ISSUER = "http://localhost:5001"
DEFAULT_AUDIENCE = "mindspace-api"

ALLOWED_ALGORITHMS = ["EdDSA"]

class AuthenticationError(Exception):
    """Raised when JWT verification fails."""
    pass

def get_iam_jwks_url() -> str:
    return os.getenv("IAM_JWKS_URL", DEFAULT_JWKS_URL)

def get_iam_issuer() -> str:
    return os.getenv("IAM_ISSUER", DEFAULT_ISSUER)

def get_iam_audience() -> str:
    return os.getenv("IAM_AUDIENCE", DEFAULT_AUDIENCE)

def is_development_environment() -> bool:
    """
    Returns True ONLY if ENVIRONMENT or ENV is explicitly configured as
    'development', 'local', or 'dev'. Fails closed (False) if missing,
    empty, 'production', 'test', or any other value.
    """
    env = (os.getenv("ENVIRONMENT") or os.getenv("ENV") or "").strip().lower()
    return env in ("development", "local", "dev")

_jwks_client_instance: Optional[PyJWKClient] = None

def get_jwks_client() -> PyJWKClient:
    """
    Returns the module-level PyJWKClient singleton.
    Caches keys for 5 minutes (lifespan=300) and automatically re-fetches
    when encountering an unknown kid (supporting key rotation).
    """
    global _jwks_client_instance
    if _jwks_client_instance is None:
        url = get_iam_jwks_url()
        _jwks_client_instance = PyJWKClient(
            url,
            cache_keys=True,
            max_cached_keys=16,
            cache_jwk_set=True,
            lifespan=300,
            timeout=5.0,
        )
    return _jwks_client_instance

def set_jwks_client(client: Optional[PyJWKClient]) -> None:
    """Overrides or resets the PyJWKClient instance (useful for unit testing)."""
    global _jwks_client_instance
    _jwks_client_instance = client

def verify_token(token: Optional[str]) -> Dict[str, Any]:
    """
    Cryptographically verifies an incoming JWT token.

    Security enforcement:
    1. Rejects None, empty string, or whitespace.
    2. Allows 'dev-*' tokens ONLY in verified development environments.
       In production or undefined environments, dev tokens are strictly rejected.
    3. Requires valid header with 'alg' == 'EdDSA' and non-empty 'kid'.
    4. Resolves the Ed25519 public key from the IAM JWKS endpoint.
    5. Validates cryptographic signature, expiry (exp), issuer (iss), and audience (aud).
    6. Returns verified claims payload dictionary on success.
    7. Raises AuthenticationError on any failure (fail-closed).
    """
    if not token or not token.strip():
        raise AuthenticationError("Missing authentication token")

    token = token.strip()

    # Development token bypass check
    if token == "dev-jwt-token" or token.startswith("dev-"):
        if is_development_environment():
            logger.info("[auth] Accepted development token in local development environment")
            return {
                "sub": "member-sanctuary",
                "name": "Dev Member",
                "email": "dev-member@mindspace.local",
                "role": "member",
                "iss": get_iam_issuer(),
                "aud": get_iam_audience(),
            }
        else:
            logger.warning("[auth] Rejected development token: not permitted in this environment")
            raise AuthenticationError("Development tokens are not permitted in this environment")

    # Inspect token header without verification
    try:
        unverified_headers = jwt.get_unverified_header(token)
    except Exception as exc:
        raise AuthenticationError("Malformed JWT header") from exc

    alg = unverified_headers.get("alg")
    if alg not in ALLOWED_ALGORITHMS:
        raise AuthenticationError(f"Unsupported signing algorithm '{alg}'. Only {ALLOWED_ALGORITHMS} are permitted.")

    kid = unverified_headers.get("kid")
    if not kid or not str(kid).strip():
        raise AuthenticationError("Token missing 'kid' (Key ID) header")

    # Resolve public signing key from JWKS
    client = get_jwks_client()
    try:
        signing_key = client.get_signing_key_from_jwt(token)
    except PyJWKClientConnectionError as exc:
        logger.error("[auth] JWKS provider unreachable: %s", exc)
        raise AuthenticationError("Identity provider JWKS endpoint unreachable") from exc
    except (PyJWKClientError, PyJWKSetError, KeyError) as exc:
        logger.warning("[auth] Key ID '%s' not found in JWKS: %s", kid, exc)
        raise AuthenticationError(f"Signing key '{kid}' not found in identity provider JWKS") from exc
    except Exception as exc:
        logger.error("[auth] Unexpected error resolving signing key: %s", exc)
        raise AuthenticationError("Failed to resolve signing key from JWKS") from exc

    expected_issuer = get_iam_issuer()
    expected_audiences = [get_iam_audience(), expected_issuer]
    valid_audiences = [a for a in expected_audiences if a]

    try:
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=ALLOWED_ALGORITHMS,
            issuer=expected_issuer,
            audience=valid_audiences,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "verify_iss": True,
                "verify_aud": True,
                "require": ["exp", "iss", "sub"],
            },
            leeway=10.0,
        )
        return payload
    except ExpiredSignatureError as exc:
        logger.warning("[auth] Rejected expired token")
        raise AuthenticationError("Token has expired") from exc
    except InvalidIssuerError as exc:
        logger.warning("[auth] Rejected token with invalid issuer")
        raise AuthenticationError("Token issuer does not match trusted IAM issuer") from exc
    except InvalidAudienceError as exc:
        logger.warning("[auth] Rejected token with invalid audience")
        raise AuthenticationError("Token audience does not match expected audience") from exc
    except InvalidSignatureError as exc:
        logger.warning("[auth] Rejected token with invalid cryptographic signature")
        raise AuthenticationError("Invalid cryptographic signature") from exc
    except InvalidAlgorithmError as exc:
        logger.warning("[auth] Rejected token with disallowed algorithm")
        raise AuthenticationError("Disallowed signing algorithm") from exc
    except PyJWTError as exc:
        logger.warning("[auth] JWT verification failure: %s", exc)
        raise AuthenticationError(f"JWT verification failed: {exc}") from exc
    except Exception as exc:
        logger.error("[auth] Unexpected error during token decoding: %s", exc)
        raise AuthenticationError("Token verification encountered an unexpected error") from exc

async def validate_token_async(token: Optional[str]) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
    """
    Asynchronously validates a JWT token using a worker thread to ensure network
    or crypto operations do not block the asyncio event loop.

    Returns:
        (is_valid: bool, member_id: Optional[str], claims: Optional[Dict[str, Any]])
    """
    if not token or not token.strip():
        return False, None, None

    try:
        claims = await asyncio.to_thread(verify_token, token)
        sub = claims.get("sub") or claims.get("userId") or claims.get("id") or "member-sanctuary"
        return True, str(sub), claims
    except AuthenticationError as exc:
        logger.warning("[auth] Authentication rejected: %s", exc)
        return False, None, None
    except Exception as exc:
        logger.error("[auth] Unexpected failure during async token validation: %s", exc)
        return False, None, None

def validate_token(token: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Synchronous validation entrypoint for backward compatibility.

    Returns:
        (is_valid: bool, member_id: Optional[str])
    """
    if not token or not token.strip():
        return False, None

    try:
        claims = verify_token(token)
        sub = claims.get("sub") or claims.get("userId") or claims.get("id") or "member-sanctuary"
        return True, str(sub)
    except AuthenticationError:
        return False, None
    except Exception:
        return False, None
