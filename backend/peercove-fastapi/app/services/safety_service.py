from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.safety import SafetyDB, SafetyStatsDB
from app.schemas.safety import (
    SafetyCreateRequest,
    SafetyUpdateRequest,
    SafetySearchRequest,
    SafetyStatsUpdateRequest,
)
from app.services.base import BaseService


class SafetyService(BaseService):
    async def get_by_id(self, safety_id: str) -> SafetyDB:
        stmt = (
            select(SafetyDB)
            .where((SafetyDB.id == safety_id) | (SafetyDB.user_id == safety_id))
            .options(selectinload(SafetyDB.stats))
        )
        result = await self.db.execute(stmt)
        safety = result.scalar_one_or_none()
        if not safety:
            raise HTTPException(status_code=404, detail=f"Safety officer with ID {safety_id} not found")
        return safety

    async def get_stats(self, safety_id: str) -> SafetyStatsDB:
        safety = await self.get_by_id(safety_id)
        if not safety.stats:
            raise HTTPException(status_code=404, detail=f"Stats not found for safety officer {safety_id}")
        return safety.stats

    async def list_safety_officers(self, limit: int = 50, offset: int = 0) -> List[SafetyDB]:
        stmt = (
            select(SafetyDB)
            .options(selectinload(SafetyDB.stats))
            .limit(limit)
            .offset(offset)
            .order_by(SafetyDB.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def search_safety_officers(self, search: SafetySearchRequest) -> List[SafetyDB]:
        filters = []
        if search.email:
            filters.append(SafetyDB.email.ilike(f"%{search.email}%"))
        if search.status:
            filters.append(SafetyDB.status == search.status)
        if search.needs_intervention is not None:
            filters.append(SafetyDB.needs_intervention == search.needs_intervention)
        if search.is_active is not None:
            filters.append(SafetyDB.is_active == search.is_active)

        stmt = (
            select(SafetyDB)
            .options(selectinload(SafetyDB.stats))
            .where(and_(*filters) if filters else True)
            .limit(search.limit)
            .offset(search.offset)
            .order_by(SafetyDB.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_safety_officer(self, safety: SafetyCreateRequest) -> SafetyDB:
        stmt = select(SafetyDB).where(SafetyDB.user_id == safety.user_id)
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Safety officer with user_id {safety.user_id} already exists")

        new_safety = SafetyDB(
            id=str(uuid.uuid4()),
            user_id=safety.user_id,
            first_name=safety.first_name,
            last_name=safety.last_name,
            email=safety.email,
            phone=safety.phone,
            risk_score=safety.risk_score,
            status=safety.status,
            last_assessment_date=safety.last_assessment_date,
            needs_intervention=safety.needs_intervention,
            is_active=safety.is_active,
        )
        stats = SafetyStatsDB(
            id=str(uuid.uuid4()),
            safety_id=new_safety.id,
            high_risk_users=0,
            alerts_active=0,
            incidents_reported=0,
            avg_response_time_minutes=0.0,
            escalations_made=0,
            assessment_completion_rate=100.0,
            critical_cases=0,
        )
        self.db.add(new_safety)
        self.db.add(stats)
        await self.db.commit()
        await self.db.refresh(new_safety)
        return new_safety

    async def update_safety_officer(self, safety_id: str, update: SafetyUpdateRequest) -> SafetyDB:
        safety = await self.get_by_id(safety_id)
        if update.first_name is not None:
            safety.first_name = update.first_name
        if update.last_name is not None:
            safety.last_name = update.last_name
        if update.email is not None:
            safety.email = update.email
        if update.phone is not None:
            safety.phone = update.phone
        if update.risk_score is not None:
            safety.risk_score = update.risk_score
        if update.status is not None:
            safety.status = update.status
        if update.last_assessment_date is not None:
            safety.last_assessment_date = update.last_assessment_date
        if update.needs_intervention is not None:
            safety.needs_intervention = update.needs_intervention
        if update.is_active is not None:
            safety.is_active = update.is_active

        safety.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(safety, ["stats"])
        return safety

    async def update_stats(self, safety_id: str, stats_update: SafetyStatsUpdateRequest) -> SafetyStatsDB:
        safety = await self.get_by_id(safety_id)
        if not safety.stats:
            raise HTTPException(status_code=404, detail=f"Stats not found for safety officer {safety_id}")
        
        stats = safety.stats
        if stats_update.high_risk_users is not None:
            stats.high_risk_users = stats_update.high_risk_users
        if stats_update.alerts_active is not None:
            stats.alerts_active = stats_update.alerts_active
        if stats_update.incidents_reported is not None:
            stats.incidents_reported = stats_update.incidents_reported
        if stats_update.avg_response_time_minutes is not None:
            stats.avg_response_time_minutes = stats_update.avg_response_time_minutes
        if stats_update.escalations_made is not None:
            stats.escalations_made = stats_update.escalations_made
        if stats_update.assessment_completion_rate is not None:
            stats.assessment_completion_rate = stats_update.assessment_completion_rate
        if stats_update.critical_cases is not None:
            stats.critical_cases = stats_update.critical_cases

        stats.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(stats)
        return stats

    async def delete_safety_officer(self, safety_id: str) -> None:
        safety = await self.get_by_id(safety_id)
        await self.db.delete(safety)
        await self.db.commit()

    async def check_health(self) -> dict:
        try:
            stmt = select(SafetyDB).limit(1)
            await self.db.execute(stmt)
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "module": "safetys",
            }
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")


def get_safety_service(db: AsyncSession = Depends(get_db)) -> SafetyService:
    return SafetyService(db)
