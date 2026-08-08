from datetime import timedelta
from typing import Any

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Cookie,
    Depends,
    Header,
    Request,
    Response,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app import schemas
from app.api import deps
from app.api.errors import bad_request, conflict, forbidden, not_found, unauthorized
from app.api.rate_limit import (
    auth_challenge_rate_limit,
    auth_login_rate_limit,
    auth_signup_rate_limit,
    enforce_rate_limit,
)
from app.core import security
from app.core.config import settings
from app.core.legal import LEGAL_DOCUMENT_VERSIONS
from app.core.passwords import PASSWORD_MAX_LENGTH, password_contains_account_data
from app.core.request import client_ip
from app.models.security import AuthSession, LegalAcceptance
from app.models.user import User, UserProfile, UserStatus
from app.services.auth_security import (
    add_audit_event,
    clear_refresh_cookie,
    consume_challenge,
    consume_user_challenge,
    create_challenge,
    create_session,
    dispatch_challenge,
    replace_backup_codes,
    request_fingerprints,
    revoke_refresh_session,
    revoke_user_sessions,
    rotate_session,
    set_refresh_cookie,
    token_response,
    utc_now,
    verify_mfa_code,
)
from app.services.referrals import (
    apply_referral_code,
    get_or_create_referral_code,
    get_referrer_id_by_code,
)
from app.services.turnstile import verify_turnstile


router = APIRouter()
DUMMY_PASSWORD_HASH = security.get_password_hash("Invalid-password-for-timing-123")


def _debug_token(token: str) -> str | None:
    return token if settings.AUTH_DEBUG_TOKENS else None


def _request_ip(request: Request) -> str | None:
    return client_ip(request)


async def _record_failed_login(
    db: AsyncSession,
    *,
    user: User | None,
    request: Request,
    subject: str,
    increment_attempts: bool = True,
) -> None:
    if user and increment_attempts:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.LOGIN_MAX_FAILURES:
            user.locked_until = utc_now() + timedelta(
                minutes=settings.LOGIN_LOCK_MINUTES
            )
            user.failed_login_attempts = 0
    await add_audit_event(
        db,
        event_type="auth.login_failed",
        request=request,
        actor_user_id=user.id if user else None,
        subject=subject,
    )
    await db.commit()


@router.post("/login/access-token", response_model=schemas.Token)
async def login_access_token(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(deps.get_db),
    mfa_code: str | None = Header(default=None, alias="X-MFA-Code"),
    turnstile_token: str | None = Header(
        default=None,
        alias="X-Turnstile-Token",
    ),
    _rate_limit: None = Depends(auth_login_rate_limit),
) -> Any:
    await verify_turnstile(
        token=turnstile_token,
        remote_ip=_request_ip(request),
        expected_action="login",
    )

    email = form_data.username.strip().lower()
    await enforce_rate_limit(
        request,
        name="auth-login-account",
        max_requests=settings.RATE_LIMIT_ACCOUNT_LOGIN_REQUESTS,
        window_seconds=settings.RATE_LIMIT_ACCOUNT_LOGIN_WINDOW_SECONDS,
        discriminator=email,
    )
    subject = security.hash_secret(email)
    result = await db.execute(select(User).where(func.lower(User.email) == email))
    user = result.scalar_one_or_none()

    password_in_bounds = len(form_data.password) <= PASSWORD_MAX_LENGTH
    password_hash = user.password_hash if user and password_in_bounds else DUMMY_PASSWORD_HASH
    password_valid = security.verify_password(
        form_data.password if password_in_bounds else "Invalid-password-for-timing-123",
        password_hash,
    )
    account_locked = bool(user and user.locked_until and user.locked_until > utc_now())
    if not user or not password_valid or account_locked:
        await _record_failed_login(
            db,
            user=user,
            request=request,
            subject=subject,
            increment_attempts=not account_locked,
        )
        raise unauthorized("Incorrect email or password")

    if user.status != UserStatus.ACTIVE:
        raise forbidden("Inactive user")
    mfa_verified = False
    if deps.is_admin_user(user) and user.mfa_enabled:
        if not mfa_code or not await verify_mfa_code(db, user=user, code=mfa_code):
            await _record_failed_login(
                db,
                user=user,
                request=request,
                subject=subject,
            )
            raise unauthorized("MFA code is required or invalid")
        mfa_verified = True

    if security.password_hash_needs_update(user.password_hash):
        user.password_hash = security.get_password_hash(form_data.password)
        user.password_changed_at = utc_now()

    user.failed_login_attempts = 0
    user.locked_until = None
    auth_session, refresh_token = await create_session(
        db,
        user=user,
        request=request,
        mfa_verified=mfa_verified,
    )
    await add_audit_event(
        db,
        event_type="auth.login_succeeded",
        request=request,
        actor_user_id=user.id,
        subject=subject,
        details={"mfa": mfa_verified},
    )
    await db.commit()
    set_refresh_cookie(response, refresh_token)
    return token_response(user, auth_session, mfa_verified=mfa_verified)


