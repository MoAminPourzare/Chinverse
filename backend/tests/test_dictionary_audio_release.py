import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time
from types import SimpleNamespace
from unittest.mock import AsyncMock
from zipfile import ZipFile

import pytest

from scripts import sync_dictionary_audio as release
from scripts.dictionary_audio import file_digest


def test_bundle_rejects_traversal_corruption_and_stale_catalog(tmp_path, monkeypatch):
    catalog = [{"chinese": "只", "pinyins": ["zhī", "zhǐ"], "review_reasons": ["multiple_readings"]}]
    monkeypatch.setattr(release, "read_catalog", lambda: (catalog, "catalog-digest"))
    source = tmp_path / "clip.mp3"
    source.write_bytes(b"isolated-bundle-validation")
    sha = file_digest(source)
    word = {**catalog[0], "sha256": sha, "audio_file": f"audio/{sha}.mp3", "duration_seconds": 1.2, "voice": "test"}
    manifest = {"catalog_sha256": "catalog-digest", "sha256": "0" * 64, "word_count": 1}

    def archive(extra=None, data=b"isolated-bundle-validation", catalog_sha="catalog-digest"):
        path = tmp_path / "bundle.zip"
        with ZipFile(path, "w") as zipfile:
            zipfile.writestr("index.json", json.dumps({"version": 1, "catalog_sha256": catalog_sha, "words": [word]}))
            zipfile.writestr(word["audio_file"], data)
            if extra:
                zipfile.writestr(extra, b"untrusted")
        return path

    for extra in ["../outside.mp3", "/absolute.mp3", "audio/other.mp3"]:
        with pytest.raises(ValueError, match="path"):
            release.extract_bundle(archive(extra=extra), tmp_path / "unpacked", manifest)
    assert not (tmp_path.parent / "outside.mp3").exists()
    with pytest.raises(ValueError, match="checksum"):
        release.extract_bundle(archive(data=b"corrupt"), tmp_path / "unpacked", manifest)
    with pytest.raises(ValueError, match="catalog"):
        release.extract_bundle(archive(catalog_sha="old"), tmp_path / "unpacked", manifest)
    result = release.extract_bundle(archive(), tmp_path / "unpacked", manifest)
    assert result[0]["bundle_sha256"] == "0" * 64
    assert file_digest(result[0]["source_path"]) == sha

    # Published Windows bundles keep their original checksum while the code
    # pins the same catalog content with a checkout-independent fingerprint.
    legacy_manifest = {**manifest, "catalog_sha256": "windows-digest",
                       "canonical_catalog_sha256": "catalog-digest"}
    release.extract_bundle(archive(catalog_sha="windows-digest"), tmp_path / "unpacked", legacy_manifest)
    for changed in ({**legacy_manifest, "canonical_catalog_sha256": "changed-content"},
                    {**legacy_manifest, "catalog_sha256": "different-bundle"}):
        with pytest.raises(ValueError, match="catalog"):
            release.extract_bundle(archive(catalog_sha="windows-digest"), tmp_path / "unpacked", changed)


def test_concurrent_shared_recordings_never_expose_an_incomplete_file(tmp_path, monkeypatch):
    source = tmp_path / "source.mp3"
    data = b"isolated-shared-recording" * 5000
    source.write_bytes(data)
    sha = file_digest(source)
    monkeypatch.setattr(release, "DICTIONARY_AUDIO_DIR", tmp_path / "published")
    monkeypatch.setattr(release.settings, "FILE_STORAGE_MODE", "mounted")

    def slow_copy(source_path, destination):
        with open(destination, "wb") as output:
            output.write(data[:100])
            output.flush()
            time.sleep(0.02)
            output.write(data[100:])

    monkeypatch.setattr(release.shutil, "copyfile", slow_copy)
    entry = {"source_path": source, "sha256": sha}
    with ThreadPoolExecutor(max_workers=6) as pool:
        urls = list(pool.map(lambda _: release.store_recording(entry), range(18)))
    assert len(set(urls)) == 1
    assert file_digest(tmp_path / "published" / f"{sha}.mp3") == sha
    assert not list((tmp_path / "published").glob("*.partial"))


@pytest.mark.asyncio
@pytest.mark.parametrize("environment,storage,starts", [
    ("production", "mounted", True),
    ("staging", "mounted", True),
    ("production", "s3", True),
    ("production", "local", False),
    ("local", "mounted", False),
])
async def test_durable_release_storage_starts_audio_import_and_cancels_on_shutdown(
    monkeypatch, environment, storage, starts,
):
    from app import main

    started = asyncio.Event()
    stopped = asyncio.Event()

    async def importer():
        started.set()
        try:
            await asyncio.Event().wait()
        finally:
            stopped.set()

    monkeypatch.setattr(main.settings, "ENVIRONMENT", environment)
    monkeypatch.setattr(main.settings, "FILE_STORAGE_MODE", storage)
    monkeypatch.setattr(release, "run_background_import", importer)
    monkeypatch.setattr(main, "start_chat_realtime", AsyncMock())
    monkeypatch.setattr(main, "stop_chat_realtime", AsyncMock())
    disposal = AsyncMock()
    monkeypatch.setattr(main, "engine", SimpleNamespace(dispose=disposal))
    async with main.lifespan(main.app):
        await asyncio.sleep(0)
        assert started.is_set() == starts
    assert stopped.is_set() == starts
    disposal.assert_awaited_once()
