from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.admin import AdminDB, AdminStatsDB, AdminRoleEnum
from app.schemas.admin import (
    AdminCreateRequest,
    AdminUpdateRequest,
    AdminSearchRequest,
    AdminStatsUpdateRequest,
)
from app.services.base import BaseService


class AdminService(BaseService):
    async def get_by_id(self, admin_id: str) -> AdminDB:
        stmt = (
            select(AdminDB)
            .where((AdminDB.id == admin_id) | (AdminDB.user_id == admin_id))
            .options(selectinload(AdminDB.stats))
        )
        result = await self.db.execute(stmt)
        admin = result.scalar_one_or_none()
        if not admin:
            raise HTTPException(status_code=404, detail=f"Admin with ID {admin_id} not found")
        return admin

    async def check_permission(self, admin_id: str, permission: str) -> bool:
        try:
            stmt = select(AdminDB).where((AdminDB.id == admin_id) | (AdminDB.user_id == admin_id))
            res = await self.db.execute(stmt)
            admin = res.scalar_one_or_none()
            if not admin:
                return False
            
            perms = admin.permissions or []
            if "*" in perms or "all" in perms:
                return True
            if getattr(admin, "role", None) in [AdminRoleEnum.SUPER_ADMIN, "super_admin"]:
                return True
            return permission in perms
        except Exception:
            return False

    async def get_by_department(self, department_id: str) -> List[AdminDB]:
        stmt = (
            select(AdminDB)
            .options(selectinload(AdminDB.stats))
            .where(AdminDB.department.ilike(f"%{department_id}%"))
            .order_by(AdminDB.created_at.desc())
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_stats(self, admin_id: str) -> AdminStatsDB:
        admin = await self.get_by_id(admin_id)
        if not admin.stats:
            raise HTTPException(status_code=404, detail=f"Stats not found for admin {admin_id}")
        return admin.stats

    async def list_admins(self, limit: int = 50, offset: int = 0) -> List[AdminDB]:
        stmt = (
            select(AdminDB)
            .options(selectinload(AdminDB.stats))
            .limit(limit)
            .offset(offset)
            .order_by(AdminDB.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def search_admins(self, search: AdminSearchRequest) -> List[AdminDB]:
        filters = []
        if search.email:
            filters.append(AdminDB.email.ilike(f"%{search.email}%"))
        if search.department:
            filters.append(AdminDB.department == search.department)
        if search.role:
            filters.append(AdminDB.role == search.role)
        if search.is_active is not None:
            filters.append(AdminDB.is_active == search.is_active)

        stmt = (
            select(AdminDB)
            .options(selectinload(AdminDB.stats))
            .where(and_(*filters) if filters else True)
            .limit(search.limit)
            .offset(search.offset)
            .order_by(AdminDB.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_admin(self, admin: AdminCreateRequest) -> AdminDB:
        stmt = select(AdminDB).where(AdminDB.user_id == admin.user_id)
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Admin with user_id {admin.user_id} already exists")

        new_admin = AdminDB(
            id=str(uuid.uuid4()),
            user_id=admin.user_id,
            role=admin.role,
            permissions=admin.permissions,
            department=admin.department,
            email=admin.email,
            phone=admin.phone,
            is_active=admin.is_active,
        )
        stats = AdminStatsDB(
            id=str(uuid.uuid4()),
            admin_id=new_admin.id,
            total_users=0,
            active_listeners=0,
            pending_reports=0,
            system_health_percent=100.0,
            response_time_ms=0.0,
            avg_quality_score=0.0,
        )
        self.db.add(new_admin)
        self.db.add(stats)
        await self.db.commit()
        await self.db.refresh(new_admin)
        return new_admin

    async def update_admin(self, admin_id: str, update: AdminUpdateRequest) -> AdminDB:
        admin = await self.get_by_id(admin_id)
        if update.role is not None:
            admin.role = update.role
        if update.permissions is not None:
            admin.permissions = update.permissions
        if update.department is not None:
            admin.department = update.department
        if update.email is not None:
            admin.email = update.email
        if update.phone is not None:
            admin.phone = update.phone
        if update.is_active is not None:
            admin.is_active = update.is_active

        admin.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(admin, ["stats"])
        return admin

    async def update_stats(self, admin_id: str, stats_update: AdminStatsUpdateRequest) -> AdminStatsDB:
        admin = await self.get_by_id(admin_id)
        if not admin.stats:
            raise HTTPException(status_code=404, detail=f"Stats not found for admin {admin_id}")
        
        stats = admin.stats
        if stats_update.total_users is not None:
            stats.total_users = stats_update.total_users
        if stats_update.active_listeners is not None:
            stats.active_listeners = stats_update.active_listeners
        if stats_update.pending_reports is not None:
            stats.pending_reports = stats_update.pending_reports
        if stats_update.system_health_percent is not None:
            stats.system_health_percent = stats_update.system_health_percent
        if stats_update.response_time_ms is not None:
            stats.response_time_ms = stats_update.response_time_ms
        if stats_update.avg_quality_score is not None:
            stats.avg_quality_score = stats_update.avg_quality_score

        stats.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(stats)
        return stats

    async def delete_admin(self, admin_id: str) -> None:
        admin = await self.get_by_id(admin_id)
        await self.db.delete(admin)
        await self.db.commit()

    async def check_health(self) -> dict:
        try:
            stmt = select(AdminDB).limit(1)
            await self.db.execute(stmt)
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "module": "admins",
            }
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")


def get_admin_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    return AdminService(db)
