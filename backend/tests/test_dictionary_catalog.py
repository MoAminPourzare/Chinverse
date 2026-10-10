from collections import Counter
from pathlib import Path
import re

import pytest

from import_dictionary import DEFAULT_DICTIONARY_FILES
from scripts.sync_dictionary import read_catalog


@pytest.fixture(scope="module")
def catalog():
    return {word.chinese: word for word in read_catalog()}


def test_complete_catalog_preserves_lower_levels_and_all_new_headwords(catalog):
    assert len(catalog) == 11630
    counts = Counter(word.level for word in catalog.values())
    assert {level: counts[level] for level in ("HSK4", "HSK5", "HSK6", "HSK7-9", "NON-HSK")} == {
        "HSK4": 999, "HSK5": 1557, "HSK6": 1756, "HSK7-9": 6137, "NON-HSK": 211,
    }
    assert catalog["优厚"].level == "NON-HSK"  # The workbook has no header; keep its first row.
    assert catalog["优厚"].hsk_level is None
    assert catalog["优厚"].source == "manual"
    assert catalog["挨"].level == "HSK7-9"
    assert catalog["挨"].hsk_level is None
    assert catalog["爱情"].hsk_level == 4
    # Earlier files include 17 HSK4-labelled words; keep their original metadata.
    assert sum(counts[level] for level in ("HSK1", "HSK2", "HSK3")) == 970
    assert len(read_catalog(DEFAULT_DICTIONARY_FILES[:3])) == 987


def test_polyphonic_senses_keep_their_pronunciation_and_matching_examples(catalog):
    word = catalog["炸"]
    assert word.pinyin == "zhà / zhá"
    definitions = [item for item in word.definitions if item.lang_code == "fa"]
    assert [item.sense_order for item in definitions] == [1, 2, 3]
    assert definitions[0].notes == "تلفظ: zhà"
    assert definitions[2].notes == "تلفظ: zhá"
    example = next(item for item in word.examples if item.sense_order == 3)
    assert "炸鱼" in example.zh_text
    assert "zhá" in example.pinyin
    assert "سرخ" in example.target_text


def test_fullwidth_collocations_are_split_into_phrases_and_pinyin(catalog):
    word = catalog["挨"]
    assert len(word.collocations) == 12
    assert word.collocations[0].phrase_zh == "挨着墙"
    assert word.collocations[0].phrase_pinyin == "āizhe qiáng"
    assert {item.sense_order for item in word.collocations} == {1, 2, 3, 4}


def test_new_senses_have_unique_keys_and_valid_example_columns(catalog):
    for word in catalog.values():
        if word.level in ("HSK1", "HSK2", "HSK3"):
            continue
        keys = [(definition.lang_code, definition.sense_order) for definition in word.definitions]
        assert len(keys) == len(set(keys)), word.chinese
        assert word.examples, word.chinese
        for example in word.examples:
            assert example.pinyin and example.target_text, word.chinese
            assert not re.search(r"[\u0600-\u06ff\u3400-\u9fff]", example.pinyin), word.chinese
    assert catalog["深切"].definitions[0].definition_text == "深厚而真切（形）"
    assert catalog["深切"].definitions[1].part_of_speech == "صفت"
    assert catalog["议"].examples[0].zh_text.endswith("。")


def test_overlapping_custom_words_have_one_entry_and_keep_both_sources(catalog):
    assert catalog["将军"].level == "HSK6"
    assert len(catalog["将军"].examples) == 5
    assert catalog["弄虚作假"].level == "HSK7-9"
    assert len(catalog["弄虚作假"].examples) == 2


def test_duplicate_catalog_is_rejected_before_connecting_to_database():
    with pytest.raises(ValueError, match="Duplicate dictionary headword"):
        read_catalog([DEFAULT_DICTIONARY_FILES[0], DEFAULT_DICTIONARY_FILES[0]])


def test_all_canonical_files_exist():
    assert all(isinstance(path, Path) and path.is_file() for path in DEFAULT_DICTIONARY_FILES)
