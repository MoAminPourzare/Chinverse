"""Read-only verification of the pinned recordings on the approved staging database."""
import argparse
import asyncio
import json
import os
from pathlib import Path
import sys
import time

import asyncpg

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.phase4_staging_fixtures import (  # noqa: E402
    build_verified_ssl_context,
    validate_and_normalize_database_url,
)

MANIFEST_PATH = Path(__file__).resolve().parents[1] / "data" / "dictionary-audio-release.json"


async def snapshot(connection, bundle_sha):
    # Both the connection default and each transaction prohibit writes. The
    # snapshot includes recordings still pending review; public playback alone
    # cannot prove those recordings were imported successfully.
    async with connection.transaction(isolation="repeatable_read", readonly=True):
        rows = await connection.fetch(
            "SELECT status, count(*) AS total FROM dictionary_audio "
            "WHERE bundle_sha256 = $1 GROUP BY status", bundle_sha,
        )
        health = await connection.fetchrow(
            "SELECT count(DISTINCT a.sha256) AS files, "
            "count(*) FILTER (WHERE a.audio_url = '') AS empty_urls, "
            "count(*) FILTER (WHERE a.status IN ('ready', 'approved') "
            "AND w.status = 'published' AND (w.audio_url IS NULL OR w.audio_url = '')) AS unlinked "
            "FROM dictionary_audio a JOIN dictionary_words w ON w.id = a.word_id "
            "WHERE a.bundle_sha256 = $1", bundle_sha,
        )
    counts = {row["status"]: row["total"] for row in rows}
    return {"imported": sum(counts.values()), "counts": counts, **dict(health)}


async def wait_for_import(connection, manifest, wait_seconds):
    deadline = time.monotonic() + wait_seconds
    previous = None
    while True:
        result = await snapshot(connection, manifest["sha256"])
        if result != previous:
            print(json.dumps({"expected": manifest["word_count"], **result}), flush=True)
            previous = result
        if result["imported"] > manifest["word_count"]:
            raise RuntimeError("The recording count exceeds the pinned release.")
        if result["imported"] == manifest["word_count"]:
            if result["empty_urls"] or result["unlinked"]:
                raise RuntimeError("The import contains missing recording links.")
            return result
        if time.monotonic() >= deadline:
            raise RuntimeError("The pinned audio import has not completed within the verification window.")
        await asyncio.sleep(min(15, max(0, deadline - time.monotonic())))


async def main(wait_seconds):
    # Reuse the existing exact-endpoint and verified-TLS guard. Never display
    # the provider URL or driver exceptions, which can contain credentials.
    dsn = validate_and_normalize_database_url(os.environ.get("DATABASE_URL", ""))
    manifest = json.loads(MANIFEST_PATH.read_text("utf-8-sig"))
    connection = await asyncpg.connect(
        dsn, ssl=build_verified_ssl_context(), timeout=30, command_timeout=30,
        server_settings={"application_name": "dictionary-audio-readonly-verification",
                         "default_transaction_read_only": "on", "statement_timeout": "30000"},
    )
    try:
        await wait_for_import(connection, manifest, wait_seconds)
    finally:
        await connection.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wait-seconds", type=int, default=1800, choices=range(0, 1801), metavar="0..1800")
    args = parser.parse_args()
    try:
        asyncio.run(main(args.wait_seconds))
    except Exception as error:
        print(f"Read-only dictionary audio verification failed ({type(error).__name__}).", file=sys.stderr)
        sys.exit(1)
