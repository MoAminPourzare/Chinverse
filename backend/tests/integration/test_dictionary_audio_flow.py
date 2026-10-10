"""Database coverage for publishing standalone dictionary pronunciations."""
from uuid import uuid4

import pytest
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.dictionary import DictionaryWord, WordDefinition
from app.models.leitner import UserFlashcard
from app.models.user import User
from scripts.dictionary_audio import file_digest
from scripts.import_dictionary_audio import publish_audio

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_audio_publication_is_idempotent_and_preserves_curated_audio_and_study_cards(tmp_path):
    suffix = uuid4().hex
    source = tmp_path / "sample.mp3"
    source.write_bytes(b"isolated-dictionary-audio-integration-test")
    digest = file_digest(source)
    async with SessionLocal.begin() as db:
        user = User(email=f"audio-{suffix}@example.com", phone=f"09{uuid4().int % 10**9:09d}",
                    password_hash="isolated-test-only")
        word = DictionaryWord(chinese=f"音频-{suffix}", pinyin="yīnpín", level="HSK4", source="manual")
        curated = DictionaryWord(chinese=f"旧音-{suffix}", pinyin="jiùyīn", level="HSK3", source="manual",
                                 audio_url="https://example.com/curated.mp3")
        db.add_all([user, word, curated])
        await db.flush()
        definition = WordDefinition(word_id=word.id, lang_code="fa", definition_text="صدای آزمایشی",
                                    part_of_speech="اسم", sense_order=1)
        card = UserFlashcard(user_id=user.id, word_id=word.id, box_number=4)
        db.add_all([definition, card])
        await db.flush()
        word_id, curated_id, card_id, definition_id = word.id, curated.id, card.id, definition.id
        entries = [{"chinese": word.chinese, "pinyins": ["yīn pín"], "sha256": digest, "source_path": source},
                   {"chinese": curated.chinese, "pinyins": ["jiùyīn"], "sha256": digest, "source_path": source}]
    async with SessionLocal.begin() as db:
        preview = await publish_audio(db, entries, dry_run=True)
        assert preview["would_publish"] == 1
        assert (await db.get(DictionaryWord, word_id)).audio_url is None
        counts = await publish_audio(db, entries)
        assert counts["published"] == 1
        assert counts["existing_audio_preserved"] == 1
    async with SessionLocal.begin() as db:
        again = await publish_audio(db, entries)
        assert again["existing_audio_preserved"] == 2
        saved = await db.get(DictionaryWord, word_id)
        assert saved.audio_url == f"/uploads/dictionary-audio/{digest}.mp3"
        assert saved.pinyin == "yīnpín"
        assert (await db.get(DictionaryWord, curated_id)).audio_url == "https://example.com/curated.mp3"
        assert (await db.get(WordDefinition, definition_id)).definition_text == "صدای آزمایشی"
        study = await db.get(UserFlashcard, card_id)
        assert study.word_id == word_id and study.box_number == 4
        assert len((await db.scalars(select(DictionaryWord).where(DictionaryWord.chinese == saved.chinese))).all()) == 1
