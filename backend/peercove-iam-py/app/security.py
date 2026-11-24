import base64
import hashlib
import hmac
import os
import secrets
import unicodedata

# Same parameters and "salt:key" layout as Better Auth, so existing password hashes keep working.
_N, _R, _P, _DKLEN = 16384, 16, 1, 64
_MAXMEM = 128 * 1024 * 1024


def _scrypt(password: str, salt: str) -> bytes:
    return hashlib.scrypt(
        unicodedata.normalize("NFKC", password).encode(),
        salt=salt.encode(),
        n=_N,
        r=_R,
        p=_P,
        dklen=_DKLEN,
        maxmem=_MAXMEM,
    )


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    return f"{salt}:{_scrypt(password, salt).hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt, _, key = stored.partition(":")
    if not salt or not key:
        return False
    return hmac.compare_digest(_scrypt(password, salt).hex(), key)


def new_session_token() -> str:
    return secrets.token_urlsafe(24)


def sign_cookie_value(token: str, secret: str) -> str:
    sig = base64.b64encode(hmac.new(secret.encode(), token.encode(), hashlib.sha256).digest()).decode()
    return f"{token}.{sig}"


def unsign_cookie_value(value: str, secret: str) -> str | None:
    token, _, _sig = value.rpartition(".")
    if not token:
        return None
    if not hmac.compare_digest(sign_cookie_value(token, secret), value):
        return None
    return token
