import importlib.util
import json
from pathlib import Path
from zipfile import ZipFile

import pytest
from pydantic import ValidationError

from app.schemas.article_document import EditorialArticle
from scripts.sync_articles import read_catalog


ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("word_article_import", ROOT / "scripts/import_word_article.py")
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


def test_first_article_has_complete_sections_and_local_cover():
    article = read_catalog()[0]
    assert article.slug == "staying-motivated-learning-chinese"
    assert len(article.document.blocks) == 32
    assert len([block for block in article.document.blocks if block.type == "heading"]) == 8
    assert "برای امروز فقط یک کار انتخاب کن" in article.plain_text()
    assert (ROOT / "frontend/public" / article.cover_image.lstrip("/")).is_file()


def test_word_import_preserves_text_emphasis_image_and_original(tmp_path):
    source = tmp_path / "sample.docx"
    xml = '''<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
    <w:p><w:r><w:t>چین‌ورس | یادگیری بهتر</w:t></w:r></w:p>
    <w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>عنوان مقاله</w:t></w:r></w:p>
    <w:p><w:r><w:t>خلاصهٔ مقاله</w:t></w:r></w:p>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>بخش اول</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">شروع </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>تأکید</w:t></w:r><w:r><w:t xml:space="preserve"> پایان</w:t></w:r></w:p>
    </w:body></w:document>'''
    image = b"unchanged original illustration"
    with ZipFile(source, "w") as archive:
        archive.writestr("word/document.xml", xml)
        archive.writestr("word/media/image1.png", image)
    original = source.read_bytes()
    data, extracted = importer.read_word_article(source, "sample-article")
    article = EditorialArticle.model_validate(data)
    assert article.document.category == "یادگیری بهتر"
    assert article.document.subtitle == "خلاصهٔ مقاله"
    assert article.plain_text() == "بخش اول\n\nشروع تأکید پایان"
    assert article.document.blocks[1].spans[1].bold
    assert extracted == image
    assert source.read_bytes() == original


@pytest.mark.parametrize("change", [
    {"slug": "../unsafe"},
    {"cover_image": "https://untrusted.test/image.png"},
    {"document": {"version": 2, "category": "test", "blocks": []}},
    {"document": {"version": 1, "category": "test", "blocks": [{"type": "html", "html": "<script>"}]}},
])
def test_catalog_rejects_unsupported_versions_markup_and_asset_paths(change):
    data = json.loads((ROOT / "backend/data/articles/staying-motivated-learning-chinese.json").read_text(encoding="utf-8"))
    data.update(change)
    with pytest.raises(ValidationError):
        EditorialArticle.model_validate(data)


def test_duplicate_slugs_are_rejected_before_publication(tmp_path):
    data = (ROOT / "backend/data/articles/staying-motivated-learning-chinese.json").read_text(encoding="utf-8")
    (tmp_path / "one.json").write_text(data, encoding="utf-8")
    (tmp_path / "two.json").write_text(data, encoding="utf-8")
    with pytest.raises(ValueError, match="Duplicate"):
        read_catalog(tmp_path)
