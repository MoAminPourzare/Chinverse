# Chinverse Dictionary Data

This folder stores curated dictionary import files. HSK words are the primary
source for the app dictionary.

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

Run migrations first:

```powershell
poetry run alembic upgrade head
```

Import the default HSK1 file:

```powershell
poetry run python import_dictionary.py
```

Rebuild the dictionary from scratch and restart word ids from 1:

```powershell
poetry run python import_dictionary.py --reset
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
