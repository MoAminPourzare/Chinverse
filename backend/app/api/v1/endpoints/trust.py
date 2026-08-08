from typing import Any

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import and_, delete, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.api import deps
from app.api.errors import bad_request, conflict, forbidden, not_found
from app.api.rate_limit import write_rate_limit
from app.core.storage import delete_public_file
from app.models.moderation import ContentReport, ModerationAction, UserBlock
from app.models.service import UserService
from app.models.social import (
    ArticleComment,
    Article,
    ContentComment,
    ForumAnswer,
    ForumQuestion,
    Message,
    Post,
    UserFollow,
)
from app.models.user import User, UserGalleryItem, UserStatus
from app.services.auth_security import add_audit_event, revoke_user_sessions, utc_now
from app.services.notifications import create_notification


router = APIRouter(prefix="/trust", tags=["trust"])


TARGET_MODELS = {
    "user": User,
    "post": Post,
    "comment": ContentComment,
    "question": ForumQuestion,
    "answer": ForumAnswer,
    "article": Article,
    "article_comment": ArticleComment,
    "gallery": UserGalleryItem,
    "service": UserService,
    "message": Message,
}


def _target_owner_id(target: Any) -> int | None:
    if isinstance(target, User):
        return target.id
    for attribute in ("author_user_id", "user_id", "sender_id"):
        owner_id = getattr(target, attribute, None)
        if owner_id is not None:
            return int(owner_id)
    return None


def _moderation_rank(user: User) -> int:
    if deps.is_admin_user(user):
        return 2
    if deps.is_moderator_user(user):
        return 1
    return 0


async def _load_target(
    db: AsyncSession,
    *,
    target_type: str,
    target_id: int,
) -> Any:
    model = TARGET_MODELS.get(target_type)
    if not model:
        raise bad_request("Unsupported report target")
    target = await db.get(model, target_id)
    if not target:
        raise not_found("Report target")
    return target


