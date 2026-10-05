"""Import a pinned audio release into durable storage; resume using database receipts."""
import argparse
import asyncio
from collections import Counter
import hashlib
import json
import logging
import os
from pathlib import Path
import re
import shutil
import tempfile
from zipfile import ZipFile
from uuid import uuid4

from anyio import to_thread
import httpx
from sqlalchemy import func, select, text

from app.core.config import settings
from app.core.paths import BACKEND_DIR, DICTIONARY_AUDIO_DIR
from app.core.storage import CACHE_CONTROL_IMMUTABLE, get_object_storage_client
from app.db.session import SessionLocal, engine
from app.models.dictionary import DictionaryAudio, DictionaryWord
from app.services.dictionary_audio import current_readings, reading_key
from scripts.dictionary_audio import file_digest, read_catalog

logger = logging.getLogger(__name__)
MANIFEST_PATH = BACKEND_DIR / "data" / "dictionary-audio-release.json"
MAX_BUNDLE_BYTES = 200 * 1024 * 1024
MAX_EXTRACTED_BYTES = 250 * 1024 * 1024


def extract_bundle(path: Path, directory: Path, manifest):
    with ZipFile(path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)) or "index.json" not in names:
            raise ValueError("Duplicate or missing bundle members")
        if sum(item.file_size for item in archive.infolist()) > MAX_EXTRACTED_BYTES:
            raise ValueError("Audio bundle exceeds extraction limit")
        if any(name != "index.json" and not re.fullmatch(r"audio/[a-f0-9]{64}\.mp3", name) for name in names):
            raise ValueError("Unexpected audio bundle path")
        index = json.loads(archive.read("index.json"))
        catalog, catalog_sha = read_catalog()
        if index.get("version") != 1 or index.get("catalog_sha256") != manifest["catalog_sha256"] or manifest.get("canonical_catalog_sha256", manifest["catalog_sha256"]) != catalog_sha:
            raise ValueError("Audio release differs from the current catalog")
        expected = {word["chinese"]: word for word in catalog}
        entries = index["words"]
        if len(entries) != len(expected) or len(entries) != manifest["word_count"]:
            raise ValueError("Incomplete audio release")
        seen = set()
        for entry in entries:
            word = expected.get(entry["chinese"])
            if not word or entry["chinese"] in seen or entry["pinyins"] != word["pinyins"] or entry["review_reasons"] != word["review_reasons"]:
                raise ValueError("Invalid pronunciation metadata")
            seen.add(entry["chinese"])
            if not re.fullmatch(r"[a-f0-9]{64}", entry["sha256"]) or entry["audio_file"] != f"audio/{entry['sha256']}.mp3":
                raise ValueError("Invalid recording digest or path")
            if not 0.2 <= entry["duration_seconds"] <= 30 or not entry.get("voice"):
                raise ValueError("Invalid recording duration or voice")
        if set(names) != {"index.json", *(entry["audio_file"] for entry in entries)}:
            raise ValueError("Unreferenced or missing recordings")
        archive.extractall(directory)  # Every member is an exact allowlisted path above.
    for entry in entries:
        entry["bundle_sha256"] = manifest["sha256"]
        entry["source_path"] = directory / entry["audio_file"]
        if file_digest(entry["source_path"]) != entry["sha256"]:
            raise ValueError("Recording checksum mismatch")
    return entries


def download_bundle(manifest, path):
    # Registry is versioned code, never a URL supplied through a user request.
    if not manifest["url"].startswith("https://github.com/MoAminPourzare/Chinverse/releases/download/"):
        raise ValueError("Unsupported audio release origin")
    digest = hashlib.sha256()
    total = 0
    with httpx.stream("GET", manifest["url"], follow_redirects=True, timeout=90) as response, path.open("wb") as target:
        response.raise_for_status()
        for chunk in response.iter_bytes():
            total += len(chunk)
            if total > MAX_BUNDLE_BYTES:
                raise ValueError("Audio release exceeds size limit")
            digest.update(chunk)
            target.write(chunk)
    if digest.hexdigest() != manifest["sha256"] or total != manifest["size_bytes"]:
        raise ValueError("Audio release checksum mismatch")