@router.post("/auth/refresh", response_model=schemas.Token)
async def refresh_access_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(deps.get_db),
    refresh_token: str | None = Cookie(
        default=None,
        alias=settings.REFRESH_COOKIE_NAME,
    ),
) -> Any:
    if not refresh_token:
        raise unauthorized("Session is invalid or expired")

    user, auth_session, rotated_token = await rotate_session(
        db,
        refresh_token=refresh_token,
        request=request,
    )
    if user.status != UserStatus.ACTIVE:
        auth_session.revoked_at = utc_now()
        await db.commit()
        raise forbidden("Inactive user")
    mfa_verified = bool(auth_session.mfa_verified_at)
    await add_audit_event(
        db,
        event_type="auth.session_refreshed",
        request=request,
        actor_user_id=user.id,
        subject=auth_session.id,
    )
    await db.commit()
    set_refresh_cookie(response, rotated_token)
    return token_response(user, auth_session, mfa_verified=mfa_verified)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(deps.get_db),
    refresh_token: str | None = Cookie(
        default=None,
        alias=settings.REFRESH_COOKIE_NAME,
    ),
) -> None:
    await revoke_refresh_session(db, refresh_token=refresh_token)
    await add_audit_event(
        db,
        event_type="auth.logout",
        request=request,
        subject=(security.hash_secret(refresh_token) if refresh_token else None),
    )
    await db.commit()
    clear_refresh_cookie(response)


@router.post("/auth/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_session_user),
) -> None:
    await revoke_user_sessions(db, user_id=current_user.id)
    await add_audit_event(
        db,
        event_type="auth.logout_all",
        request=request,
        actor_user_id=current_user.id,
    )
    await db.commit()
    clear_refresh_cookie(response)


