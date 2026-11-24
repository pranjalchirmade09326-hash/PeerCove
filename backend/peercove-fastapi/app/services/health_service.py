from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.services.base import BaseService


class HealthService(BaseService):
    async def check_db_health(self) -> dict:
        try:
            await self.db.execute(text("SELECT 1"))
            return {
                "status": "ok",
                "service": "peercove-postgres",
                "message": "PostgreSQL Database is running and connected",
                "port": 5433,
            }
        except Exception as e:
            return {"status": "degraded", "service": "peercove-postgres", "error": str(e)}


def get_health_service(db: AsyncSession = Depends(get_db)) -> HealthService:
    return HealthService(db)
