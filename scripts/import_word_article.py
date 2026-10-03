"""Convert the owner's Word template into the app's versioned article catalog.

The original DOCX is read only. Images are copied byte-for-byte.
"""
import argparse
import json
from pathlib import Path
import re
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
W = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
VAL = "{" + W["w"] + "}val"


def read_word_article(source: Path, slug: str, category: str | None = None) -> tuple[dict, bytes | None]:
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise ValueError("Use a stable lowercase slug with hyphens")
    with ZipFile(source) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
        if root.findall(".//w:tbl", W):
            raise ValueError("This Word template does not support tables; add table support before importing")
        paragraphs = []
        for paragraph in root.findall(".//w:body/w:p", W):
            if paragraph.find("w:pPr/w:numPr", W) is not None:
                raise ValueError("Numbered Word lists need an explicit list block; automatic import will not discard numbering")
            style_node = paragraph.find("w:pPr/w:pStyle", W)
            style = style_node.get(VAL) if style_node is not None else ""
            spans = []
            for run in paragraph.findall(".//w:r", W):
                text = "".join(node.text or "" if node.tag == "{" + W["w"] + "}t" else "\t" if node.tag == "{" + W["w"] + "}tab" else "\n" if node.tag in {"{" + W["w"] + "}br", "{" + W["w"] + "}cr"} else "" for node in run)
                if not text:
                    continue
                bold_node = run.find("w:rPr/w:b", W)
                bold = bold_node is not None and bold_node.get(VAL) not in {"0", "false", "off"}
                if spans and spans[-1]["bold"] == bold:
                    spans[-1]["text"] += text
                else:
                    spans.append({"text": text, "bold": bold})
            text = "".join(span["text"] for span in spans)
            if text.strip():
                paragraphs.append({"text": text, "style": style, "spans": spans})
        titles = [index for index, paragraph in enumerate(paragraphs) if paragraph["style"] == "Title"]
        if len(titles) != 1:
            raise ValueError("The template must contain exactly one paragraph with Word's Title style")
        title_index = titles[0]
        if title_index > 1 or title_index + 2 >= len(paragraphs):
            raise ValueError("Use an optional brand line, then the title, subtitle and article body")
        subtitle = paragraphs[title_index + 1]["text"]
        prefix = paragraphs[0]["text"] if title_index else ""
        category = category or (prefix.split("|")[-1].strip() if "|" in prefix else "یادگیری بهتر")
        blocks = []
        for paragraph in paragraphs[title_index + 2:]:
            if paragraph["style"] in {"Heading1", "Heading2"}:
                blocks.append({"type": "heading", "text": paragraph["text"], "level": 2 if paragraph["style"] == "Heading1" else 3})
            else:
                kind = "quote" if all(span["bold"] for span in paragraph["spans"]) else "paragraph"
                blocks.append({"type": kind, "spans": paragraph["spans"]})
        media = [name for name in archive.namelist() if name.startswith("word/media/")]
        if len(media) > 1:
            raise ValueError("The current Word template has one cover image; import additional figures explicitly")
        image = archive.read(media[0]) if media else None
        if media and not media[0].lower().endswith(".png"):
            raise ValueError("The cover in this Word template must be PNG")
    article = {
        "slug": slug, "title": paragraphs[title_index]["text"], "summary": subtitle,
        "cover_image": f"/assets/chinverse/articles/{slug}/cover.png" if image else None,
        "document": {"version": 1, "category": category, "subtitle": subtitle, "blocks": blocks},
    }
    return article, image


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--slug", required=True)
    parser.add_argument("--category")
    args = parser.parse_args()
    article, image = read_word_article(args.source, args.slug, args.category)
    target = ROOT / "backend" / "data" / "articles" / f"{args.slug}.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(article, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if image:
        cover = ROOT / "frontend" / "public" / article["cover_image"].lstrip("/")
        cover.parent.mkdir(parents=True, exist_ok=True)
        cover.write_bytes(image)
    print(f"Imported {args.slug}: {len(article['document']['blocks'])} blocks; source unchanged")


if __name__ == "__main__":
    main()
