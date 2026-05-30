from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import bad_request, not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.models.business import UserSubscription
from app.models.course import Course, Lesson, LessonSubtitle, LessonWordMap
from app.models.dictionary import DictionaryWord, WordCollocation, WordDefinition, WordExample
from app.models.leitner import UserFlashcard
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminStat(BaseModel):
    key: str
    label: str
    value: int


class AdminUserSummary(BaseModel):
    id: int
    email: str
    phone: str
    status: str
    is_verified: bool
    display_name: Optional[str] = None
    headline: Optional[str] = None
    created_at: datetime


class AdminCourseSummary(BaseModel):
    id: int
    title: str
    slug: str
    level: str
    created_at: datetime


class AdminWordSummary(BaseModel):
    id: int
    chinese: str
    pinyin: str
    level: str
    persian_meaning: Optional[str] = None
    created_at: datetime


class AdminOverview(BaseModel):
    stats: List[AdminStat]
    recent_users: List[AdminUserSummary]
    recent_courses: List[AdminCourseSummary]
    recent_words: List[AdminWordSummary]


class AdminWordDefinitionIn(BaseModel):
    lang_code: str = Field(default="fa", max_length=12)
    definition_text: str = Field(min_length=1, max_length=4000)
    part_of_speech: str = Field(default="unknown", min_length=1, max_length=80)


class AdminWordExampleIn(BaseModel):
    zh_text: str = Field(min_length=1, max_length=1000)
    pinyin: str = Field(default="", max_length=1000)
    target_text: str = Field(default="", max_length=1000)


class AdminWordCollocationIn(BaseModel):
    phrase_zh: str = Field(min_length=1, max_length=500)
    phrase_pinyin: str = Field(default="", max_length=500)
    translation_target: str = Field(default="", max_length=500)


class AdminDictionaryWordIn(BaseModel):
    chinese: str = Field(min_length=1, max_length=80)
    pinyin: str = Field(default="", max_length=160)
    audio_url: Optional[str] = Field(default=None, max_length=1000)
    level: str = Field(default="custom", min_length=1, max_length=80)
    persian_meaning: Optional[str] = Field(default=None, max_length=4000)
    chinese_meaning: Optional[str] = Field(default=None, max_length=4000)
    composition: Optional[str] = Field(default=None, max_length=4000)
    definitions: List[AdminWordDefinitionIn] = Field(default_factory=list)
    examples: List[AdminWordExampleIn] = Field(default_factory=list)
    collocations: List[AdminWordCollocationIn] = Field(default_factory=list)


class AdminWordDefinitionOut(AdminWordDefinitionIn):
    id: int

    class Config:
        from_attributes = True


class AdminWordExampleOut(AdminWordExampleIn):
    id: int

    class Config:
        from_attributes = True


class AdminWordCollocationOut(AdminWordCollocationIn):
    id: int

    class Config:
        from_attributes = True


