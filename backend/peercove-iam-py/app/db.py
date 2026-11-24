from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import asyncpg

from .config import get_settings

_pool: asyncpg.Pool | None = None


def split_dsn(url: str) -> tuple[str, str]:
    """Strip Prisma's `?schema=` parameter; asyncpg does not understand it."""
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query))
    schema = query.pop("schema", "public")
    return urlunsplit(parts._replace(query=urlencode(query))), schema


async def init_pool() -> asyncpg.Pool:
    global _pool
    dsn, schema = split_dsn(get_settings().database_url)
    _pool = await asyncpg.create_pool(dsn, min_size=1, max_size=10, server_settings={"search_path": schema})
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def apply_migrations() -> None:
    """Run the idempotent SQL files in ../migrations (CREATE ... IF NOT EXISTS)."""
    for sql_file in sorted((Path(__file__).resolve().parent.parent / "migrations").glob("*.sql")):
        await pool().execute(sql_file.read_text(encoding="utf-8"))


def pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool is not initialised")
    return _pool
