from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.models.dictionary import DictionaryWord
from app.models.leitner import UserFlashcard
from app.models.user import User
from app.schemas.leitner import (
    FlashcardRead,
    LeitnerAddRequest,
    LeitnerDashboardStats,
    LeitnerReviewResponse,
)
from app.services.daily_activity import record_words_learned

router = APIRouter()

# Spaced repetition intervals in days.
BOX_INTERVALS = {
    1: 1,
    2: 3,
    3: 7,
    4: 15,
    5: 30,
}


class ReviewRequest(BaseModel):
    card_id: int = Field(gt=0)
    remembered: bool


def _flashcard_word_options():
    return (
        selectinload(UserFlashcard.word).selectinload(DictionaryWord.definitions),
        selectinload(UserFlashcard.word).selectinload(DictionaryWord.examples),
        selectinload(UserFlashcard.word).selectinload(DictionaryWord.collocations),
    )


@router.post("/add", response_model=FlashcardRead)
async def add_card_to_leitner(
    request: LeitnerAddRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    """
    Add a published curated dictionary word to Leitner Box 1.

    Dictionary creation and editing are admin-only responsibilities. This keeps
    every flashcard linked to the reviewed HSK dictionary instead of silently
    creating incomplete words from client input.
    """
    result = await db.execute(
        select(DictionaryWord)
        .where(DictionaryWord.id == request.word_id)
        .where(DictionaryWord.status == "published")
    )
    word = result.scalar_one_or_none()
    if not word:
        raise not_found("Published dictionary word")

    result = await db.execute(
        select(UserFlashcard)
        .where(UserFlashcard.user_id == current_user.id)
        .where(UserFlashcard.word_id == word.id)
        .options(*_flashcard_word_options())
    )
    existing_card = result.scalar_one_or_none()
    if existing_card:
        return existing_card

    new_card = UserFlashcard(
        user_id=current_user.id,
        word_id=word.id,
        box_number=1,
        next_review_at=datetime.now(timezone.utc),
    )
    db.add(new_card)
    try:
        await db.commit()
    except IntegrityError:
        # A fast double click or two open tabs can race between the existence
        # check and insert. The database constraint is authoritative.
        await db.rollback()
        result = await db.execute(
            select(UserFlashcard)
            .where(UserFlashcard.user_id == current_user.id)
            .where(UserFlashcard.word_id == word.id)
            .options(*_flashcard_word_options())
        )
        existing_card = result.scalar_one_or_none()
        if existing_card:
            return existing_card
        raise

    result = await db.execute(
        select(UserFlashcard)
        .where(UserFlashcard.id == new_card.id)
        .options(*_flashcard_word_options())
    )
    return result.scalar_one()


@router.get("/check/{word_id}")
async def check_word_in_leitner(
    word_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Check if a word is already in the user's Leitner box.
    """
    if word_id <= 0:
        return {"in_leitner": False, "card_id": None}

    result = await db.execute(
        select(UserFlashcard)
        .where(UserFlashcard.user_id == current_user.id)
        .where(UserFlashcard.word_id == word_id)
    )
    card = result.scalar_one_or_none()
    return {"in_leitner": card is not None, "card_id": card.id if card else None}


@router.get("/dashboard", response_model=LeitnerDashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get Leitner dashboard statistics.
    """
    box_counts = {i: 0 for i in range(1, 6)}

    count_query = (
        select(UserFlashcard.box_number, func.count(UserFlashcard.id))
        .where(UserFlashcard.user_id == current_user.id)
        .group_by(UserFlashcard.box_number)
    )
    result = await db.execute(count_query)
    for box_num, count in result.all():
        box_counts[box_num] = count

    total_cards = sum(box_counts.values())
    mastered_count = box_counts.get(5, 0)

    now = datetime.now(timezone.utc)
    due_query = (
        select(func.count(UserFlashcard.id))
        .where(UserFlashcard.user_id == current_user.id)
        .where(UserFlashcard.next_review_at <= now)
    )
    result = await db.execute(due_query)
    total_due = result.scalar() or 0

    due_by_box = {i: 0 for i in range(1, 6)}
    due_by_box_query = (
        select(UserFlashcard.box_number, func.count(UserFlashcard.id))
        .where(UserFlashcard.user_id == current_user.id)
        .where(UserFlashcard.next_review_at <= now)
        .group_by(UserFlashcard.box_number)
    )
    result = await db.execute(due_by_box_query)
    for box_num, count in result.all():
        due_by_box[box_num] = count

    upcoming_count = max(total_cards - total_due, 0)

    next_due_query = (
        select(func.min(UserFlashcard.next_review_at))
        .where(UserFlashcard.user_id == current_user.id)
        .where(UserFlashcard.next_review_at > now)
    )
    result = await db.execute(next_due_query)
    next_due_at = result.scalar_one_or_none()

    recent_query = (
        select(UserFlashcard)
        .where(UserFlashcard.user_id == current_user.id)
        .options(*_flashcard_word_options())
        .order_by(desc(UserFlashcard.created_at))
        .limit(10)
    )
    result = await db.execute(recent_query)
    recent_cards = result.scalars().all()

    return LeitnerDashboardStats(
        box_counts=box_counts,
        due_by_box=due_by_box,
        box_intervals=BOX_INTERVALS,
        total_cards=total_cards,
        total_due=total_due,
        upcoming_count=upcoming_count,
        mastered_count=mastered_count,
        next_due_at=next_due_at,
        recent_cards=recent_cards,
    )


@router.get("/review", response_model=LeitnerReviewResponse)
async def get_review_cards(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=300, max_limit=1000)),
) -> Any:
    """
    Get cards due for review.
    """
    query = (
        select(UserFlashcard)
        .where(UserFlashcard.user_id == current_user.id)
        .where(UserFlashcard.next_review_at <= datetime.now(timezone.utc))
        .options(*_flashcard_word_options())
        .order_by(UserFlashcard.next_review_at)
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    result = await db.execute(query)
    cards = result.scalars().all()

    return LeitnerReviewResponse(cards=cards)


@router.post("/review", response_model=FlashcardRead)
async def submit_review(
    request: ReviewRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    """
    Submit a review result for a card.
    """
    result = await db.execute(
        select(UserFlashcard)
        .where(UserFlashcard.id == request.card_id)
        .where(UserFlashcard.user_id == current_user.id)
        .options(*_flashcard_word_options())
    )
    card = result.scalar_one_or_none()
    if not card:
        raise not_found("Card")

    now = datetime.now(timezone.utc)
    if request.remembered:
        new_box = min(card.box_number + 1, 5)
        card.box_number = new_box
        card.next_review_at = now + timedelta(days=BOX_INTERVALS.get(new_box, 1))
        await record_words_learned(db, user_id=current_user.id, count=1, commit=False)
    else:
        card.box_number = 1
        card.next_review_at = now + timedelta(days=1)

    card.last_reviewed_at = now
    await db.commit()

    result = await db.execute(
        select(UserFlashcard)
        .where(UserFlashcard.id == card.id)
        .options(*_flashcard_word_options())
    )
    return result.scalar_one()
