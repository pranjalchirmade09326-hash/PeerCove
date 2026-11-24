from fastapi import APIRouter, Depends
from app.services.health_service import HealthService, get_health_service

router = APIRouter(tags=["Health"])

@router.get("/")
async def root():
    return {
        "status": "ok",
        "service": "peercove-fastapi",
        "message": "PeerCove Core FastAPI Engine is running",
        "runtime": "Python FastAPI",
        "docs": "/docs",
        "api_docs": "/api-docs",
    }

@router.get("/health")
@router.get("/health/live")
async def health_live():
    return {"status": "ok", "service": "peercove-fastapi"}

@router.get("/health/ready")
@router.get("/health/db")
async def health_db(service: HealthService = Depends(get_health_service)):
    return await service.check_db_health()
