from __future__ import annotations

import csv
from pathlib import Path

from scripts.audit_phase5_content import (
    DICTIONARY_FILES,
    DICTIONARY_REGISTRY,
    MEDIA_REGISTRY,
    REQUIRED_DICTIONARY_COLUMNS,
    audit_dictionary,
    discover_media_assets,
    run_audit,
    sync_registries,
)


REPO_ROOT = Path(__file__).resolve().parents[2]


def _dictionary_row(word_id: int, word: str, sense_id: int, *, level: str = "HSK 1") -> dict[str, str]:
    return {
        "word_id": str(word_id),
        "chinese_word": word,
        "pinyin": "hǎo",
        "word_hsk_level": level,
        "official_pos": "形",
        "sense_id": str(sense_id),
        "chinese_meaning": "好的",
        "persian_meaning": "خوب",
        "collocations": "很好 (hěn hǎo)",
        "example_chinese": "很好。",
        "example_pinyin": "Hěn hǎo.",
        "example_persian_translation": "خیلی خوب است.",
        "notes": "",
    }


def _write_dictionary_fixture(root: Path, rows_by_file: dict[str, list[dict[str, str]]] | None = None) -> None:
    rows_by_file = rows_by_file or {}
    for index, relative_path in enumerate(DICTIONARY_FILES, start=1):
        path = root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        default_word = ("好", "大", "小")[index - 1]
        rows = rows_by_file.get(relative_path.name, [_dictionary_row(1, default_word, 1, level=f"HSK {index}")])
        with path.open("w", encoding="utf-8", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=REQUIRED_DICTIONARY_COLUMNS, lineterminator="\n")
            writer.writeheader()
            writer.writerows(rows)


def _write_media_fixture(root: Path) -> None:
    media_path = root / "frontend/public/demo.png"
    media_path.parent.mkdir(parents=True, exist_ok=True)
    media_path.write_bytes(b"image")
    video_path = root / "firstVideo/demo.mp4"
    video_path.parent.mkdir(parents=True, exist_ok=True)
    video_path.write_bytes(b"video")


def _prepare_fixture(root: Path) -> None:
    _write_dictionary_fixture(root)
    _write_media_fixture(root)
    sync_registries(root)


def test_repository_dictionary_cleanup_and_known_hsk3_baseline() -> None:
    summary, findings = audit_dictionary(REPO_ROOT)

    hsk3 = next(item for item in summary["files"] if item["path"].endswith("hsk3_words_dictionary.csv"))
    codes = {finding.code for finding in findings}
    assert hsk3["row_count"] == 881
    assert hsk3["word_count"] == 490
    assert summary["level_label_mismatch_count"] == 105
    assert "DICT_DUPLICATE_ROW" not in codes
    assert "DICT_DUPLICATE_SENSE_ID" not in codes
    assert "DICT_SENSE_GAP" in codes


def test_dictionary_audit_distinguishes_exact_and_conflicting_duplicate_senses(tmp_path: Path) -> None:
    rows = [
        _dictionary_row(1, "好", 1),
        _dictionary_row(1, "好", 1),
        {**_dictionary_row(1, "好", 2), "persian_meaning": "مناسب"},
    ]
    _write_dictionary_fixture(tmp_path, {"hsk1_words_dictionary.csv": rows})

    _, findings = audit_dictionary(tmp_path)
    codes = {finding.code for finding in findings}
    assert "DICT_DUPLICATE_ROW" in codes
    assert "DICT_DUPLICATE_SENSE_ID" not in codes

    rows[-1]["sense_id"] = "1"
    _write_dictionary_fixture(tmp_path, {"hsk1_words_dictionary.csv": rows})
    _, findings = audit_dictionary(tmp_path)
    assert "DICT_DUPLICATE_SENSE_ID" in {finding.code for finding in findings}


def test_registry_sync_is_stable_and_preserves_review_fields(tmp_path: Path) -> None:
    _prepare_fixture(tmp_path)
    registry = tmp_path / MEDIA_REGISTRY
    rows = list(csv.DictReader(registry.open(encoding="utf-8", newline="")))
    assert [row["path"] for row in rows] == sorted(row["path"] for row in rows)
    assert len(rows) == 2
    assert {row["media_type"] for row in rows} == {"image", "video"}

    rows[0]["owner"] = "Chinverse"
    rows[0]["license"] = "Internal"
    rows[0]["source_url"] = "https://example.invalid/evidence"
    rows[0]["review_status"] = "approved"
    with registry.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=rows[0].keys(), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    before = registry.read_bytes()
    sync_registries(tmp_path)
    after = registry.read_bytes()
    assert before == after
    persisted = {row["path"]: row for row in csv.DictReader(registry.open(encoding="utf-8", newline=""))}
    assert persisted[rows[0]["path"]]["review_status"] == "approved"
    assert persisted[rows[0]["path"]]["license"] == "Internal"
    assert (tmp_path / DICTIONARY_REGISTRY).is_file()


def test_registry_checksum_drift_is_a_structural_blocker(tmp_path: Path) -> None:
    _prepare_fixture(tmp_path)
    (tmp_path / "frontend/public/demo.png").write_bytes(b"changed")
    result = run_audit(tmp_path, scan_source=False)
    assert any(finding.code == "LICENSE_CHECKSUM_MISMATCH" for finding in result.structural_blockers())


def test_unknown_license_is_baseline_not_default_build_failure(tmp_path: Path) -> None:
    _prepare_fixture(tmp_path)
    result = run_audit(tmp_path, scan_source=False)
    assert not result.structural_blockers()
    assert len(result.baseline_blockers()) == 5


def test_source_scan_flags_remote_media_and_numeric_route_ids(tmp_path: Path) -> None:
    _prepare_fixture(tmp_path)
    source = tmp_path / "frontend/src/player.tsx"
    source.parent.mkdir(parents=True, exist_ok=True)
    source.write_text(
        'const url = "https://cdn.example.invalid/video.m3u8";\n'
        'const special = courseId === "7";\n',
        encoding="utf-8",
    )
    result = run_audit(tmp_path)
    codes = {finding.code for finding in result.structural_blockers()}
    assert "HARDCODED_REMOTE_MEDIA_URL" in codes
    assert "HARDCODED_MEDIA_ROUTE_ID" in codes


def test_repository_media_registry_covers_every_audited_asset() -> None:
    assets = discover_media_assets(REPO_ROOT)
    result = run_audit(REPO_ROOT, scan_source=False)
    assert len(assets) == 347
    assert result.media["asset_count"] == 347
    assert result.media["image_count"] == 331
    assert result.media["video_count"] == 16
    assert result.media["registered_file_count"] == len(assets)
    assert not any(finding.gate == "structural" for finding in result.findings)
