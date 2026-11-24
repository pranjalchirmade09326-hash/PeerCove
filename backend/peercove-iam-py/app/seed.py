"""Seed demo identities (and optionally PeerCove API principals). Development only.

Run: uv run python -m app.seed
"""

import asyncio
import secrets
from datetime import datetime, timezone

import asyncpg

from .config import get_settings
from .db import apply_migrations, close_pool, init_pool, pool
from .demo_users import DEMO_PASSWORD, DEMO_USERS
from .security import hash_password

ADMIN_ID = "usr-demo-admin-01"


async def seed_iam_users() -> None:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for user in DEMO_USERS:
        existing = await pool().fetchrow('SELECT id FROM "user" WHERE email = $1', user.email)
        if existing is None:
            async with pool().acquire() as conn, conn.transaction():
                await conn.execute(
                    'INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, banned) '
                    "VALUES ($1,$2,$3,true,$4,$4,$5,false)",
                    user.id, user.name, user.email, now, user.role,
                )
                await conn.execute(
                    'INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") '
                    "VALUES ($1,$2,'credential',$2,$3,$4,$4)",
                    f"acc_{secrets.token_hex(16)}", user.id, hash_password(DEMO_PASSWORD), now,
                )
            print(f"created IAM user {user.email} ({user.role})")
            continue
        if existing["id"] != user.id:
            raise RuntimeError(
                f"{user.email} already exists with id {existing['id']}; expected {user.id}. "
                "Remove the existing demo account before reseeding."
            )
        await pool().execute(
            'UPDATE "user" SET role=$2, name=$3, "emailVerified"=true, banned=false, "banReason"=NULL, '
            '"banExpires"=NULL, "updatedAt"=$4 WHERE id=$1',
            user.id, user.role, user.name, now,
        )
        print(f"updated IAM user {user.email} ({user.role})")


async def seed_peercove_api(url: str) -> None:
    conn = await asyncpg.connect(url)
    try:
        async with conn.transaction():
            for user in DEMO_USERS:
                await conn.execute(
                    "INSERT INTO app_principals (user_id, account_state) VALUES ($1,'active') "
                    "ON CONFLICT (user_id) DO NOTHING",
                    user.id,
                )
                await conn.execute(
                    "INSERT INTO role_assignments (id, user_id, role_code, assignment_state, granted_by_user_id, decision_reason) "
                    "SELECT gen_random_uuid(), $1, $2, 'active', $3, 'Synthetic demo seed' "
                    "WHERE NOT EXISTS (SELECT 1 FROM role_assignments "
                    "WHERE user_id = $1 AND role_code = $2 AND assignment_state = 'active')",
                    user.id, user.role, ADMIN_ID,
                )
                await conn.execute(
                    "INSERT INTO member_profiles (user_id, display_name) VALUES ($1,$2) "
                    "ON CONFLICT (user_id) DO NOTHING",
                    user.id, user.name,
                )
        print("seeded PeerCove API principals, roles and member profiles")
    finally:
        await conn.close()


async def main() -> None:
    settings = get_settings()
    await init_pool()
    try:
        await apply_migrations()
        await seed_iam_users()
    finally:
        await close_pool()
    if settings.seed_peercove_api and settings.peercove_api_database_url:
        await seed_peercove_api(settings.peercove_api_database_url)
    else:
        print("Skipping PeerCove API seed (SEED_PEERCOVE_API=false)")


if __name__ == "__main__":
    asyncio.run(main())
