from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import bad_request
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.models.social import ForumQuestion, ForumAnswer, Article, SupportTicket
from app.models.user import User, UserProfile
from app.schemas import community as schemas

router = APIRouter()


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
        author_summary = None
        if q.author and q.author.profile:
            author_summary = schemas.UserSummary(
                id=q.author.id,
                display_name=q.author.profile.display_name,
                avatar_url=q.author.profile.avatar_url
            )
        response.append(schemas.ForumQuestionRead(
            id=q.id,
            title=q.title,
            content=q.body,  # Note: model uses 'body', schema uses 'content'
            author_user_id=q.author_user_id,
            created_at=q.created_at,
            author=author_summary,
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

    # Get author info
    author_summary = None
    if current_user.profile:
        author_summary = schemas.UserSummary(
            id=current_user.id,
            display_name=current_user.profile.display_name,
            avatar_url=current_user.profile.avatar_url
        )

    return schemas.ForumQuestionRead(
        id=question.id,
        title=question.title,
        content=question.body,
        author_user_id=question.author_user_id,
        created_at=question.created_at,
        author=author_summary,
        answers_count=0
    )


# ===== ARTICLES =====

@router.get("/forum/articles", response_model=List[schemas.ArticleRead])
async def get_articles(
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
):
    """
    Get list of articles (latest first).
    """
    query = (
        select(Article)
        .order_by(Article.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    result = await db.execute(query)
    articles = result.scalars().all()
    
    return [
        schemas.ArticleRead(
            id=a.id,
            title=a.title,
            summary=a.summary,
            content=a.content,
            cover_image=a.cover_image,
            created_at=a.created_at
        )
        for a in articles
    ]


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
        message="پیامت به دست ما رسید! تیم پشتیبانی چین‌ورس به‌زودی بررسیش می‌کنه و پاسخ میده.",
        ticket_id=ticket.id
    )
