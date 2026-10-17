"""Versioned, plain-text article blocks. HTML is never part of this format."""
from typing import Annotated, Literal
from pydantic import BaseModel, Field


class TextSpan(BaseModel):
    text: str = Field(max_length=8000)
    bold: bool = False


class TextBlock(BaseModel):
    type: Literal["paragraph", "quote"]
    spans: list[TextSpan] = Field(min_length=1, max_length=100)


class HeadingBlock(BaseModel):
    type: Literal["heading"]
    text: str = Field(min_length=1, max_length=300)
    level: Literal[2, 3] = 2


class ListBlock(BaseModel):
    type: Literal["list"]
    items: list[str] = Field(min_length=1, max_length=100)
    ordered: bool = False


class ImageBlock(BaseModel):
    type: Literal["image"]
    src: str = Field(pattern=r"^/assets/chinverse/articles/[a-z0-9/_-]+\.(png|jpg|jpeg|webp)$")
    alt: str = Field(min_length=1, max_length=300)
    caption: str | None = Field(default=None, max_length=500)


ArticleBlock = Annotated[TextBlock | HeadingBlock | ListBlock | ImageBlock, Field(discriminator="type")]


class ArticleDocument(BaseModel):
    version: Literal[1] = 1
    category: str = Field(min_length=1, max_length=64)
    subtitle: str | None = Field(default=None, max_length=500)
    blocks: list[ArticleBlock] = Field(min_length=1, max_length=300)


class EditorialArticle(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=160)
    title: str = Field(min_length=3, max_length=180)
    summary: str = Field(min_length=1, max_length=500)
    cover_image: str | None = Field(default=None, pattern=r"^/assets/chinverse/articles/[a-z0-9/_-]+\.(png|jpg|jpeg|webp)$")
    document: ArticleDocument

    def plain_text(self) -> str:
        paragraphs = []
        for block in self.document.blocks:
            if isinstance(block, TextBlock):
                paragraphs.append("".join(span.text for span in block.spans))
            elif isinstance(block, HeadingBlock):
                paragraphs.append(block.text)
            elif isinstance(block, ListBlock):
                paragraphs.extend(block.items)
            elif block.caption:
                paragraphs.append(block.caption)
        return "\n\n".join(paragraphs)
