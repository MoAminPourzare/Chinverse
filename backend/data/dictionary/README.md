# Chinverse Dictionary Data

This folder stores curated dictionary import files. HSK words are the primary
source for the app dictionary.

Canonical files currently included:

- `hsk1_words_dictionary.csv`
- `hsk2_words_dictionary.csv`
- `hsk3_words_dictionary.csv`
- `hsk4_words_dictionary.csv`
- `hsk5_words_dictionary.csv`
- `hsk6_words_dictionary.csv`
- `hsk7-9_words_dictionary.csv`
- `non_hsk_words_dictionary.csv`

The complete catalog contains **11,630 headwords and 16,888 senses**. The
2026-10-03 owner-provided expansion adds **10,643 headwords and 14,874 senses**.
`workbook_import_report.json` records original workbook checksums, exact-row
deduplication, ID/sense repairs, cross-file merges and six column/content repairs.
Original owner workbooks are unchanged and are not runtime dependencies.

## Canonical HSK CSV Format

The importer recognizes the HSK sense-based CSV shape when these columns exist:

- `word_id`
- `chinese_word`
- `pinyin`
- `word_hsk_level`
- `official_pos`
- `sense_id`
- `chinese_meaning`
- `persian_meaning`
- `chinese_pos`
- `persian_pos`
- `collocations`
- `example_chinese`
- `example_pinyin`
- `example_persian_translation`
- `notes`

Rows with the same `word_id` and `chinese_word` are grouped into a single
`dictionary_words` record. Each row becomes one sense and is stored in
definitions, examples, and collocations with `sense_order`.

## Stored Fields

`dictionary_words` keeps the word-level data:

- `chinese`
- `pinyin`
- `audio_url` (empty until pronunciation files are available)
- `level` such as `HSK1`
- Combined advanced vocabulary uses `level=HSK7-9`, `hsk_level=null`.
- Vocabulary outside HSK uses `level=NON-HSK`, `hsk_level=null`, `source=manual`.
- `hsk_level` such as `1`
- `source` such as `hsk` or `manual`
- `source_word_id`
- `status` such as `published` or `draft`
- `persian_meaning`
- `chinese_meaning`
- `composition`
- `notes`

Sense-level data is stored separately:

- `word_definitions`: Persian/Chinese meanings with part of speech
- `word_examples`: Chinese example, pinyin, Persian translation
- `word_collocations`: Chinese phrase, pinyin, optional translation

## Import

Docker startup synchronizes the canonical catalog after migrations and before
serving requests. It inserts missing headwords in one transaction, preserves
existing dictionary IDs, edited content, audio/media links, lesson mappings and
user flashcards, and does nothing to already-existing words. A PostgreSQL
transaction lock prevents concurrent startup imports from creating duplicates.

Validate all files without accessing the database:

```powershell
poetry run python import_dictionary.py --all-dictionary --dry-run
```

Add missing words without replacing existing content or resetting study data:

```powershell
poetry run python -m scripts.sync_dictionary
```

The older importer below is for intentionally updating existing dictionary
content. Its `--reset` flag deletes lesson-word mappings and user flashcards;
do not use it to publish an expansion or migrate user study history.

Run migrations first:

```powershell
poetry run alembic upgrade head
```

Import the default HSK1 file:

```powershell
poetry run python import_dictionary.py
```

Import all numbered HSK files, including the combined HSK7–9 band:

```powershell
poetry run python import_dictionary.py --all-hsk
```

Rebuild the dictionary from scratch and restart word ids from 1:

```powershell
poetry run python import_dictionary.py --reset
```

Rebuild from scratch with all canonical HSK files:

```powershell
poetry run python import_dictionary.py --all-hsk --reset
```

Import another file:

```powershell
poetry run python import_dictionary.py data\dictionary\hsk2_words_dictionary.csv
```

## Sense Ordering

Multiple CSV rows for the same `word_id` / `chinese_word` become one
`dictionary_words` row. The CSV `sense_id` is preserved as `sense_order` in:

- `word_definitions`
- `word_examples`
- `word_collocations`

This lets the app render meaning 1, meaning 2, and their matching examples or
collocations together.

## Phase 5 data and provenance audit

Before importing or publishing a dictionary snapshot, run the deterministic
audit from the repository root:

```powershell
python backend/scripts/audit_phase5_content.py --repo-root .
```

The command validates all eight canonical CSV files, duplicate sense keys, level
label consistency, and SHA-256 entries in `source_registry.csv`. It also
checks the repository media registry. Missing source/owner/license evidence is
kept as `review_required` and reported as a baseline blocker; it must not be
silently treated as approved content. Use `--strict-licenses` for a release
readiness gate after human provenance review.