@router.get("/auth/sessions", response_model=list[schemas.SessionRead])
async def list_sessions(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    result = await db.execute(
        select(AuthSession)
        .where(
            AuthSession.user_id == current_user.id,
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > utc_now(),
        )
        .order_by(AuthSession.last_used_at.desc())
    )
    current_session_id = getattr(current_user, "_auth_session_id", None)
    return [
        {
            "id": item.id,
            "created_at": item.created_at,
            "last_used_at": item.last_used_at,
            "expires_at": item.expires_at,
            "current": item.id == current_session_id,
            "mfa_verified": bool(item.mfa_verified_at),
        }
        for item in result.scalars().all()
    ]


@router.delete(
    "/auth/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_session(
    session_id: str,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> None:
    result = await db.execute(
        update(AuthSession)
        .where(
            AuthSession.id == session_id,
            AuthSession.user_id == current_user.id,
            AuthSession.revoked_at.is_(None),
        )
        .values(revoked_at=utc_now())
    )
    if not result.rowcount:
        raise not_found("Session")
    await add_audit_event(
        db,
        event_type="auth.session_revoked",
        request=request,
        actor_user_id=current_user.id,
        subject=session_id,
    )
    await db.commit()


@router.post(
    "/auth/password/change",
    response_model=schemas.MessageResponse,
    dependencies=[Depends(auth_challenge_rate_limit)],
)
async def change_password(
    payload: schemas.PasswordChange,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if not security.verify_password(
        payload.current_password,
        current_user.password_hash,
    ):
        raise unauthorized("Current password is incorrect")
    if security.verify_password(payload.new_password, current_user.password_hash):
        raise bad_request("New password must be different")
    if password_contains_account_data(
        payload.new_password,
        current_user.email.split("@", 1)[0],
        current_user.phone,
    ):
        raise bad_request("رمز عبور نباید شامل ایمیل یا شماره موبایل باشد")

    current_user.password_hash = security.get_password_hash(payload.new_password)
    current_user.password_changed_at = utc_now()
    await revoke_user_sessions(db, user_id=current_user.id)
    await add_audit_event(
        db,
        event_type="auth.password_changed",
        request=request,
        actor_user_id=current_user.id,
    )
    await db.commit()
    clear_refresh_cookie(response)
    return {"message": "Password changed. Please sign in again."}


@router.post(
    "/auth/password/reset/request",
    response_model=schemas.MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def request_password_reset(
    payload: schemas.PasswordResetRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_db),
    _rate_limit: None = Depends(auth_signup_rate_limit),
) -> Any:
    await verify_turnstile(
        token=payload.turnstile_token,
        remote_ip=_request_ip(request),
        expected_action="password_reset",
    )
    email = str(payload.email).strip().lower()
    await enforce_rate_limit(
        request,
        name="password-reset-account",
        max_requests=settings.RATE_LIMIT_ACCOUNT_LOGIN_REQUESTS,
        window_seconds=settings.RATE_LIMIT_ACCOUNT_LOGIN_WINDOW_SECONDS,
        discriminator=email,
    )
    user = await db.scalar(select(User).where(func.lower(User.email) == email))
    debug_token = None
    if user:
        token = await create_challenge(
            db,
            user=user,
            purpose="password_reset",
            destination=email,
            ttl_minutes=30,
        )
        await add_audit_event(
            db,
            event_type="auth.password_reset_requested",
            request=request,
            actor_user_id=user.id,
            subject=security.hash_secret(email),
        )
        await db.commit()
        background_tasks.add_task(
            dispatch_challenge,
            purpose="password_reset",
            destination=email,
            token=token,
        )
        debug_token = _debug_token(token)
    return {
        "message": "If the account exists, reset instructions have been sent.",
        "debug_token": debug_token,
    }


@router.post(
    "/auth/password/reset/confirm",
    response_model=schemas.MessageResponse,
    dependencies=[Depends(auth_challenge_rate_limit)],
)
async def confirm_password_reset(
    payload: schemas.PasswordResetConfirm,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    user = await consume_challenge(
        db,
        token=payload.token,
        purpose="password_reset",
    )
    if password_contains_account_data(
        payload.new_password,
        user.email.split("@", 1)[0],
        user.phone,
    ):
        raise bad_request("رمز عبور نباید شامل ایمیل یا شماره موبایل باشد")
    user.password_hash = security.get_password_hash(payload.new_password)
    user.password_changed_at = utc_now()
    user.failed_login_attempts = 0
    user.locked_until = None
    await revoke_user_sessions(db, user_id=user.id)
    await add_audit_event(
        db,
        event_type="auth.password_reset_completed",
        request=request,
        actor_user_id=user.id,
    )
    await db.commit()
    clear_refresh_cookie(response)
    return {"message": "Password reset completed. Please sign in."}


@router.post(
    "/auth/verification/email/request",
    response_model=schemas.MessageResponse,
    dependencies=[Depends(auth_challenge_rate_limit)],
)
async def request_email_verification(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_session_user),
) -> Any:
    if current_user.email_verified_at:
        return {"message": "Email is already verified."}
    token = await create_challenge(
        db,
        user=current_user,
        purpose="verify_email",
        destination=current_user.email,
        ttl_minutes=30,
    )
    await add_audit_event(
        db,
        event_type="auth.email_verification_requested",
        request=request,
        actor_user_id=current_user.id,
    )
    await db.commit()
    background_tasks.add_task(
        dispatch_challenge,
        purpose="verify_email",
        destination=current_user.email,
        token=token,
    )
    return {
        "message": "Email verification instructions have been sent.",
        "debug_token": _debug_token(token),
    }


@router.get(
    "/auth/verification/status",
    response_model=schemas.VerificationStatus,
)
async def verification_status(
    current_user: User = Depends(deps.get_current_session_user),
) -> Any:
    return {
        "email_verified": bool(current_user.email_verified_at),
        "phone_verified": bool(current_user.phone_verified_at),
        "account_verified": current_user.is_verified,
    }


@router.post(
    "/auth/verification/email/confirm",
    response_model=schemas.MessageResponse,
    dependencies=[Depends(auth_challenge_rate_limit)],
)
async def confirm_email_verification(
    payload: schemas.VerificationConfirm,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    user = await consume_challenge(
        db,
        token=payload.token,
        purpose="verify_email",
    )
    user.email_verified_at = utc_now()
    user.is_verified = bool(user.phone_verified_at)
    await add_audit_event(
        db,
        event_type="auth.email_verified",
        request=request,
        actor_user_id=user.id,
    )
    await db.commit()
    return {"message": "Email verified."}


@router.post(
    "/auth/verification/phone/request",
    response_model=schemas.MessageResponse,
    dependencies=[Depends(auth_challenge_rate_limit)],
)
async def request_phone_verification(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_session_user),
) -> Any:
    if current_user.phone_verified_at:
        return {"message": "Phone is already verified."}
    token = await create_challenge(
        db,
        user=current_user,
        purpose="verify_phone",
        destination=current_user.phone,
        ttl_minutes=10,
        numeric=True,
    )
    await add_audit_event(
        db,
        event_type="auth.phone_verification_requested",
        request=request,
        actor_user_id=current_user.id,
    )
    await db.commit()
    background_tasks.add_task(
        dispatch_challenge,
        purpose="verify_phone",
        destination=current_user.phone,
        token=token,
    )
    return {
        "message": "Phone verification code has been sent.",
        "debug_token": _debug_token(token),
    }


@router.post(
    "/auth/verification/phone/confirm",
    response_model=schemas.MessageResponse,
    dependencies=[Depends(auth_challenge_rate_limit)],
)
async def confirm_phone_verification(
    payload: schemas.VerificationConfirm,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_session_user),
) -> Any:
    await consume_user_challenge(
        db,
        user_id=current_user.id,
        token=payload.token,
        purpose="verify_phone",
    )
    current_user.phone_verified_at = utc_now()
    current_user.is_verified = bool(current_user.email_verified_at)
    await add_audit_event(
        db,
        event_type="auth.phone_verified",
        request=request,
        actor_user_id=current_user.id,
    )
    await db.commit()
    return {"message": "Phone verified."}


@router.post(
    "/auth/mfa/setup",
    response_model=schemas.MfaSetupResponse,
    dependencies=[Depends(auth_challenge_rate_limit)],
)
async def setup_admin_mfa(
    payload: schemas.MfaSetupRequest,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_candidate),
) -> Any:
    if current_user.mfa_enabled and not getattr(
        current_user,
        "_auth_mfa_verified",
        False,
    ):
        raise forbidden("Admin MFA verification is required")
    if not security.verify_password(
        payload.current_password,
        current_user.password_hash,
    ):
        raise unauthorized("Current password is incorrect")

    secret = security.generate_totp_secret()
    current_user.mfa_pending_secret_ciphertext = security.encrypt_mfa_secret(secret)
    await add_audit_event(
        db,
        event_type="auth.mfa_setup_started",
        request=request,
        actor_user_id=current_user.id,
    )
    await db.commit()
    return {
        "secret": secret,
        "provisioning_uri": security.build_totp_uri(secret, current_user.email),
    }


@router.post(
    "/auth/mfa/confirm",
    response_model=schemas.MfaConfirmResponse,
    dependencies=[Depends(auth_challenge_rate_limit)],
)
async def confirm_admin_mfa(
    payload: schemas.MfaConfirmRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_candidate),
) -> Any:
    if current_user.mfa_enabled and not getattr(
        current_user,
        "_auth_mfa_verified",
        False,
    ):
        raise forbidden("Admin MFA verification is required")
    secret = (
        security.decrypt_mfa_secret(current_user.mfa_pending_secret_ciphertext)
        if current_user.mfa_pending_secret_ciphertext
        else None
    )
    matched_counter = security.matching_totp_counter(secret, payload.code) if secret else None
    if matched_counter is None:
        raise unauthorized("MFA code is invalid")
    backup_codes = await replace_backup_codes(db, user_id=current_user.id)
    current_user.mfa_secret_ciphertext = current_user.mfa_pending_secret_ciphertext
    current_user.mfa_pending_secret_ciphertext = None
    current_user.mfa_enabled = True
    current_user.mfa_last_used_step = matched_counter
    await add_audit_event(
        db,
        event_type="auth.mfa_enabled",
        request=request,
        actor_user_id=current_user.id,
    )
    await revoke_user_sessions(db, user_id=current_user.id)
    await db.commit()
    clear_refresh_cookie(response)
    return {"backup_codes": backup_codes}


