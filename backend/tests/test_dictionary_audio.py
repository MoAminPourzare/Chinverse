import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.paths import DICTIONARY_AUDIO_DIR
from app.main import app
from scripts import dictionary_audio as audio
from scripts.import_dictionary_audio import publication_entries


def test_audio_catalog_covers_every_unique_word_and_distinguishes_true_readings():
    words, digest = audio.read_catalog()
    catalog = {word["chinese"]: word for word in words}
    assert len(catalog) == 11630
    assert len(digest) == 64
    assert set(catalog["只"]["pinyins"]) == {"zhī", "zhǐ"}
    assert "multiple_readings" in catalog["只"]["review_reasons"]
    assert "multiple_readings" not in catalog["北"]["review_reasons"]
    assert audio.reading_key("dōng xī") == audio.reading_key("dōngxī")
    assert audio.job_key(catalog["只"], rate="-10%") != audio.job_key(catalog["只"], rate="+0%")


def test_catalog_digest_survives_checkout_line_endings_but_detects_content_changes(tmp_path):
    expected_words, expected_digest = audio.read_catalog()
    for ending in (b"\n", b"\r\n"):
        for source in audio.CATALOG_DIR.glob("*.csv"):
            content = source.read_bytes().replace(b"\r\n", b"\n")
            (tmp_path / source.name).write_bytes(content.replace(b"\n", ending))
        assert audio.read_catalog(tmp_path) == (expected_words, expected_digest)
    changed = tmp_path / "hsk1_words_dictionary.csv"
    changed.write_bytes(changed.read_bytes().replace("爸爸".encode(), "妈妈".encode(), 1))
    assert audio.read_catalog(tmp_path)[1] != expected_digest


def bundle(tmp_path, monkeypatch, sensitive=False):
    for name in ("audio", "records", "temporary"):
        (tmp_path / name).mkdir(exist_ok=True)
    monkeypatch.setattr(audio, "inspect_mp3", lambda path: {"duration_seconds": 1.2})
    word = {"chinese": "只" if sensitive else "你好", "pinyins": ["zhī", "zhǐ"] if sensitive else ["nǐhǎo"],
            "meanings": ["سلام"], "level": "HSK1", "review_reasons": ["multiple_readings"] if sensitive else []}
    source = tmp_path / "sample.mp3"
    source.write_bytes(b"dictionary-audio-test-content")
    record = audio.save_record(tmp_path, word, source, "test", audio.VOICE, audio.RATE)
    audio.write_report(tmp_path, [word], "catalog-test", audio.VOICE, audio.RATE)
    return word, record


def test_resume_rejects_a_corrupt_file_and_keeps_voice_profiles_separate(tmp_path, monkeypatch):
    word, record = bundle(tmp_path, monkeypatch)
    assert audio.saved_record(tmp_path, word, audio.VOICE, audio.RATE)["sha256"] == record["sha256"]
    assert audio.saved_record(tmp_path, word, audio.VOICE, "+0%") is None
    (tmp_path / record["audio_file"]).write_bytes(b"truncated")
    assert audio.saved_record(tmp_path, word, audio.VOICE, audio.RATE) is None


def test_publication_requires_approval_for_the_exact_sensitive_clip(tmp_path, monkeypatch):
    _, record = bundle(tmp_path, monkeypatch, sensitive=True)
    entries, counts = publication_entries(tmp_path)
    assert not entries
    assert counts["pending_pronunciation_review"] == 1
    approvals = tmp_path / "approvals.json"
    for digest, pinyin, expected in [("0" * 64, "zhī", 0), (record["sha256"], "nǐ", 0),
                                     (record["sha256"], "zhǐ", 1)]:
        approvals.write_text(json.dumps({"version": 1, "approvals": [
            {"chinese": "只", "sha256": digest, "approved_pinyin": pinyin}]}), encoding="utf-8")
        assert len(publication_entries(tmp_path, approvals)[0]) == expected


def test_publication_refuses_incomplete_or_untrusted_paths(tmp_path, monkeypatch):
    _, record = bundle(tmp_path, monkeypatch)
    index_path = tmp_path / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    index["words"].append({"chinese": "未完成", "pinyins": ["wèiwánchéng"], "status": "missing"})
    audio.atomic_json(index_path, index)
    with pytest.raises(ValueError, match="incomplete"):
        publication_entries(tmp_path)
    assert len(publication_entries(tmp_path, allow_partial=True)[0]) == 1
    index["words"] = [{**record, "audio_file": "../sample.mp3"}]
    audio.atomic_json(index_path, index)
    with pytest.raises(ValueError, match="path"):
        publication_entries(tmp_path)


@pytest.mark.asyncio
async def test_generation_resumes_without_repeating_requests_and_retries_failed_words(tmp_path, monkeypatch):
    word, _ = bundle(tmp_path, monkeypatch)
    pending = {**word, "chinese": "谢谢", "pinyins": ["xièxie"]}
    attempts = []

    class Communicate:
        def __init__(self, chinese, *args, **kwargs):
            attempts.append(chinese)

        async def save(self, filename):
            if len(attempts) == 1:
                raise ConnectionError("temporary failure")
            Path(filename).write_bytes(b"new-audio-test-content")

    async def no_delay(_seconds):
        return None
    monkeypatch.setitem(__import__("sys").modules, "edge_tts", SimpleNamespace(Communicate=Communicate))
    monkeypatch.setattr(audio.asyncio, "sleep", no_delay)
    args = SimpleNamespace(output=tmp_path, existing_dir=None, voice=audio.VOICE, rate=audio.RATE,
        report_only=False, limit=0, workers=1, retries=2, timeout=10)
    result = await audio.generate(args, [word, pending], "catalog-test")
    assert result["ready"] == 2
    assert attempts == ["谢谢", "谢谢"]
    await audio.generate(args, [word, pending], "catalog-test")
    assert attempts == ["谢谢", "谢谢"]


@pytest.mark.asyncio
async def test_dictionary_audio_is_public_with_range_and_immutable_cache():
    path = DICTIONARY_AUDIO_DIR / "range-test.mp3"
    path.write_bytes(b"range-test-content")
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
            response = await client.get("/uploads/dictionary-audio/range-test.mp3", headers={"Range": "bytes=0-4"})
            assert response.status_code == 206
            assert response.content == b"range"
            assert response.headers["content-type"] in {"audio/mpeg", "audio/mp3"}
            assert "immutable" in response.headers["cache-control"]
            assert (await client.get("/uploads/dictionary-audio/../videos/private.mp4")).status_code == 404
    finally:
        path.unlink(missing_ok=True)
