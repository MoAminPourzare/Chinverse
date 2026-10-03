"""Add canonical dictionary words once, preserving existing IDs and all user study data."""
import asyncio
from pathlib import Path

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.admin import _parse_dictionary_import_file
from app.db.session import SessionLocal, engine
from app.models.dictionary import DictionaryWord
from import_dictionary import DEFAULT_DICTIONARY_FILES, _payloads_from_rows, bulk_insert_dictionary_words


def read_catalog(paths: list[Path] | tuple[Path, ...] = DEFAULT_DICTIONARY_FILES):
    payloads = []
    seen: set[str] = set()
    for path in paths:
        rows = _parse_dictionary_import_file(path.name, path.read_bytes())
        words, errors = _payloads_from_rows(rows, is_csv=path.suffix.lower() == ".csv")
        if errors:
            raise ValueError(f"Invalid dictionary file {path.name}: {errors[0]}")
        for word in words:
            chinese = word.chinese.strip()
            if chinese in seen:
                raise ValueError(f"Duplicate dictionary headword in catalog: {chinese}")
            seen.add(chinese)
        payloads.extend(words)
    return payloads


async def publish_missing_words(db: AsyncSession, payloads) -> int:
    # Serialize startup imports across replicas. All batches share one transaction.
    await db.execute(text("SET LOCAL lock_timeout = '30s'"))
    await db.execute(text("SET LOCAL statement_timeout = '60s'"))
    await db.execute(text("SELECT pg_advisory_xact_lock(741025319)"))
    existing = set((await db.scalars(select(DictionaryWord.chinese))).all())
    missing = [word for word in payloads if word.chinese.strip() not in existing]
    created = 0
    for offset in range(0, len(missing), 250):
        count, _, _ = await bulk_insert_dictionary_words(db, missing[offset:offset + 250], skip_existing=True)
        created += count
    return created


async def main() -> None:
    payloads = read_catalog()
    try:
        async with SessionLocal.begin() as db:
            created = await publish_missing_words(db, payloads)
        print(f"Dictionary catalog synchronized: {len(payloads)} words; {created} added; existing words preserved.")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
