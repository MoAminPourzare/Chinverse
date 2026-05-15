from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import bad_request, not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.models.social import ForumQuestion, ForumAnswer, Article, ArticleComment, SupportTicket
from app.models.user import User
from app.schemas import community as schemas
from app.services.notifications import notify_followers

router = APIRouter()


def build_user_summary(user: Optional[User]) -> Optional[schemas.UserSummary]:
    if not user or not user.profile:
        return None
    return schemas.UserSummary(
        id=user.id,
        display_name=user.profile.display_name,
        avatar_url=user.profile.avatar_url,
    )


def build_answer_read(answer: ForumAnswer) -> schemas.ForumAnswerRead:
    return schemas.ForumAnswerRead(
        id=answer.id,
        question_id=answer.question_id,
        author_user_id=answer.author_user_id,
        parent_id=answer.parent_id,
        content=answer.body,
        created_at=answer.created_at,
        author=build_user_summary(answer.author),
    )


def build_article_comment_read(comment: ArticleComment) -> schemas.ArticleCommentRead:
    return schemas.ArticleCommentRead(
        id=comment.id,
        article_id=comment.article_id,
        author_user_id=comment.author_user_id,
        parent_id=comment.parent_id,
        content=comment.body,
        created_at=comment.created_at,
        author=build_user_summary(comment.author),
    )


def build_article_read(article: Article, comments_count: int = 0) -> schemas.ArticleRead:
    return schemas.ArticleRead(
        id=article.id,
        title=article.title,
        summary=article.summary,
        content=article.content,
        cover_image=article.cover_image,
        author_user_id=article.author_user_id,
        author=build_user_summary(article.author),
        created_at=article.created_at,
        comments_count=comments_count,
    )


# ===== FORUM QUESTIONS =====

