"""Display active beta profiles when account verification is optional in staging."""

from sqlalchemy.sql.elements import ColumnElement

from app.core.config import settings
from app.models.user import User, UserStatus


def requires_showcase_verification() -> bool:
    # Only the staging beta can use its existing optional-verification policy.
    # Production and local deployments keep the verified-only public directory.
    return settings.DEPLOYMENT_TIER.lower() != "staging" or settings.REQUIRE_VERIFIED_LOGIN


def showcase_user_filters() -> tuple[ColumnElement[bool], ...]:
    filters = (User.status == UserStatus.ACTIVE,)
    if requires_showcase_verification():
        return (*filters, User.is_verified.is_(True))
    return filters


def is_showcase_user(user: User | None) -> bool:
    return bool(
        user
        and user.status == UserStatus.ACTIVE
        and (user.is_verified or not requires_showcase_verification())
    )