def store_recording(entry):
    filename = f"{entry['sha256']}.mp3"
    key = f"uploads/dictionary-audio/{filename}"
    if settings.USES_OBJECT_STORAGE:
        get_object_storage_client().upload_file(str(entry["source_path"]), settings.OBJECT_STORAGE_BUCKET_NAME, key,
            ExtraArgs={"ContentType": "audio/mpeg", "CacheControl": CACHE_CONTROL_IMMUTABLE})
        return f"{settings.OBJECT_STORAGE_PUBLIC_BASE_URL.rstrip('/')}/{key}"
    DICTIONARY_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    destination = DICTIONARY_AUDIO_DIR / filename
    if destination.exists():
        if file_digest(destination) != entry["sha256"]:
            raise ValueError("Stored recording checksum mismatch")
    else:
        temporary = destination.with_name(f".{filename}.{uuid4().hex}.partial")
        try:
            shutil.copyfile(entry["source_path"], temporary)
            if file_digest(temporary) != entry["sha256"]:
                raise ValueError("Recording changed during storage")
            # Publish a complete file without replacing an immutable clip that
            # another worker has already installed (or a player has open).
            try:
                os.link(temporary, destination)
            except FileExistsError:
                if file_digest(destination) != entry["sha256"]:
                    raise ValueError("Stored recording checksum mismatch")
        finally:
            temporary.unlink(missing_ok=True)
    return f"/{key}"


async def import_batch(db, entries):
    await db.execute(text("SELECT pg_advisory_xact_lock(741025320)"))
    words = {word.chinese: word for word in (await db.scalars(select(DictionaryWord).where(
        DictionaryWord.chinese.in_([entry["chinese"] for entry in entries])).with_for_update())).all()}
    existing = {clip.word_id: clip for clip in (await db.scalars(select(DictionaryAudio).where(
        DictionaryAudio.word_id.in_([word.id for word in words.values()])))).all()}
    counts = Counter()
    eligible = []
    for entry in entries:
        word = words.get(entry["chinese"])
        if not word or word.status != "published":
            counts["not_published"] += 1
        elif current_readings(word) != {reading_key(p) for p in entry["pinyins"]}:
            counts["pinyin_changed"] += 1
        elif word.id in existing:
            if existing[word.id].sha256 != entry["sha256"]:
                raise ValueError("A different reviewed bundle is already installed; explicit replacement is required")
            counts["already_imported"] += 1
        else:
            eligible.append((word, entry))
    semaphore = asyncio.Semaphore(6)

    async def upload(entry):
        async with semaphore:
            return await to_thread.run_sync(store_recording, entry)

    unique = {entry["sha256"]: entry for _, entry in eligible}
    urls = dict(zip(unique, await asyncio.gather(*(upload(entry) for entry in unique.values()))))
    for word, entry in eligible:
        url = urls[entry["sha256"]]
        pending = bool(entry["review_reasons"])
        clip = DictionaryAudio(word_id=word.id, sha256=entry["sha256"], bundle_sha256=entry["bundle_sha256"], audio_url=url, pinyins=entry["pinyins"],
            review_reasons=entry["review_reasons"], voice=entry["voice"], duration_seconds=entry["duration_seconds"],
            status="pending" if pending else "ready")
        db.add(clip)
        if not pending and not word.audio_url:
            word.audio_url = url
            word.audio_pinyin = entry["pinyins"][0]
            counts["published"] += 1
        elif word.audio_url:
            counts["existing_audio_preserved"] += 1
        counts["imported"] += 1
    await db.flush()
    return counts


async def sync_release():
    if not MANIFEST_PATH.exists():
        return
    manifest = json.loads(MANIFEST_PATH.read_text("utf-8-sig"))
    async with SessionLocal() as db:
        current = await db.scalar(select(func.count()).select_from(DictionaryAudio).where(
            DictionaryAudio.bundle_sha256 == manifest["sha256"]))
    _, digest = read_catalog()
    if digest != manifest.get("canonical_catalog_sha256", manifest["catalog_sha256"]):
        raise ValueError("Audio manifest is stale")
    # The pinned content index also detects replacements; no download on normal restarts.
    if current == manifest["word_count"]:
        logger.info("Dictionary audio release already imported: %s", current)
        return
    with tempfile.TemporaryDirectory(prefix="chinverse-audio-") as work:
        directory = Path(work)
        await to_thread.run_sync(download_bundle, manifest, directory / "bundle.zip")
        entries = await to_thread.run_sync(extract_bundle, directory / "bundle.zip", directory / "unpacked", manifest)
        counts = Counter()
        for offset in range(0, len(entries), 100):
            async with SessionLocal.begin() as db:
                counts.update(await import_batch(db, entries[offset:offset + 100]))
            logger.info("Dictionary audio import: %s/%s %s", offset + len(entries[offset:offset + 100]), len(entries), dict(counts))


async def run_background_import():
    for attempt in range(4):
        try:
            await sync_release()
            return
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Dictionary audio import failed; completed batches remain resumable")
            if attempt < 3:
                await asyncio.sleep(30 * (attempt + 1))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()

    async def main():
        try:
            await sync_release()
        finally:
            await engine.dispose()

    asyncio.run(main())
