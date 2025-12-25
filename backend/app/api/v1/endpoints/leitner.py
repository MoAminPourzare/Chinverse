from typing import Any, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.api import deps
from app.models.leitner import UserFlashcard
from app.models.dictionary import DictionaryWord
from app.models.user import User
from app.schemas.leitner import (
    LeitnerAddRequest,
    LeitnerDashboardStats,
    LeitnerReviewResponse,
    FlashcardRead
)

router = APIRouter()

# Spaced Repetition Intervals (in days)
BOX_INTERVALS = {
    1: 1,   # Box 1: 1 Day
    2: 3,   # Box 2: 3 Days
    3: 7,   # Box 3: 7 Days
    4: 15,  # Box 4: 15 Days
    5: 30,  # Box 5: 30 Days
}

# Mock vocabulary data (same as vocabulary.py)
MOCK_VOCABULARY = {
    "打算": {
        "pinyin": "dǎ suàn",
        "persian_meaning": "قصد داشتن، خواستن",
        "chinese_meaning": "1. 关于行动的方向、方法等的想法；念头\n2. 考虑；计划",
        "composition": "打算盘\n另有打算",
    },
    "标题": {
        "pinyin": "biāo tí",
        "persian_meaning": "عنوان، تیتر",
        "chinese_meaning": "1. 标明文章、作品等内容的简短语句\n2. 题目",
        "composition": "大标题\n小标题",
    },
    "学习": {
        "pinyin": "xué xí",
        "persian_meaning": "یادگیری، درس خواندن",
        "chinese_meaning": "1. 从阅读、听讲、研究、实践中获得知识或技能\n2. 效法",
        "composition": "学习方法\n学习计划",
    },
    "热身": {
        "pinyin": "rè shēn",
        "persian_meaning": "گرم کردن بدن",
        "chinese_meaning": "1. 运动前使身体发热的准备活动\n2. 比喻正式活动前的准备",
        "composition": "热身运动\n热身活动",
    },
    "第三级": {
        "pinyin": "dì sān jí",
        "persian_meaning": "سطح سوم",
        "chinese_meaning": "第三个等级或阶段",
        "composition": "第一级\n第二级",
    },
    "经理": {
        "pinyin": "jīng lǐ",
        "persian_meaning": "مدیر",
        "chinese_meaning": "1. 企业中负责经营管理业务的人\n2. 管理",
        "composition": "总经理\n经理部",
    },
}

def get_mock_data(chinese: str) -> dict:
    """Get mock vocabulary data for a Chinese word."""
    return MOCK_VOCABULARY.get(chinese, {
        "pinyin": "",
        "persian_meaning": "معنی فارسی",
        "chinese_meaning": "中文含义",
        "composition": "",
    })


class ReviewRequest(BaseModel):
    card_id: int
    remembered: bool


