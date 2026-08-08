import argparse
import asyncio

from sqlalchemy import func, select

from app.core import security
from app.db.session import SessionLocal
from app.models.security import SecurityAuditEvent
from app.models.user import User, UserRole, UserStatus
from app.services.auth_security import revoke_user_sessions


async def bootstrap_admin(email: str, confirmation: str) -> None:
    normalized_email = email.strip().lower()
    if not normalized_email or confirmation.strip().lower() != normalized_email:
        raise SystemExit("--confirm-email must exactly match --email")

    async with SessionLocal() as session:
        result = await session.execute(
            select(User)
            .where(func.lower(User.email) == normalized_email)
            .with_for_update()
        )
        user = result.scalar_one_or_none()
        if not user:
            raise SystemExit("User was not found")
        if user.status != UserStatus.ACTIVE or not user.is_verified:
            raise SystemExit("The bootstrap account must be active and verified")

        user.role = UserRole.ADMIN
        await revoke_user_sessions(session, user_id=user.id)
        session.add(
            SecurityAuditEvent(
                actor_user_id=user.id,
                event_type="rbac.admin_bootstrapped",
                subject=security.hash_secret(normalized_email),
            )
        )
        await session.commit()
        print(f"Administrator role assigned to user {user.id}. Existing sessions were revoked.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Assign the initial Chinverse administrator role once.",
    )
    parser.add_argument("--email", required=True)
    parser.add_argument("--confirm-email", required=True)
    args = parser.parse_args()
    asyncio.run(bootstrap_admin(args.email, args.confirm_email))


if __name__ == "__main__":
    main()
