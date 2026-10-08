from typing import Annotated, Any, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import insert

from app.api import deps
from app.api.errors import not_found
from app.api.pagination import PaginationParams, pagination_params
from app.models.dictionary import DictionaryWord
from app.models.leitner import UserFlashcard, UserKnownWord
from app.models.user import User
from app.api.rate_limit import write_rate_limit

router = APIRouter()


class WordDefinitionSchema(BaseModel):
    id: int
    lang_code: str
    definition_text: str
    part_of_speech: str
    sense_order: int = 1
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WordExampleSchema(BaseModel):
    id: int
    zh_text: str
    pinyin: str
    target_text: str
    sense_order: int = 1

    model_config = ConfigDict(from_attributes=True)


class WordCollocationSchema(BaseModel):
    id: int
    phrase_zh: str
    phrase_pinyin: str
    translation_target: str
    sense_order: int = 1

    model_config = ConfigDict(from_attributes=True)


class VocabularyWordResponse(BaseModel):
    id: int
    chinese: str
    pinyin: str
    audio_url: Optional[str] = None
    audio_pinyin: Optional[str] = None
    level: str
    hsk_level: Optional[int] = None
    source: str = "manual"
    source_word_id: Optional[str] = None
    status: str = "published"
    persian_meaning: Optional[str] = None
    chinese_meaning: Optional[str] = None
    composition: Optional[str] = None
    notes: Optional[str] = None
    definitions: List[WordDefinitionSchema] = Field(default_factory=list)
    examples: List[WordExampleSchema] = Field(default_factory=list)
    collocations: List[WordCollocationSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class VocabularyMatchRequest(BaseModel):
    texts: List[str] = Field(min_length=1, max_length=300)


class VocabularyMatchResponse(BaseModel):
    matches: List[List[str]]


class VocabularyKnowledgeRequest(BaseModel):
    words: List[Annotated[str, Field(min_length=1, max_length=80)]] = Field(max_length=5000)


async def vocabulary_knowledge(db: AsyncSession, user_id: int, words: List[str]) -> dict[str, str]:
    rows = (await db.execute(
        select(DictionaryWord.chinese, UserFlashcard.word_id, UserKnownWord.word_id)
        .outerjoin(UserFlashcard, (UserFlashcard.word_id == DictionaryWord.id) & (UserFlashcard.user_id == user_id))
        .outerjoin(UserKnownWord, (UserKnownWord.word_id == DictionaryWord.id) & (UserKnownWord.user_id == user_id))
        .where(DictionaryWord.status == "published", DictionaryWord.chinese.in_(words))
    )).all()
    return {chinese: "leitner" if card else "known" if known else "new" for chinese, card, known in rows}


@router.post("/knowledge")
async def read_vocabulary_knowledge(
    payload: VocabularyKnowledgeRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return {"states": await vocabulary_knowledge(db, current_user.id, payload.words)}


@router.post("/known", dependencies=[Depends(write_rate_limit)])
async def mark_vocabulary_known(
    payload: VocabularyKnowledgeRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Keep words explicitly chosen for Leitner review in their existing boxes.
    word_ids = (await db.scalars(
        select(DictionaryWord.id).where(
            DictionaryWord.status == "published",
            DictionaryWord.chinese.in_(payload.words),
            ~select(UserFlashcard.word_id).where(
                UserFlashcard.word_id == DictionaryWord.id,
                UserFlashcard.user_id == current_user.id,
            ).exists(),
        )
    )).all()
    if word_ids:
        await db.execute(insert(UserKnownWord).values([
            {"user_id": current_user.id, "word_id": word_id} for word_id in word_ids
        ]).on_conflict_do_nothing(index_elements=["user_id", "word_id"]))
    await db.commit()
    return {"states": await vocabulary_knowledge(db, current_user.id, payload.words)}


def _word_options():
    return (
        selectinload(DictionaryWord.definitions),
        selectinload(DictionaryWord.examples),
        selectinload(DictionaryWord.collocations),
    )


@router.post("/matches", response_model=VocabularyMatchResponse)
async def match_vocabulary_words(
    payload: VocabularyMatchRequest,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Return curated dictionary words found inside each subtitle cue."""
    clean_texts = [text.strip() for text in payload.texts]
    result = await db.execute(
        select(DictionaryWord.chinese)
        .where(DictionaryWord.status == "published")
        .order_by(func.length(DictionaryWord.chinese).desc(), DictionaryWord.id)
    )
    dictionary_words = [word for word in result.scalars().all() if word]

    return {
        "matches": [
            [word for word in dictionary_words if word in text]
            for text in clean_texts
        ]
    }


@router.get("/{word}", response_model=VocabularyWordResponse)
async def get_vocabulary_word(
    word: str,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get vocabulary word details by exact Chinese word from the curated dictionary.
    """
    clean_word = word.strip()
    result = await db.execute(
        select(DictionaryWord)
        .options(*_word_options())
        .where(DictionaryWord.chinese == clean_word)
        .where(DictionaryWord.status == "published")
    )
    dictionary_word = result.scalars().unique().one_or_none()
    if not dictionary_word:
        raise not_found("Vocabulary word")
    return dictionary_word


@router.get("/", response_model=List[VocabularyWordResponse])
async def search_vocabulary(
    q: str = Query(..., min_length=1, max_length=80),
    level: Optional[str] = Query(default=None, max_length=80),
    hsk_level: Optional[int] = Query(default=None, ge=1, le=9),
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
) -> Any:
    """
    Search curated vocabulary words.
    """
    term = f"%{q.strip()}%"
    query = (
        select(DictionaryWord)
        .options(*_word_options())
        .where(DictionaryWord.status == "published")
        .where(
            or_(
                DictionaryWord.chinese.ilike(term),
                DictionaryWord.pinyin.ilike(term),
                DictionaryWord.persian_meaning.ilike(term),
                DictionaryWord.chinese_meaning.ilike(term),
            )
        )
    )
    if level:
        query = query.where(DictionaryWord.level == level.strip())
    if hsk_level:
        query = query.where(DictionaryWord.hsk_level == hsk_level)

    result = await db.execute(
        query.order_by(DictionaryWord.hsk_level, DictionaryWord.id)
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    return result.scalars().unique().all()
