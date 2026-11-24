from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id
from app.schemas.intake import IntakeCreate, IntakeResponseCreate
from app.services.intake_service import IntakeService, get_intake_service

router = APIRouter(prefix="/api/v1/intakes", tags=["Intakes"])


@router.get("")
async def list_intakes(
    user_id: str = Depends(get_current_user_id),
    service: IntakeService = Depends(get_intake_service),
):
    return await service.list_intakes(user_id)


@router.post("")
@router.post("/sessions")
async def create_intake(
    payload: IntakeCreate,
    user_id: str = Depends(get_current_user_id),
    service: IntakeService = Depends(get_intake_service),
):
    return await service.create_intake(user_id, payload)


@router.post("/responses")
async def add_intake_response_direct(
    payload: dict,
    user_id: str = Depends(get_current_user_id),
    service: IntakeService = Depends(get_intake_service),
):
    return await service.add_response_direct(user_id, payload)


@router.get("/{intake_id}")
async def get_intake(
    intake_id: str,
    user_id: str = Depends(get_current_user_id),
    service: IntakeService = Depends(get_intake_service),
):
    return await service.get_intake(intake_id, user_id)


@router.post("/{intake_id}/responses")
async def add_intake_response(
    intake_id: str,
    payload: IntakeResponseCreate,
    user_id: str = Depends(get_current_user_id),
    service: IntakeService = Depends(get_intake_service),
):
    return await service.add_response(intake_id, payload, user_id)


@router.get("/{intake_id}/responses")
async def get_intake_responses(
    intake_id: str,
    user_id: str = Depends(get_current_user_id),
    service: IntakeService = Depends(get_intake_service),
):
    return await service.get_responses(intake_id, user_id)
