from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Sequence


DICTIONARY_FILES = (
    Path("backend/data/dictionary/hsk1_words_dictionary.csv"),
    Path("backend/data/dictionary/hsk2_words_dictionary.csv"),
    Path("backend/data/dictionary/hsk3_words_dictionary.csv"),
)
DICTIONARY_REGISTRY = Path("backend/data/dictionary/source_registry.csv")
MEDIA_REGISTRY = Path("docs/PHASE_5_MEDIA_LICENSE_REGISTRY.csv")
MEDIA_ROOTS = (
    Path("firstVideo"),
    Path("secondVideo"),
    Path("frontend/public"),
)
IMAGE_EXTENSIONS = {".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"}
VIDEO_EXTENSIONS = {".avi", ".m4v", ".mkv", ".mov", ".mp4", ".webm"}
MEDIA_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS
CANONICAL_TEXT_CHECKSUM_EXTENSIONS = {".csv", ".svg"}
SOURCE_EXTENSIONS = {".js", ".jsx", ".py", ".ts", ".tsx"}
REVIEW_STATUSES = {"approved", "rejected", "review_required"}
REQUIRED_DICTIONARY_COLUMNS = (
    "word_id",
    "chinese_word",
    "pinyin",
    "word_hsk_level",
    "official_pos",
    "sense_id",
    "chinese_meaning",
    "persian_meaning",
    "collocations",
    "example_chinese",
    "example_pinyin",
    "example_persian_translation",
    "notes",
)
REQUIRED_DICTIONARY_VALUES = REQUIRED_DICTIONARY_COLUMNS[:-1]
MEDIA_REGISTRY_FIELDS = (
    "path",
    "sha256",
    "media_type",
    "owner",
    "license",
    "source_url",
    "review_status",
    "notes",
)
DICTIONARY_REGISTRY_FIELDS = (
    "path",
    "sha256",
    "dataset_type",
    "owner",
    "license",
    "source_url",
    "review_status",
    "notes",
)
REMOTE_URL_RE = re.compile(r"https?://[^\s\"'<>`]+", re.IGNORECASE)
SPECIAL_MEDIA_ID_RE = re.compile(
    r"\b(?:courseId|lessonId)\s*===\s*[\"']\d+[\"']",
)
QUOTED_MEDIA_PATH_RE = re.compile(
    r"[\"']([^\"']+[.](?:avi|m3u8|m4v|mkv|mov|mp4|webm))[\"']",
    re.IGNORECASE,
)
SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}


@dataclass(frozen=True)
class Finding:
    code: str
    severity: str
    gate: str
    path: str
    message: str
    line: int | None = None


