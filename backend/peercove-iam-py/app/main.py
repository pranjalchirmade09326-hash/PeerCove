import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .config import get_settings
from .db import apply_migrations, close_pool, init_pool, pool
from .demo_users import DEMO_USER_IDS
from .keys import mint_jwt, public_jwks
from .security import (
    hash_password,
    new_session_token,
    sign_cookie_value,
    unsign_cookie_value,
    verify_password,
)

settings = get_settings()
SESSION_TTL = timedelta(days=7)
SESSION_UPDATE_AGE = timedelta(days=1)
COOKIE_NAME = ("__Secure-" if settings.is_production else "") + "better-auth.session_token"


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_pool()
    await apply_migrations()
    yield
    await close_pool()


app = FastAPI(title="PeerCove IAM", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.trusted_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=600,
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


def _public_user(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "emailVerified": row["emailVerified"],
        "image": row["image"],
        "createdAt": row["createdAt"].isoformat(),
        "updatedAt": row["updatedAt"].isoformat(),
        "role": row["role"],
        "banned": row["banned"],
    }


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        sign_cookie_value(token, settings.secret),
        max_age=int(SESSION_TTL.total_seconds()),
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/",
    )


async def _create_session(request: Request, user_id: str) -> str:
    token = new_session_token()
    now = _now()
    await pool().execute(
        'INSERT INTO session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId") '
        "VALUES ($1,$2,$3,$4,$4,$5,$6,$7)",
        f"ses_{secrets.token_hex(16)}",
        now + SESSION_TTL,
        token,
        now,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        user_id,
    )
    return token


async def _load_session(request: Request):
    raw = request.cookies.get(COOKIE_NAME)
    token = unsign_cookie_value(raw, settings.secret) if raw else None
    if token is None:
        return None
    row = await pool().fetchrow(
        'SELECT s.id AS sid, s.token, s."expiresAt", s."createdAt" AS s_created, s."updatedAt" AS s_updated, '
        's."ipAddress", s."userAgent", u.* FROM session s JOIN "user" u ON u.id = s."userId" '
        "WHERE s.token = $1",
        token,
    )
    if row is None or row["expiresAt"] <= _now() or row["banned"]:
        return None
    if row["expiresAt"] - _now() < SESSION_TTL - SESSION_UPDATE_AGE:
        await pool().execute(
            'UPDATE session SET "expiresAt" = $1, "updatedAt" = $2 WHERE id = $3',
            _now() + SESSION_TTL,
            _now(),
            row["sid"],
        )
    return row


EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class SignUpBody(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    password: str = Field(min_length=10, max_length=128)
    name: str = Field(min_length=1)


class SignInBody(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    password: str = Field(min_length=1, max_length=128)


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({"code": code, "message": message}, status_code=status)


@app.post("/api/auth/sign-up/email")
async def sign_up(body: SignUpBody, request: Request, response: Response):
    email = body.email.lower()
    if await pool().fetchval('SELECT 1 FROM "user" WHERE email = $1', email):
        return _error(422, "USER_ALREADY_EXISTS", "User already exists. Use another email.")

    user_id = DEMO_USER_IDS.get(email) or f"usr_{secrets.token_hex(16)}"
    now = _now()
    async with pool().acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                'INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, banned) '
                "VALUES ($1,$2,$3,false,$4,$4,'member',false)",
                user_id,
                body.name,
                email,
                now,
            )
            await conn.execute(
                'INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") '
                "VALUES ($1,$2,'credential',$3,$4,$5,$5)",
                f"acc_{secrets.token_hex(16)}",
                user_id,
                user_id,
                hash_password(body.password),
                now,
            )
    token = await _create_session(request, user_id)
    _set_session_cookie(response, token)
    row = await pool().fetchrow('SELECT * FROM "user" WHERE id = $1', user_id)
    return {"token": token, "user": _public_user(row)}


@app.post("/api/auth/sign-in/email")
async def sign_in(body: SignInBody, request: Request, response: Response):
    email = body.email.lower()
    row = await pool().fetchrow(
        'SELECT u.*, a.password FROM "user" u JOIN account a ON a."userId" = u.id AND a."providerId" = \'credential\' '
        "WHERE u.email = $1",
        email,
    )
    if row is None or not row["password"] or not verify_password(body.password, row["password"]):
        return _error(401, "INVALID_EMAIL_OR_PASSWORD", "Invalid email or password")
    if row["banned"]:
        return _error(403, "BANNED_USER", "You have been banned from this application.")
    token = await _create_session(request, row["id"])
    _set_session_cookie(response, token)
    return {"redirect": False, "token": token, "user": _public_user(row)}


@app.post("/api/auth/sign-out")
async def sign_out(request: Request, response: Response):
    raw = request.cookies.get(COOKIE_NAME)
    token = unsign_cookie_value(raw, settings.secret) if raw else None
    if token:
        await pool().execute("DELETE FROM session WHERE token = $1", token)
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"success": True}


@app.get("/api/auth/get-session")
async def get_session(request: Request):
    row = await _load_session(request)
    if row is None:
        return None
    return {
        "session": {
            "id": row["sid"],
            "token": row["token"],
            "userId": row["id"],
            "expiresAt": row["expiresAt"].isoformat(),
            "createdAt": row["s_created"].isoformat(),
            "updatedAt": row["s_updated"].isoformat(),
            "ipAddress": row["ipAddress"],
            "userAgent": row["userAgent"],
        },
        "user": _public_user(row),
    }


@app.get("/api/auth/token")
async def get_token(request: Request):
    row = await _load_session(request)
    if row is None:
        if not settings.is_production:
            demo_user = {
                "id": "usr-demo-member-01",
                "name": "Alex Mercer",
                "email": "member@peercove.local",
                "role": "member",
            }
            return {"token": await mint_jwt(demo_user)}
        raise HTTPException(401, "Unauthorized")
    return {"token": await mint_jwt(dict(row))}


@app.get("/api/auth/jwks")
async def jwks():
    return await public_jwks()


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "peercove-iam",
        "message": "IAM Authentication Service is running",
    }


@app.get("/health")
@app.get("/health/live")
async def live():
    return {"status": "ok", "service": "peercove-iam"}


@app.get("/health/ready")
async def ready():
    try:
        await pool().fetchval("SELECT 1")
        return {"status": "ready"}
    except Exception:
        return JSONResponse({"status": "not_ready"}, status_code=503)


@app.exception_handler(404)
async def not_found(_: Request, __):
    return JSONResponse(
        {"status": "ok", "service": "peercove-iam", "detail": "Endpoint not found"},
        status_code=404,
    )
