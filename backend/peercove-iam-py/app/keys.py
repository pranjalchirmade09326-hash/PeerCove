import base64
import hashlib
import json
import os
import uuid
from datetime import datetime, timezone

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .config import get_settings
from .db import pool

_cache: dict[str, Ed25519PrivateKey] = {}


def _aes() -> AESGCM:
    return AESGCM(hashlib.sha256(get_settings().secret.encode()).digest())


def _b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _encrypt(private: Ed25519PrivateKey) -> str:
    raw = private.private_bytes(
        serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption()
    )
    nonce = os.urandom(12)
    return base64.b64encode(nonce + _aes().encrypt(nonce, raw, None)).decode()


def _decrypt(blob: str) -> Ed25519PrivateKey | None:
    try:
        data = base64.b64decode(blob, validate=True)
        raw = _aes().decrypt(data[:12], data[12:], None)
        return Ed25519PrivateKey.from_private_bytes(raw)
    except Exception:
        # Keys written by the Node IAM use a different envelope and cannot be read here.
        return None


def _public_jwk(private: Ed25519PrivateKey) -> dict:
    raw = private.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {"kty": "OKP", "crv": "Ed25519", "x": _b64u(raw)}


async def get_signing_key() -> tuple[str, Ed25519PrivateKey]:
    rows = await pool().fetch('SELECT id, "privateKey" FROM jwks ORDER BY "createdAt" DESC')
    for row in rows:
        key = _cache.get(row["id"]) or _decrypt(row["privateKey"])
        if key is not None:
            _cache[row["id"]] = key
            return row["id"], key

    private = Ed25519PrivateKey.generate()
    key_id = uuid.uuid4().hex
    await pool().execute(
        'INSERT INTO jwks (id, "publicKey", "privateKey", "createdAt", alg, crv) VALUES ($1,$2,$3,$4,$5,$6)',
        key_id,
        json.dumps(_public_jwk(private)),
        _encrypt(private),
        datetime.now(timezone.utc).replace(tzinfo=None),
        "EdDSA",
        "Ed25519",
    )
    _cache[key_id] = private
    return key_id, private


async def public_jwks() -> dict:
    await get_signing_key()
    keys = []
    for row in await pool().fetch('SELECT id, "publicKey" FROM jwks ORDER BY "createdAt" DESC'):
        try:
            jwk = json.loads(row["publicKey"])
        except ValueError:
            continue
        if jwk.get("kty") == "OKP":
            keys.append({**jwk, "kid": row["id"]})
    return {"keys": keys}


async def mint_jwt(user: dict) -> str:
    settings = get_settings()
    key_id, private = await get_signing_key()
    now = int(datetime.now(timezone.utc).timestamp())
    payload = {
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "iat": now,
        "exp": now + 3600,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }
    return jwt.encode(payload, private, algorithm="EdDSA", headers={"kid": key_id})