@router.get("/forum/questions", response_model=List[schemas.ForumQuestionRead])
async def get_forum_questions(
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
):
    """
    Get list of forum questions (latest first).
    """
    answer_counts = (
        select(
            ForumAnswer.question_id,
            func.count(ForumAnswer.id).label("answers_count"),
        )
        .group_by(ForumAnswer.question_id)
        .subquery()
    )

    query = (
        select(ForumQuestion, func.coalesce(answer_counts.c.answers_count, 0))
        .outerjoin(answer_counts, ForumQuestion.id == answer_counts.c.question_id)
        .options(selectinload(ForumQuestion.author).selectinload(User.profile))
        .order_by(ForumQuestion.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    result = await db.execute(query)
    questions = result.all()

    # Transform to response format
    response = []
    for q, answers_count in questions:
        response.append(schemas.ForumQuestionRead(
            id=q.id,
            title=q.title,
            content=q.body,  # Note: model uses 'body', schema uses 'content'
            author_user_id=q.author_user_id,
            created_at=q.created_at,
            author=build_user_summary(q.author),
            answers_count=answers_count or 0
        ))
    
    return response


@router.post("/forum/questions", response_model=schemas.ForumQuestionRead)
async def create_forum_question(
    question_in: schemas.ForumQuestionCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
):
    """
    Create a new forum question.
    """
    title = question_in.title.strip()
    content = question_in.content.strip()
    if not title or not content:
        raise bad_request("Question cannot be empty")

    question = ForumQuestion(
        author_user_id=current_user.id,
        title=title,
        body=content,  # Note: schema uses 'content', model uses 'body'
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    try:
        display_name = current_user.profile.display_name if current_user.profile else "Chinverse user"
        await notify_followers(
            db,
            actor_user_id=current_user.id,
            type="forum",
            title="بحث جدید در تالار",
            body=f"{display_name} یک سؤال جدید پرسید: {question.title}",
            target_url="/community",
            metadata={"question_id": question.id},
        )
    except Exception:
        await db.rollback()

    # Get author info
    return schemas.ForumQuestionRead(
        id=question.id,
        title=question.title,
        content=question.body,
        author_user_id=question.author_user_id,
        created_at=question.created_at,
        author=build_user_summary(current_user),
        answers_count=0
    )


@router.get("/forum/questions/{question_id}", response_model=schemas.ForumQuestionDetailRead)
async def get_forum_question_detail(
    question_id: int,
    db: AsyncSession = Depends(deps.get_db),
):
    result = await db.execute(
        select(ForumQuestion)
        .options(selectinload(ForumQuestion.author).selectinload(User.profile))
        .where(ForumQuestion.id == question_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        raise not_found("Forum question")

    answers_result = await db.execute(
        select(ForumAnswer)
        .options(selectinload(ForumAnswer.author).selectinload(User.profile))
        .where(ForumAnswer.question_id == question_id)
        .order_by(ForumAnswer.created_at.asc(), ForumAnswer.id.asc())
    )
    answers = answers_result.scalars().all()

    return schemas.ForumQuestionDetailRead(
        id=question.id,
        title=question.title,
        content=question.body,
        author_user_id=question.author_user_id,
        created_at=question.created_at,
        author=build_user_summary(question.author),
        answers_count=len(answers),
        answers=[build_answer_read(answer) for answer in answers],
    )


@router.post("/forum/questions/{question_id}/answers", response_model=schemas.ForumAnswerRead)
async def create_forum_answer(
    question_id: int,
    answer_in: schemas.ForumAnswerCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
):
    content = answer_in.content.strip()
    if not content:
        raise bad_request("Answer cannot be empty")

    question_result = await db.execute(select(ForumQuestion).where(ForumQuestion.id == question_id))
    question = question_result.scalar_one_or_none()
    if not question:
        raise not_found("Forum question")

    if answer_in.parent_id:
        parent_result = await db.execute(
            select(ForumAnswer).where(
                ForumAnswer.id == answer_in.parent_id,
                ForumAnswer.question_id == question_id,
            )
        )
        if not parent_result.scalar_one_or_none():
            raise bad_request("Parent answer does not belong to this question")

    answer = ForumAnswer(
        question_id=question_id,
        author_user_id=current_user.id,
        parent_id=answer_in.parent_id,
        body=content,
    )
    db.add(answer)
    await db.commit()
    await db.refresh(answer)

    answer.author = current_user
    return build_answer_read(answer)


# ===== ARTICLES =====

@router.get("/forum/articles", response_model=List[schemas.ArticleRead])
async def get_articles(
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
):
    """
    Get list of articles (latest first).
    """
    comment_counts = (
        select(
            ArticleComment.article_id,
            func.count(ArticleComment.id).label("comments_count"),
        )
        .group_by(ArticleComment.article_id)
        .subquery()
    )

    query = (
        select(Article, func.coalesce(comment_counts.c.comments_count, 0))
        .outerjoin(comment_counts, Article.id == comment_counts.c.article_id)
        .options(selectinload(Article.author).selectinload(User.profile))
        .order_by(Article.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    result = await db.execute(query)
    articles = result.all()
    
    return [
        build_article_read(article, comments_count or 0)
        for article, comments_count in articles
    ]


@router.post("/forum/articles", response_model=schemas.ArticleRead)
async def create_article(
    article_in: schemas.ArticleCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
):
    title = article_in.title.strip()
    content = article_in.content.strip()
    summary = article_in.summary.strip() if article_in.summary else None
    if not title or not content:
        raise bad_request("Article title and content are required")

    article = Article(
        author_user_id=current_user.id,
        title=title,
        summary=summary,
        content=content,
        cover_image=article_in.cover_image,
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)
    article.author = current_user

    return build_article_read(article, 0)


@router.get("/forum/articles/{article_id}", response_model=schemas.ArticleDetailRead)
async def get_article_detail(
    article_id: int,
    db: AsyncSession = Depends(deps.get_db),
):
    result = await db.execute(
        select(Article)
        .options(selectinload(Article.author).selectinload(User.profile))
        .where(Article.id == article_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise not_found("Article")

    comments_result = await db.execute(
        select(ArticleComment)
        .options(selectinload(ArticleComment.author).selectinload(User.profile))
        .where(ArticleComment.article_id == article_id)
        .order_by(ArticleComment.created_at.asc(), ArticleComment.id.asc())
    )
    comments = comments_result.scalars().all()
    article_read = build_article_read(article, len(comments))

    return schemas.ArticleDetailRead(
        **article_read.model_dump(),
        comments=[build_article_comment_read(comment) for comment in comments],
    )


@router.post("/forum/articles/{article_id}/comments", response_model=schemas.ArticleCommentRead)
async def create_article_comment(
    article_id: int,
    comment_in: schemas.ArticleCommentCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
):
    content = comment_in.content.strip()
    if not content:
        raise bad_request("Comment cannot be empty")

    article_result = await db.execute(select(Article).where(Article.id == article_id))
    if not article_result.scalar_one_or_none():
        raise not_found("Article")

    if comment_in.parent_id:
        parent_result = await db.execute(
            select(ArticleComment).where(
                ArticleComment.id == comment_in.parent_id,
                ArticleComment.article_id == article_id,
            )
        )
        if not parent_result.scalar_one_or_none():
            raise bad_request("Parent comment does not belong to this article")

    comment = ArticleComment(
        article_id=article_id,
        author_user_id=current_user.id,
        parent_id=comment_in.parent_id,
        body=content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    comment.author = current_user
    return build_article_comment_read(comment)


# ===== SUPPORT =====

@router.post("/support", response_model=schemas.SupportTicketResponse)
async def submit_support_ticket(
    ticket_in: schemas.SupportTicketCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
):
    """
    Submit a support ticket.
    """
    message = ticket_in.message.strip()
    if not message:
        raise bad_request("Message cannot be empty")
    
    ticket = SupportTicket(
        user_id=current_user.id,
        message=message,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    return schemas.SupportTicketResponse(
        success=True,
        message="پیامت به دست ما رسید. تیم پشتیبانی چین‌ورس به‌زودی بررسی می‌کند و پاسخ می‌دهد.",
        ticket_id=ticket.id
    )