@dataclass(frozen=True)
class AuditResult:
    dictionary: dict[str, object]
    media: dict[str, object]
    source_hardcodes: dict[str, object]
    findings: tuple[Finding, ...]

    def finding_counts(self) -> dict[str, dict[str, int]]:
        return {
            "by_code": dict(sorted(Counter(item.code for item in self.findings).items())),
            "by_gate": dict(sorted(Counter(item.gate for item in self.findings).items())),
            "by_severity": dict(sorted(Counter(item.severity for item in self.findings).items())),
        }

    def structural_blockers(self) -> tuple[Finding, ...]:
        return tuple(
            item
            for item in self.findings
            if item.gate == "structural" and item.severity in {"critical", "high"}
        )

    def baseline_blockers(self) -> tuple[Finding, ...]:
        return tuple(
            item
            for item in self.findings
            if item.gate == "baseline" and item.severity in {"critical", "high"}
        )

    def as_dict(self) -> dict[str, object]:
        return {
            "dictionary": self.dictionary,
            "media": self.media,
            "source_hardcodes": self.source_hardcodes,
            "finding_counts": self.finding_counts(),
            "structural_blocker_count": len(self.structural_blockers()),
            "baseline_blocker_count": len(self.baseline_blockers()),
            "findings": [asdict(item) for item in self.findings],
        }


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _relative(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    if path.suffix.lower() in CANONICAL_TEXT_CHECKSUM_EXTENSIONS:
        content = path.read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        digest.update(content)
        return digest.hexdigest()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _sort_findings(findings: Iterable[Finding]) -> tuple[Finding, ...]:
    return tuple(
        sorted(
            findings,
            key=lambda item: (
                SEVERITY_ORDER[item.severity],
                item.gate,
                item.code,
                item.path,
                item.line or 0,
                item.message,
            ),
        )
    )


def discover_media_assets(root: Path) -> tuple[Path, ...]:
    assets: set[Path] = set()
    for relative_root in MEDIA_ROOTS:
        candidate = root / relative_root
        if candidate.is_file():
            if candidate.suffix.lower() in MEDIA_EXTENSIONS:
                assets.add(candidate.resolve())
            continue
        if not candidate.exists():
            continue
        assets.update(
            item.resolve()
            for item in candidate.rglob("*")
            if item.is_file() and item.suffix.lower() in MEDIA_EXTENSIONS
        )
    return tuple(sorted(assets, key=lambda item: _relative(item, root)))


def _media_type(path: Path) -> str:
    return "video" if path.suffix.lower() in VIDEO_EXTENSIONS else "image"


def _read_registry(path: Path) -> tuple[list[dict[str, str]], tuple[str, ...]]:
    if not path.exists():
        return [], ()
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        return [dict(row) for row in reader], tuple(reader.fieldnames or ())


def _write_registry(path: Path, fields: Sequence[str], rows: Iterable[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def _existing_registry_by_path(path: Path) -> dict[str, dict[str, str]]:
    rows, _ = _read_registry(path)
    existing: dict[str, dict[str, str]] = {}
    for row in rows:
        relative_path = (row.get("path") or "").strip()
        if not relative_path:
            continue
        if relative_path in existing:
            raise ValueError(f"Duplicate registry path cannot be synchronized safely: {relative_path}")
        existing[relative_path] = row
    return existing


def sync_registries(root: Path) -> None:
    media_registry_path = root / MEDIA_REGISTRY
    existing_media = _existing_registry_by_path(media_registry_path)
    media_rows: list[dict[str, str]] = []
    for asset in discover_media_assets(root):
        relative_path = _relative(asset, root)
        previous = existing_media.get(relative_path, {})
        media_rows.append(
            {
                "path": relative_path,
                "sha256": _sha256(asset),
                "media_type": _media_type(asset),
                "owner": (previous.get("owner") or "").strip(),
                "license": (previous.get("license") or "").strip(),
                "source_url": (previous.get("source_url") or "").strip(),
                "review_status": (previous.get("review_status") or "review_required").strip(),
                "notes": (
                    previous.get("notes")
                    or "Historical repository asset; provenance evidence is required before production publication."
                ).strip(),
            }
        )
    _write_registry(media_registry_path, MEDIA_REGISTRY_FIELDS, media_rows)

    dictionary_registry_path = root / DICTIONARY_REGISTRY
    existing_dictionary = _existing_registry_by_path(dictionary_registry_path)
    dictionary_rows: list[dict[str, str]] = []
    for relative_path_value in DICTIONARY_FILES:
        dictionary_path = root / relative_path_value
        if not dictionary_path.is_file():
            continue
        relative_path = relative_path_value.as_posix()
        previous = existing_dictionary.get(relative_path, {})
        dictionary_rows.append(
            {
                "path": relative_path,
                "sha256": _sha256(dictionary_path),
                "dataset_type": "hsk_dictionary_csv",
                "owner": (previous.get("owner") or "").strip(),
                "license": (previous.get("license") or "").strip(),
                "source_url": (previous.get("source_url") or "").strip(),
                "review_status": (previous.get("review_status") or "review_required").strip(),
                "notes": (
                    previous.get("notes")
                    or "Curated project dataset; origin and redistribution terms require documented review."
                ).strip(),
            }
        )
    _write_registry(dictionary_registry_path, DICTIONARY_REGISTRY_FIELDS, dictionary_rows)


def _positive_integer(value: str) -> int | None:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


def audit_dictionary(root: Path) -> tuple[dict[str, object], list[Finding]]:
    findings: list[Finding] = []
    file_summaries: list[dict[str, object]] = []
    global_chinese: defaultdict[str, set[str]] = defaultdict(set)

    for relative_path in DICTIONARY_FILES:
        path = root / relative_path
        display_path = relative_path.as_posix()
        level_match = re.search(r"hsk(\d+)_", relative_path.name, re.IGNORECASE)
        expected_level = f"HSK {level_match.group(1)}" if level_match else ""
        if not path.is_file():
            findings.append(
                Finding("DICT_FILE_MISSING", "critical", "structural", display_path, "Canonical dictionary file is missing.")
            )
            continue

        try:
            with path.open("r", encoding="utf-8-sig", newline="") as stream:
                reader = csv.DictReader(stream)
                fields = tuple(reader.fieldnames or ())
                rows = [dict(row) for row in reader]
        except UnicodeDecodeError:
            findings.append(
                Finding("DICT_ENCODING", "critical", "structural", display_path, "Dictionary CSV must be UTF-8 encoded.")
            )
            continue

        missing_columns = [column for column in REQUIRED_DICTIONARY_COLUMNS if column not in fields]
        if missing_columns:
            findings.append(
                Finding(
                    "DICT_COLUMNS_MISSING",
                    "critical",
                    "structural",
                    display_path,
                    f"Missing required columns: {', '.join(missing_columns)}.",
                    line=1,
                )
            )
            continue

        word_ids: defaultdict[str, set[str]] = defaultdict(set)
        chinese_ids: defaultdict[str, set[str]] = defaultdict(set)
        sense_rows: dict[tuple[str, str, int], tuple[tuple[str, str], ...]] = {}
        semantic_senses: dict[tuple[str, str, tuple[str, ...]], int] = {}
        senses_by_word: defaultdict[tuple[str, str], list[int]] = defaultdict(list)
        pinyin_by_word: defaultdict[tuple[str, str], set[str]] = defaultdict(set)
        level_label_mismatch_count = 0

        for line_number, row in enumerate(rows, start=2):
            clean = {column: (row.get(column) or "").strip() for column in REQUIRED_DICTIONARY_COLUMNS}
            for column in REQUIRED_DICTIONARY_VALUES:
                if not clean[column]:
                    findings.append(
                        Finding(
                            "DICT_REQUIRED_VALUE_MISSING",
                            "high",
                            "structural",
                            display_path,
                            f"Required dictionary value is blank: {column}.",
                            line=line_number,
                        )
                    )

            level_label = clean["word_hsk_level"]
            if level_label and not re.fullmatch(r"HSK [1-9]\d*", level_label):
                findings.append(
                    Finding(
                        "DICT_LEVEL_LABEL_FORMAT",
                        "high",
                        "structural",
                        display_path,
                        f"word_hsk_level must use the canonical 'HSK N' form; found {level_label!r}.",
                        line=line_number,
                    )
                )
            if expected_level and level_label and level_label != expected_level:
                level_label_mismatch_count += 1
                findings.append(
                    Finding(
                        "DICT_LEVEL_LABEL_MISMATCH",
                        "medium",
                        "baseline",
                        display_path,
                        f"Canonical file level is {expected_level!r}, but the row declares {level_label!r}; source review is required.",
                        line=line_number,
                    )
                )

            word_id = clean["word_id"]
            chinese = clean["chinese_word"]
            sense_id = _positive_integer(clean["sense_id"])
            if _positive_integer(word_id) is None:
                findings.append(
                    Finding(
                        "DICT_WORD_ID_INVALID",
                        "high",
                        "structural",
                        display_path,
                        f"word_id must be a positive integer; found {word_id!r}.",
                        line=line_number,
                    )
                )
            if sense_id is None:
                findings.append(
                    Finding(
                        "DICT_SENSE_ID_INVALID",
                        "high",
                        "structural",
                        display_path,
                        f"sense_id must be a positive integer; found {clean['sense_id']!r}.",
                        line=line_number,
                    )
                )
                continue

            identity = (word_id, chinese)
            word_ids[word_id].add(chinese)
            chinese_ids[chinese].add(word_id)
            global_chinese[chinese].add(display_path)
            senses_by_word[identity].append(sense_id)
            pinyin_by_word[identity].add(clean["pinyin"])

            sense_key = (word_id, chinese, sense_id)
            normalized_row = tuple((column, clean[column]) for column in REQUIRED_DICTIONARY_COLUMNS)
            previous = sense_rows.get(sense_key)
            if previous is not None:
                code = "DICT_DUPLICATE_ROW" if previous == normalized_row else "DICT_DUPLICATE_SENSE_ID"
                message = (
                    f"Exact duplicate row for word {chinese!r}, sense {sense_id}."
                    if previous == normalized_row
                    else f"Different content reuses sense_id {sense_id} for word {chinese!r}."
                )
                findings.append(Finding(code, "high", "structural", display_path, message, line=line_number))
            else:
                sense_rows[sense_key] = normalized_row

            semantic_key = (
                word_id,
                chinese,
                (
                    clean["chinese_meaning"],
                    clean["persian_meaning"],
                    clean["example_chinese"],
                    clean["example_pinyin"],
                    clean["example_persian_translation"],
                ),
            )
            previous_semantic_line = semantic_senses.get(semantic_key)
            if previous_semantic_line is not None and previous is None:
                findings.append(
                    Finding(
                        "DICT_DUPLICATE_SEMANTIC_SENSE",
                        "high",
                        "structural",
                        display_path,
                        f"Semantic sense duplicates row {previous_semantic_line} for word {chinese!r}.",
                        line=line_number,
                    )
                )
            else:
                semantic_senses[semantic_key] = line_number

        for word_id, values in sorted(word_ids.items()):
            if len(values) > 1:
                findings.append(
                    Finding(
                        "DICT_WORD_ID_COLLISION",
                        "critical",
                        "structural",
                        display_path,
                        f"word_id {word_id!r} maps to multiple words: {', '.join(sorted(values))}.",
                    )
                )
        for chinese, values in sorted(chinese_ids.items()):
            if len(values) > 1:
                findings.append(
                    Finding(
                        "DICT_CHINESE_COLLISION",
                        "high",
                        "structural",
                        display_path,
                        f"Word {chinese!r} maps to multiple word_ids: {', '.join(sorted(values))}.",
                    )
                )
        for (_, chinese), senses in sorted(senses_by_word.items()):
            unique_senses = sorted(set(senses))
            expected = list(range(1, max(unique_senses) + 1))
            if unique_senses != expected:
                findings.append(
                    Finding(
                        "DICT_SENSE_GAP",
                        "medium",
                        "baseline",
                        display_path,
                        f"Word {chinese!r} has non-contiguous senses {unique_senses}; semantic review is required.",
                    )
                )

        file_summaries.append(
            {
                "path": display_path,
                "sha256": _sha256(path),
                "row_count": len(rows),
                "word_count": len(senses_by_word),
                "polyphonic_word_count": sum(1 for values in pinyin_by_word.values() if len(values) > 1),
                "level_label_mismatch_count": level_label_mismatch_count,
            }
        )

    for chinese, paths in sorted(global_chinese.items()):
        if len(paths) > 1:
            findings.append(
                Finding(
                    "DICT_CROSS_LEVEL_COLLISION",
                    "high",
                    "structural",
                    ", ".join(sorted(paths)),
                    f"Word {chinese!r} appears in multiple canonical level files and would collide in the database.",
                )
            )

    return {
        "files": file_summaries,
        "file_count": len(file_summaries),
        "row_count": sum(int(item["row_count"]) for item in file_summaries),
        "word_count": sum(int(item["word_count"]) for item in file_summaries),
        "level_label_mismatch_count": sum(
            int(item["level_label_mismatch_count"]) for item in file_summaries
        ),
    }, findings


def _audit_registry(
    *,
    root: Path,
    registry_relative_path: Path,
    expected_paths: dict[str, tuple[str, str]],
    fields: Sequence[str],
    type_field: str,
    review_code: str,
) -> tuple[dict[str, object], list[Finding]]:
    findings: list[Finding] = []
    registry_path = root / registry_relative_path
    registry_display = registry_relative_path.as_posix()
    if not registry_path.is_file():
        findings.append(
            Finding(
                "LICENSE_REGISTRY_MISSING",
                "critical",
                "structural",
                registry_display,
                "License registry is missing; run the audit with --sync-registries.",
            )
        )
        return {"registry": registry_display, "entry_count": 0}, findings

    rows, actual_fields = _read_registry(registry_path)
    missing_fields = [field for field in fields if field not in actual_fields]
    if missing_fields:
        findings.append(
            Finding(
                "LICENSE_REGISTRY_COLUMNS",
                "critical",
                "structural",
                registry_display,
                f"Registry is missing columns: {', '.join(missing_fields)}.",
                line=1,
            )
        )
        return {"registry": registry_display, "entry_count": len(rows)}, findings

    registry_rows: dict[str, dict[str, str]] = {}
    for line_number, row in enumerate(rows, start=2):
        relative_path = (row.get("path") or "").strip()
        if not relative_path:
            findings.append(
                Finding(
                    "LICENSE_REGISTRY_EMPTY_PATH",
                    "critical",
                    "structural",
                    registry_display,
                    "Registry entry has an empty path.",
                    line=line_number,
                )
            )
            continue
        if relative_path in registry_rows:
            findings.append(
                Finding(
                    "LICENSE_REGISTRY_DUPLICATE_PATH",
                    "critical",
                    "structural",
                    registry_display,
                    f"Registry path is duplicated: {relative_path}.",
                    line=line_number,
                )
            )
            continue
        registry_rows[relative_path] = row

    expected_set = set(expected_paths)
    registered_set = set(registry_rows)
    for missing_path in sorted(expected_set - registered_set):
        findings.append(
            Finding(
                "LICENSE_REGISTRY_ENTRY_MISSING",
                "critical",
                "structural",
                missing_path,
                f"Asset is not registered in {registry_display}.",
            )
        )
    for stale_path in sorted(registered_set - expected_set):
        findings.append(
            Finding(
                "LICENSE_REGISTRY_STALE_ENTRY",
                "high",
                "structural",
                stale_path,
                f"Registry entry has no matching repository file in the audited roots ({registry_display}).",
            )
        )

    for relative_path in sorted(expected_set & registered_set):
        expected_sha, expected_type = expected_paths[relative_path]
        row = registry_rows[relative_path]
        actual_sha = (row.get("sha256") or "").strip().lower()
        actual_type = (row.get(type_field) or "").strip()
        status = (row.get("review_status") or "").strip()
        if actual_sha != expected_sha:
            findings.append(
                Finding(
                    "LICENSE_CHECKSUM_MISMATCH",
                    "high",
                    "structural",
                    relative_path,
                    f"Registry checksum does not match the repository file ({registry_display}).",
                )
            )
        if actual_type != expected_type:
            findings.append(
                Finding(
                    "LICENSE_TYPE_MISMATCH",
                    "high",
                    "structural",
                    relative_path,
                    f"Expected {type_field}={expected_type!r}; registry contains {actual_type!r}.",
                )
            )
        if status not in REVIEW_STATUSES:
            findings.append(
                Finding(
                    "LICENSE_REVIEW_STATUS_INVALID",
                    "high",
                    "structural",
                    relative_path,
                    f"review_status must be one of {sorted(REVIEW_STATUSES)}; found {status!r}.",
                )
            )
            continue

        owner = (row.get("owner") or "").strip()
        license_name = (row.get("license") or "").strip()
        source_url = (row.get("source_url") or "").strip()
        if status == "approved" and not (owner and license_name and source_url):
            findings.append(
                Finding(
                    "LICENSE_APPROVAL_INCOMPLETE",
                    "high",
                    "structural",
                    relative_path,
                    "Approved entries require owner, license, and source_url evidence.",
                )
            )
        elif status == "review_required":
            missing_evidence = [
                key
                for key, value in (("owner", owner), ("license", license_name), ("source_url", source_url))
                if not value
            ]
            findings.append(
                Finding(
                    review_code,
                    "high",
                    "baseline",
                    relative_path,
                    "Provenance review is required"
                    + (f"; missing {', '.join(missing_evidence)}." if missing_evidence else "."),
                )
            )
        elif status == "rejected":
            findings.append(
                Finding(
                    "LICENSE_REJECTED",
                    "high",
                    "baseline",
                    relative_path,
                    "Rejected content must not be published.",
                )
            )

    return {
        "registry": registry_display,
        "entry_count": len(rows),
        "registered_file_count": len(expected_set & registered_set),
        "review_required_count": sum(
            1 for row in registry_rows.values() if (row.get("review_status") or "").strip() == "review_required"
        ),
    }, findings


def audit_registries(root: Path) -> tuple[dict[str, object], list[Finding]]:
    media_assets = discover_media_assets(root)
    media_expected = {
        _relative(path, root): (_sha256(path), _media_type(path))
        for path in media_assets
    }
    media_summary, media_findings = _audit_registry(
        root=root,
        registry_relative_path=MEDIA_REGISTRY,
        expected_paths=media_expected,
        fields=MEDIA_REGISTRY_FIELDS,
        type_field="media_type",
        review_code="MEDIA_LICENSE_REVIEW_REQUIRED",
    )
    media_summary.update(
        {
            "asset_count": len(media_assets),
            "image_count": sum(1 for path in media_assets if _media_type(path) == "image"),
            "video_count": sum(1 for path in media_assets if _media_type(path) == "video"),
            "total_bytes": sum(path.stat().st_size for path in media_assets),
            "registered_file_count": int(media_summary.get("registered_file_count", 0)),
        }
    )

    dictionary_expected = {
        path.as_posix(): (_sha256(root / path), "hsk_dictionary_csv")
        for path in DICTIONARY_FILES
        if (root / path).is_file()
    }
    dictionary_license_summary, dictionary_findings = _audit_registry(
        root=root,
        registry_relative_path=DICTIONARY_REGISTRY,
        expected_paths=dictionary_expected,
        fields=DICTIONARY_REGISTRY_FIELDS,
        type_field="dataset_type",
        review_code="DICTIONARY_LICENSE_REVIEW_REQUIRED",
    )
    media_summary["dictionary_source_registry"] = dictionary_license_summary
    return media_summary, media_findings + dictionary_findings


def _source_files(root: Path) -> tuple[Path, ...]:
    candidates: set[Path] = set()
    frontend_source = root / "frontend/src"
    if frontend_source.exists():
        candidates.update(
            item.resolve()
            for item in frontend_source.rglob("*")
            if item.is_file() and item.suffix.lower() in SOURCE_EXTENSIONS and ".test." not in item.name
        )
    seed_file = root / "backend/seed_lms.py"
    if seed_file.is_file():
        candidates.add(seed_file.resolve())
    return tuple(sorted(candidates, key=lambda item: _relative(item, root)))


def _looks_like_media_url(url: str) -> bool:
    lowered = url.lower().rstrip("),.;]")
    media_markers = tuple(MEDIA_EXTENSIONS | {".m3u8"})
    return any(marker in lowered for marker in media_markers)


def audit_source_hardcodes(root: Path) -> tuple[dict[str, object], list[Finding]]:
    findings: list[Finding] = []
    scanned_files = _source_files(root)
    for path in scanned_files:
        relative_path = _relative(path, root)
        gate = "baseline" if relative_path == "backend/seed_lms.py" else "structural"
        try:
            lines = path.read_text(encoding="utf-8-sig").splitlines()
        except UnicodeDecodeError:
            findings.append(
                Finding(
                    "SOURCE_ENCODING",
                    "high",
                    "structural",
                    relative_path,
                    "Source file could not be decoded as UTF-8.",
                )
            )
            continue
        for line_number, line in enumerate(lines, start=1):
            for match in REMOTE_URL_RE.finditer(line):
                url = match.group(0).rstrip("),.;]")
                if _looks_like_media_url(url):
                    findings.append(
                        Finding(
                            "HARDCODED_REMOTE_MEDIA_URL",
                            "high",
                            gate,
                            relative_path,
                            f"Raw remote media URL is embedded in source: {url}",
                            line=line_number,
                        )
                    )
            if SPECIAL_MEDIA_ID_RE.search(line):
                findings.append(
                    Finding(
                        "HARDCODED_MEDIA_ROUTE_ID",
                        "high",
                        "structural",
                        relative_path,
                        "A route-specific numeric course/lesson identifier controls media behavior.",
                        line=line_number,
                    )
                )
            for match in QUOTED_MEDIA_PATH_RE.finditer(line):
                value = match.group(1)
                if value.lower().startswith(("http://", "https://")):
                    continue
                findings.append(
                    Finding(
                        "HARDCODED_LOCAL_VIDEO_PATH",
                        "high",
                        gate,
                        relative_path,
                        f"Local video path is embedded in source: {value}",
                        line=line_number,
                    )
                )

    unique = {
        (item.code, item.severity, item.gate, item.path, item.line, item.message): item
        for item in findings
    }
    return {
        "scanned_file_count": len(scanned_files),
        "finding_count": len(unique),
    }, list(unique.values())


def run_audit(root: Path, *, scan_source: bool = True) -> AuditResult:
    root = root.resolve()
    dictionary_summary, dictionary_findings = audit_dictionary(root)
    media_summary, registry_findings = audit_registries(root)
    if scan_source:
        source_summary, source_findings = audit_source_hardcodes(root)
    else:
        source_summary, source_findings = {"scanned_file_count": 0, "finding_count": 0}, []
    return AuditResult(
        dictionary=dictionary_summary,
        media=media_summary,
        source_hardcodes=source_summary,
        findings=_sort_findings(dictionary_findings + registry_findings + source_findings),
    )


def _print_text(result: AuditResult, *, verbose: bool) -> None:
    counts = result.finding_counts()
    print("Phase 5 content/data/license audit")
    print(
        "Dictionary: "
        f"{result.dictionary['file_count']} files, "
        f"{result.dictionary['word_count']} words, "
        f"{result.dictionary['row_count']} senses"
    )
    print(
        "Media: "
        f"{result.media['asset_count']} assets "
        f"({result.media['image_count']} images, {result.media['video_count']} videos), "
        f"{result.media['registered_file_count']} registered"
    )
    print(
        f"Blockers: {len(result.structural_blockers())} structural, "
        f"{len(result.baseline_blockers())} provenance/review baseline"
    )
    print("Finding counts by code: " + json.dumps(counts["by_code"], ensure_ascii=False, sort_keys=True))

    visible = result.findings if verbose else result.structural_blockers()
    if visible:
        print("Findings:")
    for item in visible:
        location = f"{item.path}:{item.line}" if item.line else item.path
        print(f"- [{item.severity.upper()}][{item.gate}] {item.code} {location}: {item.message}")
    if not verbose and result.baseline_blockers():
        print("Baseline findings are recorded path-by-path in the registries; use --verbose or --format json to list all.")


def main(argv: Sequence[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(
        description="Audit Phase 5 HSK data, repository media provenance, checksums, and source hardcodes."
    )
    parser.add_argument("--repo-root", type=Path, default=_repo_root())
    parser.add_argument("--sync-registries", action="store_true")
    parser.add_argument("--skip-source-scan", action="store_true")
    parser.add_argument("--strict-licenses", action="store_true")
    parser.add_argument("--format", choices=("json", "text"), default="text")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args(argv)

    root = args.repo_root.resolve()
    if args.sync_registries:
        sync_registries(root)
    result = run_audit(root, scan_source=not args.skip_source_scan)
    if args.format == "json":
        print(json.dumps(result.as_dict(), ensure_ascii=False, indent=2, sort_keys=True))
    else:
        _print_text(result, verbose=args.verbose)

    if result.structural_blockers():
        return 2
    if args.strict_licenses and result.baseline_blockers():
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