@router.post(
    "/auth/mfa/backup-codes",
    response_model=schemas.MfaConfirmResponse,
    dependencies=[Depends(auth_challenge_rate_limit)],
)
async def regenerate_admin_backup_codes(
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    backup_codes = await replace_backup_codes(db, user_id=current_user.id)
    await add_audit_event(
        db,
        event_type="auth.mfa_backup_codes_regenerated",
        request=request,
        actor_user_id=current_user.id,
    )
    await db.commit()
    return {"backup_codes": backup_codes}


@router.post("/signup", response_model=schemas.User)
async def create_user_signup(
    *,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    turnstile_token: str | None = Header(
        default=None,
        alias="X-Turnstile-Token",
    ),
    _rate_limit: None = Depends(auth_signup_rate_limit),
) -> Any:
    await verify_turnstile(
        token=turnstile_token,
        remote_ip=_request_ip(request),
        expected_action="signup",
    )
    email = str(user_in.email).strip().lower()
    phone = user_in.phone.strip()
    display_name = user_in.display_name.strip()
    referral_code = (
        user_in.referral_code if settings.FEATURE_REFERRALS_ENABLED else None
    )
    if not phone or not display_name:
        raise bad_request("Phone and display name cannot be empty")
    if password_contains_account_data(
        user_in.password,
        email.split("@", 1)[0],
        phone,
    ):
        raise bad_request("رمز عبور نباید شامل ایمیل یا شماره موبایل باشد")

    if referral_code:
        referrer_user_id = await get_referrer_id_by_code(db, code=referral_code)
        if not referrer_user_id:
            raise bad_request("کد دعوت معتبر نیست")

    if await db.scalar(select(User.id).where(func.lower(User.email) == email)):
        raise conflict("این ایمیل قبلاً ثبت شده است")
    if await db.scalar(select(User.id).where(User.phone == phone)):
        raise conflict("این شماره موبایل قبلاً ثبت شده است")

    user = User(
        email=email,
        phone=phone,
        password_hash=security.get_password_hash(user_in.password),
        password_changed_at=utc_now(),
        is_verified=False,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.flush()
    db.add(UserProfile(user_id=user.id, display_name=display_name))
    ip_hash, user_agent_hash = request_fingerprints(request)
    db.add_all(
        [
            LegalAcceptance(
                user_id=user.id,
                document_type=document_type,
                document_version=document_version,
                ip_hash=ip_hash,
                user_agent_hash=user_agent_hash,
            )
            for document_type, document_version in LEGAL_DOCUMENT_VERSIONS.items()
        ]
    )
    if settings.FEATURE_REFERRALS_ENABLED:
        await get_or_create_referral_code(db, user_id=user.id, commit=False)
    if settings.FEATURE_REFERRALS_ENABLED and referral_code:
        await apply_referral_code(
            db,
            referred_user_id=user.id,
            code=referral_code,
            commit=False,
        )

    email_token = await create_challenge(
        db,
        user=user,
        purpose="verify_email",
        destination=email,
        ttl_minutes=30,
    )
    phone_token = await create_challenge(
        db,
        user=user,
        purpose="verify_phone",
        destination=phone,
        ttl_minutes=10,
        numeric=True,
    )
    await add_audit_event(
        db,
        event_type="auth.signup",
        request=request,
        actor_user_id=user.id,
        subject=security.hash_secret(email),
    )
    await db.commit()

    background_tasks.add_task(
        dispatch_challenge,
        purpose="verify_email",
        destination=email,
        token=email_token,
    )
    background_tasks.add_task(
        dispatch_challenge,
        purpose="verify_phone",
        destination=phone,
        token=phone_token,
    )

    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == user.id)
    )
    return result.scalar_one()
