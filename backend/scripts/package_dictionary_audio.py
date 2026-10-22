"""Validate and package immutable audio, excluding local paths and review HTML."""
import argparse
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from scripts.dictionary_audio import file_digest, inspect_mp3, read_catalog
from scripts.import_dictionary_audio import publication_entries


def package(directory: Path, output: Path):
    entries, _ = publication_entries(directory, include_pending=True)
    catalog, catalog_sha = read_catalog()
    expected = {word["chinese"]: word for word in catalog}
    index = json.loads((directory / "index.json").read_text("utf-8"))
    if index["catalog_sha256"] != catalog_sha or len(entries) != len(expected):
        raise ValueError("Generated bundle does not match the current complete dictionary catalog")
    words = []
    paths = {}
    for entry in entries:
        if entry["pinyins"] != expected[entry["chinese"]]["pinyins"]:
            raise ValueError("Generated pronunciation metadata differs from the catalog")
        metrics = inspect_mp3(entry["source_path"])
        words.append({key: entry[key] for key in ["chinese", "pinyins", "review_reasons", "sha256", "audio_file"]} |
                     {"voice": index["voice"], "duration_seconds": metrics["duration_seconds"]})
        paths[entry["audio_file"]] = entry["source_path"]
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
        archive.writestr("index.json", json.dumps({"version": 1, "catalog_sha256": catalog_sha, "words": words}, ensure_ascii=False))
        for name, path in paths.items():
            archive.write(path, name)
    return {"sha256": file_digest(output), "size_bytes": output.stat().st_size,
            "catalog_sha256": catalog_sha, "word_count": len(words), "files": len(paths)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(package(args.directory, args.output)))
