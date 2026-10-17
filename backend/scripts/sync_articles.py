"""Publish reviewed article files without recreating IDs or deleting comments."""
import asyncio
import json
from pathlib import Path

from sqlalchemy import and_, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal, engine
from app.models.social import Article
from app.schemas.article_document import EditorialArticle

CATALOG_DIR = Path(__file__).resolve().parents[1] / "data" / "articles"


def read_catalog(directory: Path = CATALOG_DIR) -> list[EditorialArticle]:
    articles = [EditorialArticle.model_validate(json.loads(path.read_text(encoding="utf-8"))) for path in sorted(directory.glob("*.json"))]
    slugs = [article.slug for article in articles]
    if len(slugs) != len(set(slugs)):
        raise ValueError("Duplicate article slug in the editorial catalog")
    return articles


async def publish_articles(db: AsyncSession, articles: list[EditorialArticle]) -> None:
    for item in articles:
        values = {
            "slug": item.slug, "author_user_id": None, "title": item.title,
            "summary": item.summary, "content": item.plain_text(),
            "cover_image": item.cover_image, "document_json": item.document.model_dump(),
        }
        if len(values["content"]) > 50000:
            raise ValueError(f"Article content exceeds the API limit: {item.slug}")
        statement = insert(Article).values(**values)
        editable = {key: value for key, value in values.items() if key not in {"slug", "author_user_id"}}
        statement = statement.on_conflict_do_update(
            index_elements=[Article.slug],
            set_={**editable, "updated_at": func.now()},
            where=and_(
                Article.author_user_id.is_(None),
                or_(*(getattr(Article, key).is_distinct_from(value) for key, value in editable.items())),
            ),
        ).returning(Article.id)
        identifier = (await db.execute(statement)).scalar_one_or_none()
        if identifier is None:
            owner = await db.scalar(select(Article.author_user_id).where(Article.slug == item.slug))
            if owner is not None:
                raise ValueError(f"Editorial slug is owned by a user article: {item.slug}")


async def main() -> None:
    articles = read_catalog()
    try:
        async with SessionLocal.begin() as db:
            await publish_articles(db, articles)
        print(f"Editorial article catalog synchronized: {len(articles)}")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
