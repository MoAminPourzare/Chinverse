from types import SimpleNamespace

import pytest

from app.models.user import User, UserStatus
from app.services import showcase_visibility


@pytest.mark.parametrize(
    ("tier", "required", "visible"),
    [
        ("staging", False, True),
        ("staging", True, False),
        ("production", False, False),
        ("production", True, False),
        ("local", False, False),
    ],
)
def test_unverified_showcase_visibility_is_limited_to_optional_staging(
    monkeypatch, tier, required, visible
):
    monkeypatch.setattr(showcase_visibility, "settings", SimpleNamespace(
        DEPLOYMENT_TIER=tier, REQUIRE_VERIFIED_LOGIN=required
    ))
    user = User(status=UserStatus.ACTIVE, is_verified=False)
    assert showcase_visibility.is_showcase_user(user) is visible
    user.is_verified = True
    assert showcase_visibility.is_showcase_user(user) is True


@pytest.mark.parametrize("status", [UserStatus.SUSPENDED, UserStatus.DELETED])
@pytest.mark.parametrize("verified", [False, True])
def test_inactive_accounts_are_never_in_the_showcase(monkeypatch, status, verified):
    monkeypatch.setattr(showcase_visibility, "settings", SimpleNamespace(
        DEPLOYMENT_TIER="staging", REQUIRE_VERIFIED_LOGIN=False
    ))
    assert showcase_visibility.is_showcase_user(User(status=status, is_verified=verified)) is False
    assert showcase_visibility.is_showcase_user(None) is False
