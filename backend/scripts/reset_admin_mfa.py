import argparse
import asyncio

from sqlalchemy import delete, func, select

from app.core import security
from app.db.session import SessionLocal
from app.models.security import MfaBackupCode, SecurityAuditEvent
from app.models.user import User, UserRole
from app.services.auth_security import revoke_user_sessions


CONFIRMATION_PHRASE = "RESET-ADMIN-MFA"


async def reset_admin_mfa(
    email: str,
    confirmation_email: str,
    confirmation_phrase: str,
) -> None:
    normalized_email = email.strip().lower()
    if not normalized_email or confirmation_email.strip().lower() != normalized_email:
        raise SystemExit("--confirm-email must exactly match --email")
    if confirmation_phrase != CONFIRMATION_PHRASE:
        raise SystemExit(f"--confirm must exactly equal {CONFIRMATION_PHRASE}")

    async with SessionLocal() as session:
        result = await session.execute(
            select(User)
            .where(func.lower(User.email) == normalized_email)
            .with_for_update()
        )
        user = result.scalar_one_or_none()
        if not user:
            raise SystemExit("User was not found")
        role = user.role.value if isinstance(user.role, UserRole) else str(user.role)
        if role != UserRole.ADMIN.value:
            raise SystemExit("MFA recovery is restricted to administrator accounts")

        user.mfa_enabled = False
        user.mfa_secret_ciphertext = None
        user.mfa_pending_secret_ciphertext = None
        user.mfa_last_used_step = None
        await session.execute(
            delete(MfaBackupCode).where(MfaBackupCode.user_id == user.id)
        )
        await revoke_user_sessions(session, user_id=user.id)
        session.add(
            SecurityAuditEvent(
                actor_user_id=user.id,
                event_type="auth.mfa_reset_by_operator",
                subject=security.hash_secret(normalized_email),
            )
        )
        await session.commit()
        print(
            f"MFA reset for administrator {user.id}. Existing sessions and backup codes were revoked."
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Reset a locked-out administrator's MFA using direct database access.",
    )
    parser.add_argument("--email", required=True)
    parser.add_argument("--confirm-email", required=True)
    parser.add_argument("--confirm", required=True)
    args = parser.parse_args()
    asyncio.run(
        reset_admin_mfa(
            args.email,
            args.confirm_email,
            args.confirm,
        )
    )


if __name__ == "__main__":
    main()
