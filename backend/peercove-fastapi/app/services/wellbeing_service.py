from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.core.security import encrypt_content, decrypt_content
from app.models.wellbeing import MoodEntry, JournalEntry, WellbeingGoal, GoalCheckin
from app.schemas.wellbeing import (
    MoodEntryCreate,
    JournalEntryCreate,
    GoalCreate,
    GoalCheckinCreate,
)
from app.services.base import BaseService
from datetime import datetime
import uuid


class WellbeingService(BaseService):
    async def list_moods(self, user_id: str) -> list[dict]:
        stmt = select(MoodEntry).where(MoodEntry.member_id == user_id).order_by(desc(MoodEntry.recorded_at)).limit(30)
        result = await self.db.execute(stmt)
        entries = result.scalars().all()
        
        return [
            {
                "id": str(m.id),
                "member_id": m.member_id,
                "mood_code": m.mood_code,
                "scale_code": m.scale_code,
                "scale_value": float(m.scale_value) if m.scale_value is not None else None,
                "note": decrypt_content(m.note_ciphertext, m.key_version) if m.note_ciphertext else None,
                "recorded_at": m.recorded_at.isoformat(),
                "created_at": m.created_at.isoformat()
            }
            for m in entries
        ]

    async def create_mood(self, user_id: str, payload: MoodEntryCreate) -> dict:
        ct, kv = (None, None)
        if payload.note:
            ct, kv = encrypt_content(payload.note)

        entry = MoodEntry(
            id=uuid.uuid4(),
            member_id=user_id,
            mood_code=payload.mood_code,
            scale_code=payload.scale_code,
            scale_value=payload.scale_value,
            note_ciphertext=ct,
            key_version=kv,
            recorded_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)

        return {
            "id": str(entry.id),
            "member_id": entry.member_id,
            "mood_code": entry.mood_code,
            "scale_value": float(entry.scale_value) if entry.scale_value is not None else None,
            "note": payload.note,
            "recorded_at": entry.recorded_at.isoformat()
        }

    async def list_journal_entries(self, user_id: str) -> list[dict]:
        stmt = select(JournalEntry).where(
            JournalEntry.member_id == user_id,
            JournalEntry.deleted_at.is_(None)
        ).order_by(desc(JournalEntry.created_at))
        result = await self.db.execute(stmt)
        entries = result.scalars().all()

        return [
            {
                "id": str(e.id),
                "member_id": e.member_id,
                "title": decrypt_content(e.title_ciphertext, e.key_version) if e.title_ciphertext else "Journal Entry",
                "body": decrypt_content(e.body_ciphertext, e.key_version),
                "visibility": e.visibility,
                "created_at": e.created_at.isoformat(),
                "updated_at": e.updated_at.isoformat()
            }
            for e in entries
        ]

    async def create_journal_entry(self, user_id: str, payload: JournalEntryCreate) -> dict:
        body_ct, body_kv = encrypt_content(payload.body)
        title_ct, title_kv = (None, body_kv)
        if payload.title:
            title_ct, title_kv = encrypt_content(payload.title)

        entry = JournalEntry(
            id=uuid.uuid4(),
            member_id=user_id,
            title_ciphertext=title_ct,
            body_ciphertext=body_ct,
            key_version=body_kv,
            visibility=payload.visibility,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)

        return {
            "id": str(entry.id),
            "title": payload.title,
            "body": payload.body,
            "visibility": entry.visibility,
            "created_at": entry.created_at.isoformat()
        }

    async def list_goals(self, user_id: str) -> list[dict]:
        stmt = select(WellbeingGoal).where(WellbeingGoal.member_id == user_id).order_by(desc(WellbeingGoal.created_at))
        result = await self.db.execute(stmt)
        goals = result.scalars().all()

        return [
            {
                "id": str(g.id),
                "member_id": g.member_id,
                "goal": decrypt_content(g.goal_ciphertext, g.key_version),
                "status": g.status,
                "target_date": g.target_date.isoformat() if g.target_date else None,
                "created_at": g.created_at.isoformat()
            }
            for g in goals
        ]

    async def create_goal(self, user_id: str, payload: GoalCreate) -> dict:
        goal_ct, goal_kv = encrypt_content(payload.goal)
        entry = WellbeingGoal(
            id=uuid.uuid4(),
            member_id=user_id,
            goal_ciphertext=goal_ct,
            key_version=goal_kv,
            status="active",
            target_date=payload.target_date,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)

        return {
            "id": str(entry.id),
            "goal": payload.goal,
            "status": entry.status,
            "target_date": entry.target_date.isoformat() if entry.target_date else None,
            "created_at": entry.created_at.isoformat()
        }

    async def add_goal_checkin(self, user_id: str, goal_id: str, payload: GoalCheckinCreate) -> dict:
        note_ct, note_kv = (None, None)
        if payload.note:
            note_ct, note_kv = encrypt_content(payload.note)

        checkin = GoalCheckin(
            id=uuid.uuid4(),
            goal_id=uuid.UUID(goal_id),
            status=payload.status,
            note_ciphertext=note_ct,
            key_version=note_kv,
            checkin_at=datetime.utcnow()
        )
        self.db.add(checkin)
        await self.db.commit()

        return {"status": "success", "goal_id": goal_id}

    async def toggle_goal_status(self, user_id: str, goal_id: str) -> dict:
        stmt = select(WellbeingGoal).where(WellbeingGoal.id == uuid.UUID(goal_id), WellbeingGoal.member_id == user_id)
        res = await self.db.execute(stmt)
        goal = res.scalar_one_or_none()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        goal.status = "completed" if goal.status == "active" else "active"
        goal.updated_at = datetime.utcnow()
        if goal.status == "completed":
            goal.closed_at = datetime.utcnow()
        else:
            goal.closed_at = None

        await self.db.commit()
        await self.db.refresh(goal)

        return {
            "id": str(goal.id),
            "status": goal.status,
            "goal": decrypt_content(goal.goal_ciphertext, goal.key_version)
        }

    async def delete_goal(self, user_id: str, goal_id: str) -> dict:
        stmt = select(WellbeingGoal).where(WellbeingGoal.id == uuid.UUID(goal_id), WellbeingGoal.member_id == user_id)
        res = await self.db.execute(stmt)
        goal = res.scalar_one_or_none()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        await self.db.delete(goal)
        await self.db.commit()
        return {"status": "deleted", "id": goal_id}

    async def list_reflections(self, user_id: str) -> list[dict]:
        return []


def get_wellbeing_service(db: AsyncSession = Depends(get_db)) -> WellbeingService:
    return WellbeingService(db)