class AdminDictionaryWordOut(BaseModel):
    id: int
    chinese: str
    pinyin: str
    audio_url: Optional[str] = None
    level: str
    persian_meaning: Optional[str] = None
    chinese_meaning: Optional[str] = None
    composition: Optional[str] = None
    definitions: List[AdminWordDefinitionOut] = Field(default_factory=list)
    examples: List[AdminWordExampleOut] = Field(default_factory=list)
    collocations: List[AdminWordCollocationOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminAiDraftRequest(BaseModel):
    words: List[str] = Field(min_length=1, max_length=80)
    context: Optional[str] = Field(default=None, max_length=4000)


class AdminAiDraftResponse(BaseModel):
    prompt: str
    words: List[str]


class AdminSubtitleIn(BaseModel):
    lang_code: str = Field(default="zh-fa", max_length=20)
    text: str = Field(min_length=1, max_length=10000)
    timestamp_start: float = Field(ge=0)
    timestamp_end: float = Field(ge=0)


class AdminSubtitleOut(AdminSubtitleIn):
    id: int
    lesson_id: int

    class Config:
        from_attributes = True


class AdminLessonWordMapIn(BaseModel):
    word_id: int = Field(gt=0)
    timestamp: float = Field(ge=0)


class AdminLessonWordMapOut(AdminLessonWordMapIn):
    id: int
    lesson_id: int
    word: AdminWordSummary

    class Config:
        from_attributes = True


async def _get_word(db: AsyncSession, word_id: int) -> DictionaryWord:
    result = await db.execute(
        select(DictionaryWord)
        .options(
            selectinload(DictionaryWord.definitions),
            selectinload(DictionaryWord.examples),
            selectinload(DictionaryWord.collocations),
        )
        .where(DictionaryWord.id == word_id)
    )
    word = result.scalar_one_or_none()
    if not word:
        raise not_found("Dictionary word")
    return word


def _clean_optional(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip()
    return value or None


async def _replace_word_children(
    db: AsyncSession,
    word: DictionaryWord,
    payload: AdminDictionaryWordIn,
) -> None:
    await db.execute(delete(WordDefinition).where(WordDefinition.word_id == word.id))
    await db.execute(delete(WordExample).where(WordExample.word_id == word.id))
    await db.execute(delete(WordCollocation).where(WordCollocation.word_id == word.id))

    for definition in payload.definitions:
        db.add(
            WordDefinition(
                word_id=word.id,
                lang_code=definition.lang_code.strip() or "fa",
                definition_text=definition.definition_text.strip(),
                part_of_speech=definition.part_of_speech.strip() or "unknown",
            )
        )

    for example in payload.examples:
        db.add(
            WordExample(
                word_id=word.id,
                zh_text=example.zh_text.strip(),
                pinyin=example.pinyin.strip(),
                target_text=example.target_text.strip(),
            )
        )

    for collocation in payload.collocations:
        db.add(
            WordCollocation(
                word_id=word.id,
                phrase_zh=collocation.phrase_zh.strip(),
                phrase_pinyin=collocation.phrase_pinyin.strip(),
                translation_target=collocation.translation_target.strip(),
            )
        )


@router.get("/overview", response_model=AdminOverview)
async def admin_overview(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    _ = current_user

    async def count(model: Any) -> int:
        return int(await db.scalar(select(func.count(model.id))) or 0)

    users_count = await count(User)
    courses_count = await count(Course)
    lessons_count = await count(Lesson)
    words_count = await count(DictionaryWord)
    subtitles_count = await count(LessonSubtitle)
    active_subscriptions = int(await db.scalar(select(func.count(UserSubscription.id))) or 0)

    users_result = await db.execute(
        select(User).options(selectinload(User.profile)).order_by(desc(User.created_at)).limit(6)
    )
    courses_result = await db.execute(select(Course).order_by(desc(Course.created_at)).limit(6))
    words_result = await db.execute(select(DictionaryWord).order_by(desc(DictionaryWord.created_at)).limit(6))

    return {
        "stats": [
            {"key": "users", "label": "کاربران", "value": users_count},
            {"key": "courses", "label": "دوره‌ها", "value": courses_count},
            {"key": "lessons", "label": "درس‌ها", "value": lessons_count},
            {"key": "words", "label": "کلمات دیکشنری", "value": words_count},
            {"key": "subtitles", "label": "زیرنویس‌ها", "value": subtitles_count},
            {"key": "subscriptions", "label": "اشتراک‌ها", "value": active_subscriptions},
        ],
        "recent_users": [
            {
                "id": user.id,
                "email": user.email,
                "phone": user.phone,
                "status": str(user.status),
                "is_verified": user.is_verified,
                "display_name": user.profile.display_name if user.profile else None,
                "headline": user.profile.headline if user.profile else None,
                "created_at": user.created_at,
            }
            for user in users_result.scalars().all()
        ],
        "recent_courses": courses_result.scalars().all(),
        "recent_words": words_result.scalars().all(),
    }


@router.get("/users", response_model=List[AdminUserSummary])
async def admin_users(
    q: Optional[str] = Query(default=None, max_length=120),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=50)),
) -> Any:
    _ = current_user
    query = select(User).options(selectinload(User.profile))
    if q:
        term = f"%{q.strip()}%"
        query = query.where(or_(User.email.ilike(term), User.phone.ilike(term)))

    result = await db.execute(
        query.order_by(desc(User.created_at)).offset(pagination.skip).limit(pagination.limit)
    )
    users = result.scalars().all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "status": str(user.status),
            "is_verified": user.is_verified,
            "display_name": user.profile.display_name if user.profile else None,
            "headline": user.profile.headline if user.profile else None,
            "created_at": user.created_at,
        }
        for user in users
    ]


