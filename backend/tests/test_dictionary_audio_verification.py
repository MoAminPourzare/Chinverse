import pytest

from scripts import verify_dictionary_audio_release as verification


@pytest.mark.asyncio
async def test_verification_waits_for_the_full_bundle_without_changing_review_status(monkeypatch):
    results = iter([
        {"imported": 100, "counts": {"ready": 100}, "files": 100, "empty_urls": 0, "unlinked": 0},
        {"imported": 200, "counts": {"ready": 160, "pending": 40}, "files": 199, "empty_urls": 0, "unlinked": 0},
    ])

    async def snapshot(connection, sha):
        assert sha == "bundle"
        return next(results)

    async def sleep(seconds):
        pass

    monkeypatch.setattr(verification, "snapshot", snapshot)
    monkeypatch.setattr(verification.asyncio, "sleep", sleep)
    result = await verification.wait_for_import(None, {"sha256": "bundle", "word_count": 200}, 30)
    assert result["counts"]["pending"] == 40


@pytest.mark.asyncio
@pytest.mark.parametrize("imported,unlinked", [(100, 0), (200, 1), (201, 0)])
async def test_incomplete_or_unlinked_release_cannot_pass(monkeypatch, imported, unlinked):
    async def snapshot(connection, sha):
        return {"imported": imported, "counts": {"ready": imported}, "files": imported,
                "empty_urls": 0, "unlinked": unlinked}

    monkeypatch.setattr(verification, "snapshot", snapshot)
    with pytest.raises(RuntimeError):
        await verification.wait_for_import(None, {"sha256": "bundle", "word_count": 200}, 0)


@pytest.mark.asyncio
async def test_snapshot_uses_only_reads_in_a_readonly_transaction():
    class Connection:
        def transaction(self, **options):
            assert options == {"isolation": "repeatable_read", "readonly": True}
            return self

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def fetch(self, sql, sha):
            assert sql.startswith("SELECT ") and sha == "bundle"
            return [{"status": "ready", "total": 2}, {"status": "pending", "total": 1}]

        async def fetchrow(self, sql, sha):
            assert sql.startswith("SELECT ") and sha == "bundle"
            return {"files": 3, "empty_urls": 0, "unlinked": 0}

    result = await verification.snapshot(Connection(), "bundle")
    assert result["imported"] == 3
