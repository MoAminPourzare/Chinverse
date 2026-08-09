from dataclasses import asdict
import ssl

import pytest

from app.core.legal import LEGAL_DOCUMENT_VERSIONS
from app.db.base_class import Base
import app.models  # noqa: F401
from scripts.phase4_staging_fixtures import (
    EXPECTED_USER_FOREIGN_KEYS,
    FixtureSafetyError,
    build_verified_ssl_context,
    build_parser,
    build_fixture_accounts,
    fixture_state,
    load_passwords,
    normalize_run_id,
    validate_and_normalize_database_url,
)


def _database_url(
    endpoint: str,
    *,
    pooled: bool = False,
    sslmode: str = "verify-full",
    channel_binding: str | None = "require",
) -> str:
    suffix = "-pooler" if pooled else ""
    url = (
        f"postgresql://fixture:secret@{endpoint}{suffix}.us-east-2.aws.neon.tech/neondb"
        f"?sslmode={sslmode}"
    )
    if channel_binding is not None:
        url += f"&channel_binding={channel_binding}"
    return url


def test_database_url_accepts_only_the_exact_tls_staging_endpoint():
    normalized = validate_and_normalize_database_url(
        _database_url("ep-wild-band-atse2yoq", pooled=True)
    )

    assert normalized.startswith("postgresql://")
    assert "ep-wild-band-atse2yoq-pooler." in normalized
    assert "sslmode=verify-full" in normalized
    assert "channel_binding" not in normalized

    with pytest.raises(FixtureSafetyError):
        validate_and_normalize_database_url(_database_url("ep-still-pond-atbpegz3"))
    for weak_sslmode in ("require", "verify-ca", "prefer"):
        with pytest.raises(FixtureSafetyError, match="sslmode=verify-full"):
            validate_and_normalize_database_url(
                _database_url("ep-wild-band-atse2yoq", sslmode=weak_sslmode)
            )
    with pytest.raises(FixtureSafetyError, match="channel binding"):
        validate_and_normalize_database_url(
            _database_url("ep-wild-band-atse2yoq", channel_binding=None)
        )
    with pytest.raises(FixtureSafetyError, match="channel binding"):
        validate_and_normalize_database_url(
            _database_url("ep-wild-band-atse2yoq", channel_binding="prefer")
        )
    with pytest.raises(FixtureSafetyError):
        validate_and_normalize_database_url(
            "postgresql://fixture:secret@ep-wild-band-atse2yoq.us-east-2.aws.neon.tech/neondb"
        )


def test_fixture_connection_uses_a_hostname_verifying_system_ca_context():
    context = build_verified_ssl_context()

    assert context.check_hostname is True
    assert context.verify_mode == ssl.CERT_REQUIRED


@pytest.mark.parametrize("value", ["", "short", "-invalid", "invalid-", "has space"])
def test_run_id_rejects_ambiguous_or_unsafe_values(value: str):
    with pytest.raises(FixtureSafetyError):
        normalize_run_id(value)


def test_run_id_is_normalized_and_cli_is_dry_run_by_default():
    assert normalize_run_id("LIVE-SMOKE-20260809") == "live-smoke-20260809"
    args = build_parser().parse_args(["create"])
    assert args.apply is False
    assert args.confirm_run_id is None


def test_fixture_identities_are_deterministic_unique_and_synthetic():
    first = build_fixture_accounts("live-smoke-20260809")
    second = build_fixture_accounts("live-smoke-20260809")

    assert [asdict(item) for item in first] == [asdict(item) for item in second]
    assert len({item.email for item in first}) == 4
    assert len({item.phone for item in first}) == 4
    assert {item.role for item in first} == {"user", "moderator", "admin"}
    assert all(item.email.endswith("@example.com") for item in first)
    assert all(item.email.startswith("phase4-live-smoke-20260809-") for item in first)
    assert all(len(item.phone) == 11 and item.phone.startswith("09") for item in first)
    assert all(any("\u0600" <= character <= "\u06ff" for character in item.display_name) for item in first)


def test_passwords_are_required_from_the_caller_environment():
    accounts = build_fixture_accounts("live-smoke-20260809")
    environment = {
        "CHINVERSE_PHASE4_USER_1_PASSWORD": "Strong U1! smoke password 6482",
        "CHINVERSE_PHASE4_USER_2_PASSWORD": "Strong U2! smoke password 7593",
        "CHINVERSE_PHASE4_MODERATOR_PASSWORD": "Strong Mod! smoke password 8604",
        "CHINVERSE_PHASE4_ADMIN_PASSWORD": "Strong Admin! smoke password 9715",
    }

    loaded = load_passwords(accounts, environment)
    assert set(loaded) == {"user_1", "user_2", "moderator", "admin"}
    with pytest.raises(FixtureSafetyError):
        load_passwords(accounts, {})


def test_fixture_state_requires_all_exact_accounts_without_exposing_passwords():
    accounts = build_fixture_accounts("live-smoke-20260809")
    rows = [
        {
            "id": index,
            "email": account.email,
            "phone": account.phone,
            "role": account.role,
            "is_verified": True,
            "status": "active",
            "password_hash": "not-read-when-passwords-are-none",
            "display_name": account.display_name,
            "legal_acceptance_count": len(LEGAL_DOCUMENT_VERSIONS),
        }
        for index, account in enumerate(accounts, start=1)
    ]

    assert fixture_state(rows, accounts, passwords=None) == "complete"
    assert fixture_state(rows[:3], accounts, passwords=None) == "conflict"
    changed_rows = [dict(row) for row in rows]
    changed_rows[0]["role"] = "admin"
    assert fixture_state(changed_rows, accounts, passwords=None) == "conflict"


def test_audited_user_fk_contract_matches_application_metadata():
    metadata_contract = set()
    for table in Base.metadata.tables.values():
        for constraint in table.foreign_key_constraints:
            for element in constraint.elements:
                if element.target_fullname != "users.id":
                    continue
                metadata_contract.add(
                    (
                        table.name,
                        element.parent.name,
                        (constraint.ondelete or "NO ACTION").upper(),
                    )
                )

    assert metadata_contract == EXPECTED_USER_FOREIGN_KEYS