@router.get("/dictionary", response_model=List[AdminDictionaryWordOut])
async def admin_dictionary_words(
    q: Optional[str] = Query(default=None, max_length=80),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=50)),
) -> Any:
    _ = current_user
    query = select(DictionaryWord).options(
        selectinload(DictionaryWord.definitions),
        selectinload(DictionaryWord.examples),
        selectinload(DictionaryWord.collocations),
    )
    if q:
        term = f"%{q.strip()}%"
        query = query.where(
            or_(
                DictionaryWord.chinese.ilike(term),
                DictionaryWord.pinyin.ilike(term),
                DictionaryWord.persian_meaning.ilike(term),
            )
        )

    result = await db.execute(
        query.order_by(desc(DictionaryWord.updated_at)).offset(pagination.skip).limit(pagination.limit)
    )
    return result.scalars().unique().all()


@router.post(
    "/dictionary",
    response_model=AdminDictionaryWordOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(write_rate_limit)],
)
async def admin_create_dictionary_word(
    payload: AdminDictionaryWordIn,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    _ = current_user
    chinese = payload.chinese.strip()
    if not chinese:
        raise bad_request("Chinese word cannot be empty")

    word = DictionaryWord(
        chinese=chinese,
        pinyin=payload.pinyin.strip(),
        audio_url=_clean_optional(payload.audio_url),
        level=payload.level.strip() or "custom",
        persian_meaning=_clean_optional(payload.persian_meaning),
        chinese_meaning=_clean_optional(payload.chinese_meaning),
        composition=_clean_optional(payload.composition),
    )
    db.add(word)
    await db.flush()
    await _replace_word_children(db, word, payload)
    await db.commit()
    return await _get_word(db, word.id)


@router.put(
    "/dictionary/{word_id}",
    response_model=AdminDictionaryWordOut,
    dependencies=[Depends(write_rate_limit)],
)
async def admin_update_dictionary_word(
    word_id: int,
    payload: AdminDictionaryWordIn,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    _ = current_user
    word = await _get_word(db, word_id)
    word.chinese = payload.chinese.strip()
    word.pinyin = payload.pinyin.strip()
    word.audio_url = _clean_optional(payload.audio_url)
    word.level = payload.level.strip() or "custom"
    word.persian_meaning = _clean_optional(payload.persian_meaning)
    word.chinese_meaning = _clean_optional(payload.chinese_meaning)
    word.composition = _clean_optional(payload.composition)

    await _replace_word_children(db, word, payload)
    await db.commit()
    return await _get_word(db, word.id)


@router.delete("/dictionary/{word_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_dictionary_word(
    word_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> None:
    _ = current_user
    word = await db.get(DictionaryWord, word_id)
    if not word:
        raise not_found("Dictionary word")

    await db.execute(delete(LessonWordMap).where(LessonWordMap.word_id == word_id))
    await db.execute(delete(UserFlashcard).where(UserFlashcard.word_id == word_id))
    await db.execute(delete(WordDefinition).where(WordDefinition.word_id == word_id))
    await db.execute(delete(WordExample).where(WordExample.word_id == word_id))
    await db.execute(delete(WordCollocation).where(WordCollocation.word_id == word_id))
    await db.delete(word)
    await db.commit()


@router.post("/ai/dictionary-draft", response_model=AdminAiDraftResponse)
async def admin_dictionary_ai_prompt(
    payload: AdminAiDraftRequest,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    _ = current_user
    words = [word.strip() for word in payload.words if word.strip()]
    if not words:
        raise bad_request("At least one word is required")

    word_lines = "\n".join(f"- {word}" for word in words)
    context = payload.context.strip() if payload.context else "بدون متن زمینه"
    prompt = f"""برای دیکشنری آموزشی چینی به فارسی چین‌ورس، برای هر کلمه زیر خروجی JSON بده.
هر آیتم باید این کلیدها را داشته باشد:
chinese, pinyin, level, persian_meaning, chinese_meaning, composition,
definitions: [{{lang_code, definition_text, part_of_speech}}],
examples: [{{zh_text, pinyin, target_text}}],
collocations: [{{phrase_zh, phrase_pinyin, translation_target}}]

قواعد:
- فارسی طبیعی و آموزشی بنویس.
- مثال‌ها کوتاه، کاربردی و مناسب زبان‌آموز باشند.
- اگر از معنی مطمئن نیستی در فیلد review_note توضیح بده.
- خروجی فقط JSON معتبر باشد.

زمینه ویدیو/درس:
{context}

کلمات:
{word_lines}
"""
    return {"prompt": prompt, "words": words}


@router.get("/lessons/{lesson_id}/subtitles", response_model=List[AdminSubtitleOut])
async def admin_lesson_subtitles(
    lesson_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    _ = current_user
    result = await db.execute(
        select(LessonSubtitle)
        .where(LessonSubtitle.lesson_id == lesson_id)
        .order_by(LessonSubtitle.timestamp_start, LessonSubtitle.id)
    )
    return result.scalars().all()


@router.put(
    "/lessons/{lesson_id}/subtitles",
    response_model=List[AdminSubtitleOut],
    dependencies=[Depends(write_rate_limit)],
)
async def admin_replace_lesson_subtitles(
    lesson_id: int,
    payload: List[AdminSubtitleIn],
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    _ = current_user
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise not_found("Lesson")

    await db.execute(delete(LessonSubtitle).where(LessonSubtitle.lesson_id == lesson_id))
    for item in payload:
        if item.timestamp_end < item.timestamp_start:
            raise bad_request("Subtitle end time must be after start time")
        db.add(
            LessonSubtitle(
                lesson_id=lesson_id,
                lang_code=item.lang_code.strip() or "zh-fa",
                text=item.text.strip(),
                timestamp_start=item.timestamp_start,
                timestamp_end=item.timestamp_end,
            )
        )
    await db.commit()
    return await admin_lesson_subtitles(lesson_id, db, current_user)


@router.put(
    "/lessons/{lesson_id}/word-maps",
    response_model=List[AdminLessonWordMapOut],
    dependencies=[Depends(write_rate_limit)],
)
async def admin_replace_lesson_word_maps(
    lesson_id: int,
    payload: List[AdminLessonWordMapIn],
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    _ = current_user
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise not_found("Lesson")

    word_ids = [item.word_id for item in payload]
    if word_ids:
        existing_ids = set(
            (
                await db.execute(select(DictionaryWord.id).where(DictionaryWord.id.in_(word_ids)))
            ).scalars().all()
        )
        missing_ids = sorted(set(word_ids) - existing_ids)
        if missing_ids:
            raise bad_request(f"Unknown dictionary word ids: {missing_ids}")

    await db.execute(delete(LessonWordMap).where(LessonWordMap.lesson_id == lesson_id))
    for item in payload:
        db.add(LessonWordMap(lesson_id=lesson_id, word_id=item.word_id, timestamp=item.timestamp))
    await db.commit()

    result = await db.execute(
        select(LessonWordMap)
        .options(selectinload(LessonWordMap.word))
        .where(LessonWordMap.lesson_id == lesson_id)
        .order_by(LessonWordMap.timestamp, LessonWordMap.id)
    )
    return result.scalars().all()