@router.post("/add", response_model=FlashcardRead)
async def add_card_to_leitner(
    request: LeitnerAddRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Add a word to Leitner Box 1.
    Accepts either word_id or chinese text to find/create the word.
    """
    word = None
    
    # Try to find by word_id first
    if request.word_id is not None and request.word_id > 0:
        word = await db.get(DictionaryWord, request.word_id)
    
    # If no word found by id, try to find by chinese text
    if not word and request.chinese:
        result = await db.execute(
            select(DictionaryWord).where(DictionaryWord.chinese == request.chinese)
        )
        word = result.scalar_one_or_none()
        
        # If still not found, create a new DictionaryWord with mock data
        if not word:
            # Get mock data for this word
            mock_data = get_mock_data(request.chinese)
            
            word = DictionaryWord(
                chinese=request.chinese,
                pinyin=request.pinyin or mock_data.get("pinyin", ""),
                level="Leitner",
                persian_meaning=request.persian_meaning or mock_data.get("persian_meaning"),
                chinese_meaning=request.chinese_meaning or mock_data.get("chinese_meaning"),
                composition=mock_data.get("composition"),
            )
            db.add(word)
            await db.commit()
            await db.refresh(word)
        else:
            # Update existing word if it has missing data
            updated = False
            mock_data = get_mock_data(request.chinese)
            
            if not word.persian_meaning and mock_data.get("persian_meaning"):
                word.persian_meaning = mock_data["persian_meaning"]
                updated = True
            if not word.chinese_meaning and mock_data.get("chinese_meaning"):
                word.chinese_meaning = mock_data["chinese_meaning"]
                updated = True
            if not word.composition and mock_data.get("composition"):
                word.composition = mock_data["composition"]
                updated = True
            
            if updated:
                await db.commit()
                await db.refresh(word)
    
    if not word:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either word_id or chinese text must be provided",
        )

    # Check if flashcard already exists
    result = await db.execute(
        select(UserFlashcard)
        .where(UserFlashcard.user_id == current_user.id)
        .where(UserFlashcard.word_id == word.id)
        .options(selectinload(UserFlashcard.word))
    )
    existing_card = result.scalar_one_or_none()

    if existing_card:
        return existing_card

    # Create new flashcard
    new_card = UserFlashcard(
        user_id=current_user.id,
        word_id=word.id,
        box_number=1,
        next_review_at=datetime.utcnow(),
    )
    db.add(new_card)
    await db.commit()
    await db.refresh(new_card)
    
    # Reload with relation
    result = await db.execute(
        select(UserFlashcard)
        .where(UserFlashcard.id == new_card.id)
        .options(selectinload(UserFlashcard.word))
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
    # Guard: If word_id is 0 or invalid, it's a mock word not yet saved
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
    # Box Counts
    box_counts = {i: 0 for i in range(1, 6)}
    
    count_query = (
        select(UserFlashcard.box_number, func.count(UserFlashcard.id))
        .where(UserFlashcard.user_id == current_user.id)
        .group_by(UserFlashcard.box_number)
    )
    result = await db.execute(count_query)
    for box_num, count in result.all():
        box_counts[box_num] = count

    # Total Due (cards ready to be reviewed right now)
    due_query = (
        select(func.count(UserFlashcard.id))
        .where(UserFlashcard.user_id == current_user.id)
        .where(UserFlashcard.next_review_at <= datetime.utcnow())
    )
    result = await db.execute(due_query)
    total_due = result.scalar() or 0

    # Recent Cards (most recently added or reviewed)
    recent_query = (
        select(UserFlashcard)
        .where(UserFlashcard.user_id == current_user.id)
        .options(selectinload(UserFlashcard.word))
        .order_by(desc(UserFlashcard.created_at))
        .limit(10)
    )
    result = await db.execute(recent_query)
    recent_cards = result.scalars().all()

    return LeitnerDashboardStats(
        box_counts=box_counts,
        total_due=total_due,
        recent_cards=recent_cards
    )


@router.get("/review", response_model=LeitnerReviewResponse)
async def get_review_cards(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get cards due for review.
    """
    # Get all due cards
    query = (
        select(UserFlashcard)
        .where(UserFlashcard.user_id == current_user.id)
        .where(UserFlashcard.next_review_at <= datetime.utcnow())
        .options(selectinload(UserFlashcard.word))
        .order_by(UserFlashcard.next_review_at)
    )
    result = await db.execute(query)
    cards = result.scalars().all()

    return LeitnerReviewResponse(cards=cards)


@router.post("/review", response_model=FlashcardRead)
async def submit_review(
    request: ReviewRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Submit a review result for a card.
    - If remembered: Move to next box (max 5), set next_review based on new box interval.
    - If not remembered: Move back to Box 1, set next_review to now (due immediately).
    """
    # Get the card
    result = await db.execute(
        select(UserFlashcard)
        .where(UserFlashcard.id == request.card_id)
        .where(UserFlashcard.user_id == current_user.id)
        .options(selectinload(UserFlashcard.word))
    )
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found",
        )

    now = datetime.utcnow()

    if request.remembered:
        # Move to next box (cap at 5)
        new_box = min(card.box_number + 1, 5)
        card.box_number = new_box
        # Set next review based on new box interval
        interval_days = BOX_INTERVALS.get(new_box, 1)
        card.next_review_at = now + timedelta(days=interval_days)
    else:
        # Move back to Box 1
        card.box_number = 1
        # Due immediately (or next day for fairness)
        card.next_review_at = now + timedelta(days=1)

    card.last_reviewed_at = now
    await db.commit()
    await db.refresh(card)

    # Reload with relation
    result = await db.execute(
        select(UserFlashcard)
        .where(UserFlashcard.id == card.id)
        .options(selectinload(UserFlashcard.word))
    )
    return result.scalar_one()
