"""Read-only verification of the pinned recordings on the approved staging database."""
import argparse
import asyncio
import json
import os
from pathlib import Path
import sys
import time

import asyncpg
import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.phase4_staging_fixtures import (  # noqa: E402
    build_verified_ssl_context,
    validate_and_normalize_database_url,
)
from scripts.dictionary_audio import read_catalog, reading_key, split_readings  # noqa: E402

MANIFEST_PATH = Path(__file__).resolve().parents[1] / "data" / "dictionary-audio-release.json"
STAGING_API = "https://moamin9-chinverse-api.hf.space/api/v1"


def public_snapshot(words, catalog):
    indexed = {word["chinese"]: word for word in words}
    eligible = [entry for entry in catalog if not entry["review_reasons"]]
    linked = 0
    for entry in eligible:
        word = indexed.get(entry["chinese"])
        if word and word.get("audio_url") and reading_key(word.get("audio_pinyin") or "") in {
            reading_key(pinyin) for pinyin in entry["pinyins"]
        }:
            linked += 1
    present = sum(entry["chinese"] in indexed for entry in catalog)
    changed = sum(
        {reading_key(pinyin) for pinyin in split_readings(indexed[entry["chinese"]]["pinyin"])}
        != {reading_key(pinyin) for pinyin in entry["pinyins"]}
        for entry in catalog if entry["chinese"] in indexed
    )
    incompatible = sum(
        not {reading_key(p) for p in split_readings(indexed[entry["chinese"]]["pinyin"])}.issubset(
            {reading_key(p) for p in entry["pinyins"]}
        ) for entry in catalog if entry["chinese"] in indexed
    )
    return {"scope": "public_dictionary_links", "full_receipt_count_verified": False,
            "catalog_present": present, "catalog_expected": len(catalog), "changed_readings": changed, "incompatible_readings": incompatible,
            "public_linked": linked, "public_expected": len(eligible),
            "sensitive_catalog_words": len(catalog) - len(eligible)}


async def verify_public(wait_seconds):
    catalog, digest = read_catalog()
    manifest = json.loads(MANIFEST_PATH.read_text("utf-8-sig"))
    if manifest.get("canonical_catalog_sha256", manifest["catalog_sha256"]) != digest or manifest["word_count"] != len(catalog):
        raise RuntimeError("The public verification catalog differs from the pinned release.")
    deadline = time.monotonic() + wait_seconds
    async with httpx.AsyncClient(timeout=30) as client:
        while True:
            words = []
            # Search is public; whitespace selects all published words. Keep
            # requests sequential and bound pagination even if the API drifts.
            for page in range(500):
                response = await client.get(f"{STAGING_API}/vocabulary/",
                                            params={"q": " ", "skip": page * 100, "limit": 100})
                response.raise_for_status()
                batch = response.json()
                if not isinstance(batch, list) or len(batch) > 100:
                    raise RuntimeError("Unexpected public vocabulary response.")
                words.extend(batch)
                if len(batch) < 100:
                    break
            else:
                raise RuntimeError("Public vocabulary pagination exceeded its bound.")
            result = public_snapshot(words, catalog)
            print(json.dumps(result), flush=True)
            if result["catalog_present"] == len(catalog) and not result["incompatible_readings"] \
                    and result["public_linked"] == result["public_expected"]:
                return result
            if time.monotonic() >= deadline:
                raise RuntimeError("Public dictionary audio links are not complete.")
            await asyncio.sleep(min(30, max(0, deadline - time.monotonic())))


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
    parser.add_argument("--public", action="store_true", help="Verify public links when no staging DB secret is configured")
    args = parser.parse_args()
    try:
        asyncio.run(verify_public(args.wait_seconds) if args.public else main(args.wait_seconds))
    except Exception as error:
        print(f"Read-only dictionary audio verification failed ({type(error).__name__}).", file=sys.stderr)
        sys.exit(1)