@router.post(
    "/blocks/{blocked_user_id}",
    response_model=schemas.BlockRead,
    dependencies=[Depends(write_rate_limit)],
)
async def block_user(
    blocked_user_id: int,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if blocked_user_id == current_user.id:
        raise bad_request("You cannot block yourself")
    if not await db.get(User, blocked_user_id):
        raise not_found("User")

    existing = await db.scalar(
        select(UserBlock).where(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == blocked_user_id,
        )
    )
    if existing:
        return {
            "blocked_user_id": existing.blocked_id,
            "created_at": existing.created_at,
        }

    block = UserBlock(
        blocker_id=current_user.id,
        blocked_id=blocked_user_id,
    )
    db.add(block)
    await db.execute(
        delete(UserFollow).where(
            or_(
                and_(
                    UserFollow.follower_id == current_user.id,
                    UserFollow.followee_id == blocked_user_id,
                ),
                and_(
                    UserFollow.follower_id == blocked_user_id,
                    UserFollow.followee_id == current_user.id,
                ),
            )
        )
    )
    await add_audit_event(
        db,
        event_type="trust.user_blocked",
        request=request,
        actor_user_id=current_user.id,
        subject=str(blocked_user_id),
    )
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = await db.scalar(
            select(UserBlock).where(
                UserBlock.blocker_id == current_user.id,
                UserBlock.blocked_id == blocked_user_id,
            )
        )
        if not existing:
            raise
        return {
            "blocked_user_id": existing.blocked_id,
            "created_at": existing.created_at,
        }
    await db.refresh(block)
    return {
        "blocked_user_id": block.blocked_id,
        "created_at": block.created_at,
    }


@router.delete(
    "/blocks/{blocked_user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(write_rate_limit)],
)
async def unblock_user(
    blocked_user_id: int,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> None:
    result = await db.execute(
        delete(UserBlock).where(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == blocked_user_id,
        )
    )
    if not result.rowcount:
        raise not_found("Block")
    await add_audit_event(
        db,
        event_type="trust.user_unblocked",
        request=request,
        actor_user_id=current_user.id,
        subject=str(blocked_user_id),
    )
    await db.commit()


@router.get("/blocks", response_model=list[schemas.BlockRead])
async def list_blocks(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    result = await db.execute(
        select(UserBlock)
        .where(UserBlock.blocker_id == current_user.id)
        .order_by(UserBlock.created_at.desc())
    )
    return [
        {
            "blocked_user_id": item.blocked_id,
            "created_at": item.created_at,
        }
        for item in result.scalars().all()
    ]


@router.post(
    "/reports",
    response_model=schemas.ReportRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(write_rate_limit)],
)
async def create_report(
    payload: schemas.ReportCreate,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    target = await _load_target(
        db,
        target_type=payload.target_type,
        target_id=payload.target_id,
    )
    if _target_owner_id(target) == current_user.id:
        raise bad_request("You cannot report your own account or content")
    if isinstance(target, Message) and current_user.id not in {
        target.sender_id,
        target.receiver_id,
    }:
        raise not_found("Report target")
    duplicate = await db.scalar(
        select(ContentReport.id).where(
            ContentReport.reporter_id == current_user.id,
            ContentReport.target_type == payload.target_type,
            ContentReport.target_id == payload.target_id,
            ContentReport.status.in_(["open", "reviewing"]),
        )
    )
    if duplicate:
        raise conflict("This content has already been reported")

    report = ContentReport(
        reporter_id=current_user.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        reason=payload.reason,
        details=(payload.details.strip() if payload.details else None),
        status="open",
    )
    db.add(report)
    await add_audit_event(
        db,
        event_type="trust.content_reported",
        request=request,
        actor_user_id=current_user.id,
        subject=f"{payload.target_type}:{payload.target_id}",
        details={"reason": payload.reason},
    )
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise conflict("This content has already been reported") from exc
    await db.refresh(report)
    return report


@router.get("/reports/me", response_model=list[schemas.ReportRead])
async def list_my_reports(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    result = await db.execute(
        select(ContentReport)
        .where(ContentReport.reporter_id == current_user.id)
        .order_by(ContentReport.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.get(
    "/moderation/access",
)
async def moderation_access(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    is_admin = deps.is_admin_user(current_user)
    return {
        "can_moderate": deps.is_moderator_user(current_user),
        "is_admin": is_admin,
        "mfa_ready": (
            not is_admin
            or (
                current_user.mfa_enabled
                and bool(getattr(current_user, "_auth_mfa_verified", False))
            )
        ),
    }


@router.get(
    "/moderation/reports",
    response_model=list[schemas.ReportRead],
)
async def moderation_queue(
    report_status: str = "open",
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_moderator_user),
) -> Any:
    _ = current_user
    if report_status not in {"open", "reviewing", "resolved", "dismissed"}:
        raise bad_request("Invalid report status")
    result = await db.execute(
        select(ContentReport)
        .where(ContentReport.status == report_status)
        .order_by(ContentReport.created_at)
        .limit(200)
    )
    return result.scalars().all()


@router.post(
    "/moderation/reports/{report_id}/claim",
    response_model=schemas.ReportRead,
    dependencies=[Depends(write_rate_limit)],
)
async def claim_report(
    report_id: int,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_moderator_user),
) -> Any:
    report = await db.scalar(
        select(ContentReport)
        .where(ContentReport.id == report_id)
        .with_for_update()
    )
    if not report:
        raise not_found("Report")
    if report.status in {"resolved", "dismissed"}:
        raise conflict("Report is already closed")
    if report.assigned_to not in {None, current_user.id}:
        raise conflict("Report is already assigned to another moderator")

    report.status = "reviewing"
    report.assigned_to = current_user.id
    await add_audit_event(
        db,
        event_type="moderation.report_claimed",
        request=request,
        actor_user_id=current_user.id,
        subject=str(report.id),
    )
    await db.commit()
    return report


@router.post(
    "/moderation/reports/{report_id}/resolve",
    response_model=schemas.ReportRead,
    dependencies=[Depends(write_rate_limit)],
)
async def resolve_report(
    report_id: int,
    payload: schemas.ModerationResolve,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_moderator_user),
) -> Any:
    result = await db.execute(
        select(ContentReport)
        .where(ContentReport.id == report_id)
        .with_for_update()
    )
    report = result.scalar_one_or_none()
    if not report:
        raise not_found("Report")
    if report.status in {"resolved", "dismissed"}:
        raise conflict("Report is already closed")
    if report.assigned_to not in {None, current_user.id} and not deps.is_admin_user(
        current_user
    ):
        raise conflict("Report is assigned to another moderator")

    target = None
    if payload.action in {"warn", "remove", "suspend_user"}:
        target = await _load_target(
            db,
            target_type=report.target_type,
            target_id=report.target_id,
        )
    public_url = None
    target_owner = None
    target_owner_id = _target_owner_id(target) if target is not None else None
    if target_owner_id is not None:
        target_owner = await db.get(User, target_owner_id)
    if (
        payload.action in {"warn", "remove"}
        and target_owner
        and _moderation_rank(target_owner) >= _moderation_rank(current_user)
    ):
        raise forbidden("You cannot moderate content owned by this account")

    if payload.action == "dismiss":
        report.status = "dismissed"
    else:
        report.status = "resolved"
        if payload.action == "suspend_user":
            if report.target_type != "user":
                raise bad_request("suspend_user requires a user report")
            if target.id == current_user.id or _moderation_rank(target) >= _moderation_rank(
                current_user
            ):
                raise forbidden("You cannot suspend this account")
            target.status = UserStatus.SUSPENDED
            await revoke_user_sessions(db, user_id=target.id)
        elif payload.action == "remove":
            if report.target_type == "user":
                raise bad_request("User accounts must be suspended, not removed")
            public_url = getattr(target, "image_url", None) or getattr(
                target,
                "banner_url",
                None,
            ) or getattr(target, "cover_image", None)
            await db.delete(target)

    if payload.action in {"warn", "remove"} and target_owner_id:
        await create_notification(
            db,
            user_id=target_owner_id,
            type="moderation",
            title=(
                "هشدار درباره قوانین جامعه"
                if payload.action == "warn"
                else "رسیدگی به محتوای شما"
            ),
            body=(
                "یکی از فعالیت‌های حسابت با قوانین جامعه سازگار تشخیص داده نشد. برای بازبینی از پشتیبانی کمک بگیر."
                if payload.action == "warn"
                else "محتوای گزارش‌شده پس از بررسی حذف شد. برای درخواست بازبینی از پشتیبانی کمک بگیر."
            ),
            target_url="/support",
            metadata={"report_id": report.id, "action": payload.action},
            commit=False,
        )
    if report.reporter_id and report.reporter_id != current_user.id:
        await create_notification(
            db,
            user_id=report.reporter_id,
            type="moderation",
            title="گزارش شما بررسی شد",
            body="تیم بررسی، گزارش ثبت‌شده را رسیدگی کرد. جزئیات داخلی بررسی محرمانه می‌ماند.",
            target_url="/support",
            metadata={"report_id": report.id, "status": report.status},
            commit=False,
        )

    report.assigned_to = current_user.id
    report.resolution = payload.action
    report.resolved_at = utc_now()
    db.add(
        ModerationAction(
            report_id=report.id,
            moderator_id=current_user.id,
            action=payload.action,
            target_type=report.target_type,
            target_id=report.target_id,
            notes=payload.notes.strip() if payload.notes else None,
        )
    )
    await add_audit_event(
        db,
        event_type="moderation.action",
        request=request,
        actor_user_id=current_user.id,
        subject=f"{report.target_type}:{report.target_id}",
        details={"action": payload.action, "report_id": report.id},
    )
    await db.commit()
    if public_url:
        await delete_public_file(public_url)
    return report
