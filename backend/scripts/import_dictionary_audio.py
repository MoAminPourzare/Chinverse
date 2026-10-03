"""Publish a completed offline audio bundle without recreating dictionary words or study cards."""
import argparse
import asyncio
from collections import Counter
import json
from pathlib import Path
import re
import shutil

from sqlalchemy import select, text, update

from app.core.paths import DICTIONARY_AUDIO_DIR
from app.core.storage import StoredFile, persist_stored_file
from app.db.session import SessionLocal, engine
from app.models.dictionary import DictionaryWord
from scripts.dictionary_audio import file_digest, reading_key, split_readings


def publication_entries(directory, approvals=None, allow_partial=False):
    directory = Path(directory).resolve()
    index = json.loads((directory / "index.json").read_text(encoding="utf-8"))
    if index.get("version") != 1:
        raise ValueError("Unsupported audio index version")
    words = index["words"]
    if not allow_partial and any(word.get("status") != "ready" for word in words):
        raise ValueError("Audio generation is incomplete; use --allow-partial only for an intentional beta batch")
    review = {}
    if approvals:
        payload = json.loads(Path(approvals).read_text(encoding="utf-8"))
        if payload.get("version") != 1:
            raise ValueError("Unsupported approvals version")
        for item in payload["approvals"]:
            if item["chinese"] in review:
                raise ValueError("Duplicate pronunciation approval")
            review[item["chinese"]] = item
    eligible = []
    counts = Counter()
    seen = set()
    for word in words:
        chinese = word["chinese"]
        if not chinese or chinese in seen or not word.get("pinyins"):
            raise ValueError("Duplicate or invalid word in audio index")
        seen.add(chinese)
        if word.get("status") != "ready":
            counts["missing"] += 1
            continue
        digest = word["sha256"]
        if not re.fullmatch(r"[a-f0-9]{64}", digest) or word["audio_file"] != f"audio/{digest}.mp3":
            raise ValueError("Invalid audio path or digest")
        source = (directory / word["audio_file"]).resolve()
        if not source.is_relative_to(directory) or file_digest(source) != digest:
            raise ValueError(f"Audio integrity check failed for {chinese}")
        approval = review.get(chinese)
        verified = bool(approval and approval.get("sha256") == digest and
            reading_key(approval.get("approved_pinyin", "")) in {reading_key(p) for p in word["pinyins"]})
        if word.get("review_reasons") and not verified:
            counts["pending_pronunciation_review"] += 1
            continue
        eligible.append({**word, "source_path": source})
    counts["eligible"] = len(eligible)
    return eligible, counts


async def publish_audio(db, entries, *, dry_run=False):
    counts = Counter()
    if not dry_run:
        await db.execute(text("SELECT pg_advisory_xact_lock(741025320)"))
    matching = await db.scalars(select(DictionaryWord).where(
        DictionaryWord.chinese.in_([entry["chinese"] for entry in entries])))
    words = {word.chinese: word for word in matching.all()}
    for entry in entries:
        word = words.get(entry["chinese"])
        if word is None or word.status != "published":
            counts["not_in_published_dictionary"] += 1
            continue
        current_readings = {reading_key(p) for p in split_readings(word.pinyin)}
        if current_readings != {reading_key(p) for p in entry["pinyins"]}:
            counts["pinyin_changed"] += 1
            continue
        # Preserve any existing curated recording, including on repeated runs.
        if word.audio_url:
            counts["existing_audio_preserved"] += 1
            continue
        if dry_run:
            counts["would_publish"] += 1
            continue
        filename = f"{entry['sha256']}.mp3"
        DICTIONARY_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        destination = DICTIONARY_AUDIO_DIR / filename
        if destination.exists() and file_digest(destination) != entry["sha256"]:
            raise ValueError("A stored immutable audio asset has an unexpected digest")
        if not destination.exists():
            temporary = destination.with_suffix(".partial")
            shutil.copyfile(entry["source_path"], temporary)
            if file_digest(temporary) != entry["sha256"]:
                temporary.unlink(missing_ok=True)
                raise ValueError("Audio changed while copying into storage")
            temporary.replace(destination)
        stored = StoredFile(public_url=f"/uploads/dictionary-audio/{filename}",
            storage_key=f"uploads/dictionary-audio/{filename}", filename=filename,
            content_type="audio/mpeg", size_bytes=destination.stat().st_size, extension=".mp3")
        stored = await persist_stored_file(stored, destination_dir=DICTIONARY_AUDIO_DIR)
        # An admin edit during file storage must never be overwritten by a stale snapshot.
        result = await db.execute(update(DictionaryWord).where(
            DictionaryWord.id == word.id, DictionaryWord.pinyin == word.pinyin,
            DictionaryWord.status == "published", DictionaryWord.audio_url == word.audio_url,
        ).values(audio_url=stored.public_url).execution_options(synchronize_session=False))
        counts["published" if result.rowcount == 1 else "changed_during_publication"] += 1
    return counts


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", required=True, type=Path)
    parser.add_argument("--approvals", type=Path)
    parser.add_argument("--allow-partial", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    entries, counts = publication_entries(args.directory, args.approvals, args.allow_partial)
    try:
        for offset in range(0, len(entries), 100):
            async with SessionLocal.begin() as db:
                counts.update(await publish_audio(db, entries[offset:offset + 100], dry_run=args.dry_run))
        print(json.dumps(dict(counts), ensure_ascii=False, sort_keys=True))
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
