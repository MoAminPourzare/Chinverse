from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.social import ForumQuestion, ForumAnswer, Article, SupportTicket
from app.models.user import User, UserProfile
from app.schemas import community as schemas

router = APIRouter()


# ===== FORUM QUESTIONS =====

@router.get("/forum/questions", response_model=List[schemas.ForumQuestionRead])
async def get_forum_questions(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 20,
):
    """
    Get list of forum questions (latest first).
    """
    # Query questions with author info
    query = (
        select(ForumQuestion)
        .options(selectinload(ForumQuestion.author).selectinload(User.profile))
        .options(selectinload(ForumQuestion.answers))
        .order_by(ForumQuestion.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    questions = result.scalars().all()

    # Transform to response format
    response = []
    for q in questions:
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
            answers_count=len(q.answers) if q.answers else 0
        ))
    
    return response


@router.post("/forum/questions", response_model=schemas.ForumQuestionRead)
async def create_forum_question(
    question_in: schemas.ForumQuestionCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Create a new forum question.
    """
    question = ForumQuestion(
        author_user_id=current_user.id,
        title=question_in.title,
        body=question_in.content,  # Note: schema uses 'content', model uses 'body'
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
    skip: int = 0,
    limit: int = 20,
):
    """
    Get list of articles (latest first).
    """
    query = (
        select(Article)
        .order_by(Article.created_at.desc())
        .offset(skip)
        .limit(limit)
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
):
    """
    Submit a support ticket.
    """
    if not ticket_in.message or len(ticket_in.message.strip()) == 0:
        raise HTTPException(status_code=400, detail="پیام نمی‌تواند خالی باشد")
    
    ticket = SupportTicket(
        user_id=current_user.id,
        message=ticket_in.message.strip(),
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    return schemas.SupportTicketResponse(
        success=True,
        message="پیامت به دست ما رسید! تیم پشتیبانی چین‌ورس به‌زودی بررسیش می‌کنه و پاسخ میده.",
        ticket_id=ticket.id
    )
