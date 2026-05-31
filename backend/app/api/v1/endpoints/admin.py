import csv
import io
import json
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
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
from app.models.dictionary import (
    DictionaryWord,
    WordCollocation,
    WordDefinition,
    WordExample,
)
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


class AdminAccessOut(BaseModel):
    is_admin: bool
    email: str


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


class AdminDictionaryImportError(BaseModel):
    row: int
    chinese: Optional[str] = None
    error: str


class AdminDictionaryImportResult(BaseModel):
    created: int
    updated: int
    failed: int
    imported_words: List[AdminDictionaryWordOut] = Field(default_factory=list)
    errors: List[AdminDictionaryImportError] = Field(default_factory=list)


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


def _text(value: Any, default: str = "") -> str:
    if value is None:
        return default
    return str(value).strip()


def _items(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def _dictionary_payload_from_record(data: dict[str, Any]) -> AdminDictionaryWordIn:
    if not isinstance(data, dict):
        raise bad_request("Dictionary import item must be an object")

    chinese = _text(data.get("chinese"))
    if not chinese:
        raise bad_request("Dictionary import item is missing chinese")

    definitions = [
        AdminWordDefinitionIn(
            lang_code=_text(item.get("lang_code"), "fa") or "fa",
            definition_text=_text(item.get("definition_text")),
            part_of_speech=_text(item.get("part_of_speech"), "unknown") or "unknown",
        )
        for item in _items(data.get("definitions"))
        if _text(item.get("definition_text"))
    ]
    examples = [
        AdminWordExampleIn(
            zh_text=_text(item.get("zh_text")),
            pinyin=_text(item.get("pinyin")),
            target_text=_text(item.get("target_text")),
        )
        for item in _items(data.get("examples"))
        if _text(item.get("zh_text"))
    ]
    collocations = [
        AdminWordCollocationIn(
            phrase_zh=_text(item.get("phrase_zh")),
            phrase_pinyin=_text(item.get("phrase_pinyin")),
            translation_target=_text(item.get("translation_target")),
        )
        for item in _items(data.get("collocations"))
        if _text(item.get("phrase_zh"))
    ]

    return AdminDictionaryWordIn(
        chinese=chinese,
        pinyin=_text(data.get("pinyin")),
        audio_url=_clean_optional(_text(data.get("audio_url"))),
        level=_text(data.get("level"), "custom") or "custom",
        persian_meaning=_clean_optional(_text(data.get("persian_meaning"))),
        chinese_meaning=_clean_optional(_text(data.get("chinese_meaning"))),
        composition=_clean_optional(_text(data.get("composition"))),
        definitions=definitions,
        examples=examples,
        collocations=collocations,
    )


def _split_import_rows(value: str) -> list[str]:
    return [item.strip() for item in value.split(";;") if item.strip()]


def _parse_json_list(value: str) -> list[dict[str, Any]] | None:
    clean_value = value.strip()
    if not clean_value or not clean_value.startswith("["):
        return None
    parsed = json.loads(clean_value)
    if not isinstance(parsed, list):
        raise ValueError("JSON field must be a list")
    return [item for item in parsed if isinstance(item, dict)]


def _dictionary_payload_from_csv_row(row: dict[str, Any]) -> AdminDictionaryWordIn:
    data = {str(key or "").strip(): _text(value) for key, value in row.items()}

    definitions_json = _parse_json_list(data.get("definitions", ""))
    examples_json = _parse_json_list(data.get("examples", ""))
    collocations_json = _parse_json_list(data.get("collocations", ""))

    definitions = definitions_json if definitions_json is not None else [
        {
            "part_of_speech": parts[0] if len(parts) > 1 else "unknown",
            "definition_text": parts[1] if len(parts) > 1 else parts[0],
            "lang_code": parts[2] if len(parts) > 2 else "fa",
        }
        for parts in ([part.strip() for part in item.split("|")] for item in _split_import_rows(data.get("definitions", "")))
        if parts and (parts[1] if len(parts) > 1 else parts[0])
    ]
    examples = examples_json if examples_json is not None else [
        {
            "zh_text": parts[0],
            "pinyin": parts[1] if len(parts) > 1 else "",
            "target_text": parts[2] if len(parts) > 2 else "",
        }
        for parts in ([part.strip() for part in item.split("|")] for item in _split_import_rows(data.get("examples", "")))
        if parts and parts[0]
    ]
    collocations = collocations_json if collocations_json is not None else [
        {
            "phrase_zh": parts[0],
            "phrase_pinyin": parts[1] if len(parts) > 1 else "",
            "translation_target": parts[2] if len(parts) > 2 else "",
        }
        for parts in ([part.strip() for part in item.split("|")] for item in _split_import_rows(data.get("collocations", "")))
        if parts and parts[0]
    ]

    return _dictionary_payload_from_record(
        {
            **data,
            "definitions": definitions,
            "examples": examples,
            "collocations": collocations,
        }
    )


def _parse_dictionary_import_file(filename: str, raw_content: bytes) -> list[dict[str, Any]]:
    try:
        content = raw_content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise bad_request("Dictionary import file must be UTF-8 encoded") from error

    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if suffix == "json":
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as error:
            raise bad_request("JSON import file is not valid JSON") from error
        if isinstance(parsed, dict):
            parsed = parsed.get("words")
        if not isinstance(parsed, list):
            raise bad_request("JSON import file must be a list or an object with words[]")
        return [item for item in parsed if isinstance(item, dict)]

    if suffix != "csv":
        raise bad_request("Dictionary import file must be .csv or .json")

    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise bad_request("CSV import file must include a header row")
    return [dict(row) for row in reader]


async def _upsert_dictionary_word(
    db: AsyncSession,
    payload: AdminDictionaryWordIn,
) -> DictionaryWord:
    chinese = payload.chinese.strip()
    if not chinese:
        raise bad_request("Chinese word cannot be empty")

    result = await db.execute(select(DictionaryWord).where(DictionaryWord.chinese == chinese))
    word = result.scalar_one_or_none()
    if not word:
        word = DictionaryWord(chinese=chinese, pinyin="", level="custom")
        db.add(word)
        await db.flush()

    word.chinese = chinese
    word.pinyin = payload.pinyin.strip()
    word.audio_url = _clean_optional(payload.audio_url)
    word.level = payload.level.strip() or "custom"
    word.persian_meaning = _clean_optional(payload.persian_meaning)
    word.chinese_meaning = _clean_optional(payload.chinese_meaning)
    word.composition = _clean_optional(payload.composition)
    await _replace_word_children(db, word, payload)
    await db.flush()
    return word


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


@router.get("/me", response_model=AdminAccessOut)
async def admin_me(
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    return {"is_admin": True, "email": current_user.email}


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


@router.post(
    "/dictionary/import",
    response_model=AdminDictionaryImportResult,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(write_rate_limit)],
)
async def admin_import_dictionary_words(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    _ = current_user
    raw_content = await file.read()
    if not raw_content:
        raise bad_request("Dictionary import file is empty")

    rows = _parse_dictionary_import_file(file.filename or "", raw_content)
    if not rows:
        raise bad_request("Dictionary import file did not include any rows")

    created = 0
    updated = 0
    errors: list[AdminDictionaryImportError] = []
    imported_ids: list[int] = []

    is_csv = (file.filename or "").lower().endswith(".csv")
    start_index = 2 if is_csv else 1

    for index, row in enumerate(rows, start=start_index):
        chinese = _text(row.get("chinese"))
        try:
            payload = _dictionary_payload_from_csv_row(row) if is_csv else _dictionary_payload_from_record(row)
            existed = await db.scalar(select(DictionaryWord.id).where(DictionaryWord.chinese == payload.chinese.strip()))
            word = await _upsert_dictionary_word(db, payload)
            imported_ids.append(word.id)
            if existed:
                updated += 1
            else:
                created += 1
        except Exception as error:
            errors.append(AdminDictionaryImportError(row=index, chinese=chinese or None, error=str(error)))

    await db.commit()

    imported_words = [
        await _get_word(db, word_id)
        for word_id in imported_ids
    ]
    return {
        "created": created,
        "updated": updated,
        "failed": len(errors),
        "imported_words": imported_words,
        "errors": errors,
    }


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
