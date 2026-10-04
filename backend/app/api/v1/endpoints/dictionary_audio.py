from typing import Literal
import json

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.rate_limit import write_rate_limit
from app.core.paths import BACKEND_DIR
from app.models.dictionary import DictionaryAudio, DictionaryWord
from app.models.user import User
from app.services.auth_security import add_audit_event
from app.services.dictionary_audio import current_readings, reading_key, review_recording

router = APIRouter(prefix="/admin/dictionary-audio", tags=["admin"])
manifest_path = BACKEND_DIR / "data" / "dictionary-audio-release.json"
EXPECTED_RECORDINGS = json.loads(manifest_path.read_text("utf-8-sig"))["word_count"] if manifest_path.exists() else 0


class AudioReviewIn(BaseModel):
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    decision: Literal["approved", "rejected"]
    approved_pinyin: str | None = Field(default=None, max_length=200)


def serialize(clip, word):
    return {
        "id": clip.id, "word_id": word.id, "chinese": word.chinese, "pinyin": word.pinyin,
        "level": word.level, "meaning": word.persian_meaning, "audio_url": clip.audio_url,
        "sha256": clip.sha256, "pinyins": clip.pinyins, "review_reasons": clip.review_reasons,
        "status": clip.status, "approved_pinyin": clip.approved_pinyin,
        "duration_seconds": clip.duration_seconds, "reviewed_at": clip.reviewed_at,
        "active": word.audio_url == clip.audio_url,
        "curated_audio_preserved": bool(word.audio_url and word.audio_url != clip.audio_url),
        "stale": word.status != "published" or current_readings(word) != {reading_key(p) for p in clip.pinyins},
    }


@router.get("")
async def list_audio(
    q: str = Query(default="", max_length=80),
    state: Literal["all", "pending", "ready", "approved", "rejected"] = "pending",
    level: str = Query(default="", max_length=30),
    multiple: bool = False,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=30, ge=1, le=100),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    counts = dict((await db.execute(select(DictionaryAudio.status, func.count()).group_by(DictionaryAudio.status))).all())
    query = select(DictionaryAudio, DictionaryWord).join(DictionaryWord, DictionaryWord.id == DictionaryAudio.word_id)
    if state != "all":
        query = query.where(DictionaryAudio.status == state)
    if q.strip():
        term = f"%{q.strip()}%"
        query = query.where(or_(DictionaryWord.chinese.ilike(term), DictionaryWord.pinyin.ilike(term), DictionaryWord.persian_meaning.ilike(term)))
    if level:
        query = query.where(DictionaryWord.level == level)
    if multiple:
        query = query.where(func.json_array_length(DictionaryAudio.pinyins) > 1)
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    rows = (await db.execute(query.order_by(DictionaryWord.hsk_level.asc().nulls_last(), DictionaryWord.id).offset(skip).limit(limit))).all()
    return {"counts": counts, "total": total, "expected": EXPECTED_RECORDINGS,
            "imported": sum(counts.values()), "items": [serialize(clip, word) for clip, word in rows]}


@router.post("/{audio_id}/review", dependencies=[Depends(write_rate_limit)])
async def review_audio(
    audio_id: int, payload: AudioReviewIn, request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    clip, word = await review_recording(db, audio_id, sha256=payload.sha256, decision=payload.decision,
                                      approved_pinyin=payload.approved_pinyin, actor_id=current_user.id)
    await add_audit_event(db, event_type="dictionary.audio_reviewed", request=request,
                         actor_user_id=current_user.id, subject=str(word.id),
                         details={"sha256": clip.sha256, "decision": clip.status, "pinyin": clip.approved_pinyin})
    await db.commit()
    return serialize(clip, word)
