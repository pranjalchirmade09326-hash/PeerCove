from contextlib import asynccontextmanager
import asyncio
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from app.core.config import settings
from app.core.init_db import init_and_seed_db
from app.core.database import AsyncSessionLocal
from app.services.peer_service import PeerService
from app.routers import health, dashboards, member, wellbeing, intakes, peer, operations, admins, supervisors, safetys

sweeper_logger = logging.getLogger("peercove.sweeper")


async def run_request_expiry_sweeper():
    """Background task to periodically sweep expired ListenerMatchRequest records."""
    while True:
        try:
            await asyncio.sleep(60)
            async with AsyncSessionLocal() as session:
                service = PeerService(session)
                count = await service.sweep_expired_requests()
                if count > 0:
                    sweeper_logger.info(f"Sweeper expired {count} overdue match requests.")
        except asyncio.CancelledError:
            break
        except Exception as e:
            sweeper_logger.debug(f"Sweeper pass exception: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and seed database if PostgreSQL is available
    await init_and_seed_db()
    sweeper_task = asyncio.create_task(run_request_expiry_sweeper())
    try:
        yield
    finally:
        sweeper_task.cancel()
        try:
            await sweeper_task
        except asyncio.CancelledError:
            pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PeerCove Core Platform API — Built with Python FastAPI & PostgreSQL",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api-docs/json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(dashboards.router)
app.include_router(member.router)
app.include_router(wellbeing.router)
app.include_router(intakes.router)
app.include_router(peer.router)
app.include_router(operations.router)
app.include_router(admins.router)
app.include_router(supervisors.router)
app.include_router(safetys.router)
app.include_router(safetys.safety_alias_router)

@app.get("/api-docs", include_in_schema=False)
async def api_docs_redirect():
    return RedirectResponse(url="/docs")


@app.exception_handler(404)
async def not_found(_: Request, __):
    return JSONResponse(
        {"status": "ok", "service": "peercove-fastapi", "detail": "Endpoint not found"},
        status_code=404,
    )

def main():
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

if __name__ == "__main__":
    main()
