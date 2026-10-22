from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select

from app.api.v1.endpoints.admin import AdminDictionaryWordIn, AdminWordDefinitionIn, AdminWordExampleIn
from app.db.session import SessionLocal
from app.main import app
from app.models.dictionary import DictionaryWord, WordDefinition, WordExample
from app.models.leitner import UserFlashcard
from app.models.user import User
from scripts.sync_dictionary import publish_missing_words

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_dictionary_publication_is_idempotent_and_preserves_user_study_data():
    suffix = uuid4().hex
    existing_chinese, new_chinese = f"原词-{suffix}", f"新词-{suffix}"
    deadline = datetime.now(UTC) + timedelta(days=7)
    async with SessionLocal.begin() as db:
        user = User(email=f"dictionary-{suffix}@example.com", phone=f"09{uuid4().int % 10**9:09d}", password_hash="isolated-test-only")
        word = DictionaryWord(chinese=existing_chinese, pinyin="yuán cí", level="HSK3", source="manual", status="published", audio_url="/uploads/pronunciation.wav")
        db.add_all([user, word])
        await db.flush()
        definition = WordDefinition(word_id=word.id, lang_code="fa", definition_text="معنی ویرایش‌شدهٔ قبلی", part_of_speech="اسم", sense_order=1)
        card = UserFlashcard(user_id=user.id, word_id=word.id, box_number=4, next_review_at=deadline)
        db.add_all([definition, card])
        await db.flush()
        old_id, definition_id, card_id = word.id, definition.id, card.id

    payloads = [
        AdminDictionaryWordIn(chinese=existing_chinese, pinyin="new value", level="HSK4"),
        AdminDictionaryWordIn(chinese=new_chinese, pinyin="xīn cí", level="HSK7-9", definitions=[
            AdminWordDefinitionIn(definition_text="لغت تازه", part_of_speech="اسم"),
        ], examples=[AdminWordExampleIn(zh_text="一个新词。", pinyin="Yí ge xīn cí.", target_text="یک لغت تازه.")]),
    ]
    async with SessionLocal.begin() as db:
        assert await publish_missing_words(db, payloads) == 1
    async with SessionLocal.begin() as db:
        assert await publish_missing_words(db, payloads) == 0

    async with SessionLocal() as db:
        word = await db.get(DictionaryWord, old_id)
        assert word.audio_url == "/uploads/pronunciation.wav"
        assert word.level == "HSK3" and word.pinyin == "yuán cí"
        assert (await db.get(WordDefinition, definition_id)).definition_text == "معنی ویرایش‌شدهٔ قبلی"
        card = await db.get(UserFlashcard, card_id)
        assert card.word_id == old_id and card.box_number == 4 and card.next_review_at == deadline
        new_id = await db.scalar(select(DictionaryWord.id).where(DictionaryWord.chinese == new_chinese))
        assert await db.scalar(select(func.count(WordDefinition.id)).where(WordDefinition.word_id == new_id)) == 1
        assert await db.scalar(select(func.count(WordExample.id)).where(WordExample.word_id == new_id)) == 1

    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        detail = await client.get(f"/api/v1/vocabulary/{new_chinese}")
        assert detail.status_code == 200, detail.text
        assert detail.json()["level"] == "HSK7-9" and detail.json()["hsk_level"] is None
        assert detail.json()["examples"][0]["target_text"] == "یک لغت تازه."
        search = await client.get("/api/v1/vocabulary/", params={"q": new_chinese, "level": "HSK7-9"})
        assert [item["id"] for item in search.json()] == [new_id]
