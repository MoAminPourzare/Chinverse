import argparse
import asyncio
import os
from pathlib import Path

from sqlalchemy import insert, select, text

from app.api.v1.endpoints.admin import (
    _dictionary_payload_from_csv_row,
    _dictionary_payload_from_record,
    _parse_dictionary_import_file,
    _upsert_dictionary_word,
)
from app.db.session import SessionLocal
from app.models.dictionary import DictionaryWord, WordCollocation, WordDefinition, WordExample


DEFAULT_DICTIONARY_FILE = Path(__file__).resolve().parent / "data" / "dictionary" / "hsk1_words_dictionary.csv"


async def reset_dictionary(db) -> None:
    await db.execute(text("SET LOCAL lock_timeout = '10s'"))
    await db.execute(
        text(
            """
            TRUNCATE TABLE
                lesson_word_maps,
                user_flashcards,
                word_definitions,
                word_examples,
                word_collocations,
                dictionary_words
            RESTART IDENTITY CASCADE
            """
        )
    )


def _payloads_from_rows(rows: list[dict], *, is_csv: bool):
    payloads = []
    errors = []
    for index, row in enumerate(rows, start=2 if is_csv else 1):
        try:
            is_normalized_record = isinstance(row.get("definitions"), list)
            payload = (
                _dictionary_payload_from_record(row)
                if is_normalized_record or not is_csv
                else _dictionary_payload_from_csv_row(row)
            )
            payloads.append(payload)
        except Exception as error:
            chinese = row.get("chinese") or row.get("chinese_word") or "-"
            errors.append((index, chinese, error))
    return payloads, errors


async def bulk_import_after_reset(db, payloads) -> tuple[int, int, int]:
    if not payloads:
        return 0, 0, 0

    word_rows = [
        {
            "chinese": payload.chinese.strip(),
            "pinyin": payload.pinyin.strip(),
            "audio_url": payload.audio_url,
            "level": payload.level.strip() or "custom",
            "hsk_level": payload.hsk_level,
            "source": payload.source.strip() or "manual",
            "source_word_id": payload.source_word_id,
            "status": payload.status.strip() or "published",
            "persian_meaning": payload.persian_meaning,
            "chinese_meaning": payload.chinese_meaning,
            "composition": payload.composition,
            "notes": payload.notes,
        }
        for payload in payloads
    ]
    result = await db.execute(insert(DictionaryWord).returning(DictionaryWord.id, DictionaryWord.chinese), word_rows)
    word_ids = {row.chinese: row.id for row in result.all()}

    definition_rows = []
    example_rows = []
    collocation_rows = []
    for payload in payloads:
        word_id = word_ids[payload.chinese.strip()]
        definition_rows.extend(
            {
                "word_id": word_id,
                "lang_code": definition.lang_code.strip() or "fa",
                "definition_text": definition.definition_text.strip(),
                "part_of_speech": definition.part_of_speech.strip() or "unknown",
                "sense_order": definition.sense_order,
                "notes": definition.notes,
            }
            for definition in payload.definitions
        )
        example_rows.extend(
            {
                "word_id": word_id,
                "zh_text": example.zh_text.strip(),
                "pinyin": example.pinyin.strip(),
                "target_text": example.target_text.strip(),
                "sense_order": example.sense_order,
            }
            for example in payload.examples
        )
        collocation_rows.extend(
            {
                "word_id": word_id,
                "phrase_zh": collocation.phrase_zh.strip(),
                "phrase_pinyin": collocation.phrase_pinyin.strip(),
                "translation_target": collocation.translation_target.strip(),
                "sense_order": collocation.sense_order,
            }
            for collocation in payload.collocations
        )

    if definition_rows:
        await db.execute(insert(WordDefinition), definition_rows)
    if example_rows:
        await db.execute(insert(WordExample), example_rows)
    if collocation_rows:
        await db.execute(insert(WordCollocation), collocation_rows)

    print(
        "Bulk inserted "
        f"{len(word_rows)} words, "
        f"{len(definition_rows)} definitions, "
        f"{len(example_rows)} examples, "
        f"{len(collocation_rows)} collocations."
    )
    return len(word_rows), 0, 0


async def import_dictionary_file(path: Path, *, reset: bool = False, progress_every: int = 25) -> None:
    if not path.exists():
        raise FileNotFoundError(f"Dictionary file not found: {path}")

    rows = _parse_dictionary_import_file(path.name, path.read_bytes())
    if not rows:
        print("No dictionary rows found.")
        return

    is_csv = path.suffix.lower() == ".csv"
    created = 0
    updated = 0
    failed = 0

    async with SessionLocal() as db:
        await db.execute(text("SET LOCAL lock_timeout = '10s'"))
        await db.execute(text("SET LOCAL statement_timeout = '60s'"))
        if reset:
            payloads, errors = _payloads_from_rows(rows, is_csv=is_csv)
            for index, chinese, error in errors:
                print(f"[row {index}] failed to parse {chinese}: {error}")
            print(f"Parsed {len(payloads)} dictionary words. Resetting dictionary tables...")
            await reset_dictionary(db)
            created, updated, failed = await bulk_import_after_reset(db, payloads)
            failed += len(errors)
        else:
            payloads, errors = _payloads_from_rows(rows, is_csv=is_csv)
            for index, chinese, error in errors:
                failed += 1
                print(f"[row {index}] failed to parse {chinese}: {error}", flush=True)

            total = len(payloads)
            print(f"Parsed {total} dictionary words. Updating existing dictionary without reset...", flush=True)
            for processed, payload in enumerate(payloads, start=1):
                display_row = processed + 1 if is_csv else processed
                try:
                    existed = await db.scalar(
                        select(DictionaryWord.id).where(DictionaryWord.chinese == payload.chinese.strip())
                    )
                    await _upsert_dictionary_word(db, payload)
                    if existed:
                        updated += 1
                    else:
                        created += 1
                except Exception as error:
                    failed += 1
                    chinese = payload.chinese or "-"
                    print(f"[row {display_row}] failed to import {chinese}: {error}", flush=True)

                if processed % max(progress_every, 1) == 0 or processed == total:
                    await db.commit()
                    print(
                        f"Progress: {processed}/{total} | Created: {created} | Updated: {updated} | Failed: {failed}",
                        flush=True,
                    )

        await db.commit()

    print(f"Imported dictionary file: {path}")
    if reset:
        print("Dictionary tables were reset before import.")
    print(f"Created: {created} | Updated: {updated} | Failed: {failed}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import HSK/manual dictionary CSV or JSON into Chinverse.")
    parser.add_argument(
        "file",
        nargs="?",
        default=str(DEFAULT_DICTIONARY_FILE),
        help=f"Path to CSV/JSON file. Default: {DEFAULT_DICTIONARY_FILE}",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear dictionary-related tables and restart ids before importing.",
    )
    parser.add_argument(
        "--progress-every",
        type=int,
        default=25,
        help="Print and commit progress after this many words when importing without --reset.",
    )
    args = parser.parse_args()

    if os.name == "nt":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(import_dictionary_file(Path(args.file).resolve(), reset=args.reset, progress_every=args.progress_every))


if __name__ == "__main__":
    main()
