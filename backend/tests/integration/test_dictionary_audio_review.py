"""Protect pending pronunciations, admin review and persistent study data."""
from uuid import uuid4

from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient
import pytest
from sqlalchemy import select

from app.api import deps
from app.db.session import SessionLocal
from app.main import app
from app.models.dictionary import DictionaryAudio, DictionaryWord
from app.models.user import User, UserRole
from app.services.dictionary_audio import review_recording
from scripts.dictionary_audio import file_digest
from scripts.sync_dictionary_audio import import_batch

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_generated_audio_review_is_persistent_exact_and_preserves_curated_audio(tmp_path):
    suffix = uuid4().hex
    source = tmp_path / "clip.mp3"
    source.write_bytes(b"isolated-audio-review-test")
    digest = file_digest(source)
    async with SessionLocal.begin() as db:
        admin = User(email=f"audio-review-{suffix}@example.com", phone=f"09{uuid4().int % 10**9:09d}", password_hash="test-only", role=UserRole.ADMIN)
        words = [DictionaryWord(chinese=f"敏-{suffix}", pinyin="zhī/zhǐ", level="HSK1"),
                 DictionaryWord(chinese=f"普通-{suffix}", pinyin="pǔtōng", level="HSK2"),
                 DictionaryWord(chinese=f"旧-{suffix}", pinyin="jiù", level="HSK3", audio_url="https://example.com/curated.mp3")]
        db.add_all([admin, *words])
        await db.flush()
        admin_id = admin.id
        ids = [word.id for word in words]
        entries = [{"chinese": word.chinese, "pinyins": word.pinyin.split("/"), "sha256": digest,
                    "source_path": source, "bundle_sha256": "0" * 64, "voice": "test",
                    "duration_seconds": 1.2, "review_reasons": ["multiple_readings"] if i == 0 else []}
                   for i, word in enumerate(words)]
        counts = await import_batch(db, entries)
        assert counts["imported"] == 3 and counts["published"] == 1 and counts["existing_audio_preserved"] == 1
    async with SessionLocal.begin() as db:
        assert (await import_batch(db, entries))["already_imported"] == 3
        pending = await db.scalar(select(DictionaryAudio).where(DictionaryAudio.word_id == ids[0]))
        clip_id = pending.id
        assert pending.status == "pending" and (await db.get(DictionaryWord, ids[0])).audio_url is None
        for sha, pinyin, code in [("f" * 64, "zhī", 409), (digest, "nǐ", 400)]:
            with pytest.raises(HTTPException) as caught:
                await review_recording(db, clip_id, sha256=sha, decision="approved", approved_pinyin=pinyin, actor_id=admin_id)
            assert caught.value.status_code == code
        await review_recording(db, clip_id, sha256=digest, decision="approved", approved_pinyin="zhǐ", actor_id=admin_id)
    async with SessionLocal.begin() as db:
        word = await db.get(DictionaryWord, ids[0])
        clip = await db.get(DictionaryAudio, clip_id)
        assert word.audio_url == clip.audio_url and word.audio_pinyin == "zhǐ"
        assert clip.reviewed_by == admin_id and clip.reviewed_at and clip.status == "approved"
        assert word.pinyin == "zhī/zhǐ"
        await review_recording(db, clip_id, sha256=digest, decision="rejected", approved_pinyin=None, actor_id=admin_id)
        assert word.audio_url is None and word.audio_pinyin is None
        curated = await db.scalar(select(DictionaryAudio).where(DictionaryAudio.word_id == ids[2]))
        with pytest.raises(HTTPException) as caught:
            await review_recording(db, curated.id, sha256=digest, decision="approved", approved_pinyin="jiù", actor_id=admin_id)
        assert caught.value.status_code == 409
        await review_recording(db, curated.id, sha256=digest, decision="rejected", approved_pinyin=None, actor_id=admin_id)
        assert (await db.get(DictionaryWord, ids[2])).audio_url == "https://example.com/curated.mp3"
        word.pinyin = "changed"
        await db.flush()
        with pytest.raises(HTTPException) as caught:
            await review_recording(db, clip_id, sha256=digest, decision="approved", approved_pinyin="zhī", actor_id=admin_id)
        assert caught.value.status_code == 409
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        assert (await client.get("/api/v1/admin/dictionary-audio")).status_code == 401
        assert (await client.post(f"/api/v1/admin/dictionary-audio/{clip_id}/review", json={"sha256": digest, "decision": "rejected"})).status_code == 401
        normal = User(id=admin_id, role=UserRole.USER, email="normal@example.com", phone="09123456789", password_hash="test")

        async def current():
            return normal

        app.dependency_overrides[deps.get_current_user] = current
        try:
            assert (await client.get("/api/v1/admin/dictionary-audio")).status_code == 403
            normal.role = UserRole.ADMIN
            normal.mfa_enabled = False
            assert (await client.get("/api/v1/admin/dictionary-audio")).status_code == 403
            normal.mfa_enabled = True
            normal._auth_mfa_verified = True
            page = await client.get("/api/v1/admin/dictionary-audio", params={"q": suffix, "state": "all", "multiple": True})
            assert page.status_code == 200, page.text
            assert page.json()["total"] == 1
            assert page.json()["items"][0]["stale"] is True
        finally:
            app.dependency_overrides.clear()
