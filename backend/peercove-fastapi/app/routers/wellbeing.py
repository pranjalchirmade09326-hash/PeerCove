from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id
from app.schemas.wellbeing import (
    MoodEntryCreate,
    JournalEntryCreate,
    GoalCreate,
    GoalCheckinCreate,
)
from app.services.wellbeing_service import WellbeingService, get_wellbeing_service

router = APIRouter(prefix="/api/v1/wellbeing", tags=["Wellbeing"])


# --- MOOD TRACKING ---

@router.get("/moods")
async def list_moods(
    user_id: str = Depends(get_current_user_id),
    service: WellbeingService = Depends(get_wellbeing_service),
):
    return await service.list_moods(user_id)


@router.post("/moods")
async def create_mood(
    payload: MoodEntryCreate,
    user_id: str = Depends(get_current_user_id),
    service: WellbeingService = Depends(get_wellbeing_service),
):
    return await service.create_mood(user_id, payload)


# --- JOURNAL ENTRIES ---

@router.get("/journal")
@router.get("/journals")
async def list_journal_entries(
    user_id: str = Depends(get_current_user_id),
    service: WellbeingService = Depends(get_wellbeing_service),
):
    return await service.list_journal_entries(user_id)


@router.post("/journal")
@router.post("/journals")
async def create_journal_entry(
    payload: JournalEntryCreate,
    user_id: str = Depends(get_current_user_id),
    service: WellbeingService = Depends(get_wellbeing_service),
):
    return await service.create_journal_entry(user_id, payload)


# --- GOALS & CHECK-INS ---

@router.get("/goals")
async def list_goals(
    user_id: str = Depends(get_current_user_id),
    service: WellbeingService = Depends(get_wellbeing_service),
):
    return await service.list_goals(user_id)


@router.post("/goals")
async def create_goal(
    payload: GoalCreate,
    user_id: str = Depends(get_current_user_id),
    service: WellbeingService = Depends(get_wellbeing_service),
):
    return await service.create_goal(user_id, payload)


@router.post("/goals/{goal_id}/checkins")
async def add_goal_checkin(
    goal_id: str,
    payload: GoalCheckinCreate,
    user_id: str = Depends(get_current_user_id),
    service: WellbeingService = Depends(get_wellbeing_service),
):
    return await service.add_goal_checkin(user_id, goal_id, payload)


@router.put("/goals/{goal_id}/toggle")
async def toggle_goal_status(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    service: WellbeingService = Depends(get_wellbeing_service),
):
    return await service.toggle_goal_status(user_id, goal_id)


@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    service: WellbeingService = Depends(get_wellbeing_service),
):
    return await service.delete_goal(user_id, goal_id)


@router.get("/reflections")
async def list_reflections(
    user_id: str = Depends(get_current_user_id),
    service: WellbeingService = Depends(get_wellbeing_service),
):
    return await service.list_reflections(user_id)
