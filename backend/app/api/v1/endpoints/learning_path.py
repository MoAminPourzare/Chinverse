from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User
from app.schemas.learning_path import LearningPathResponse
from app.services.learning_path import get_learning_path

router = APIRouter()


@router.get("", response_model=LearningPathResponse)
async def read_learning_path(
    response: Response,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    response.headers["Cache-Control"] = "private, no-store"
    return await get_learning_path(db, user_id=current_user.id)
