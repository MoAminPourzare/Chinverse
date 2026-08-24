"""Small, deterministic policies used by the closed-beta release.

The beta policy deliberately has no network/provider side effects.  It is kept
separate from the API layer so rollout decisions can be tested without a
database and, more importantly, so a production deploy cannot accidentally
open the beta by changing a UI flag only.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import hmac
import re
import secrets
from typing import Iterable


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
# Crockford-like alphabet restricted to the same characters accepted by
# ``normalize_invite_code``.  Excluding 0/1/8/9 avoids ambiguous or stripped
# characters when a code is copied from an email/SMS message.
INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ234567"


def normalize_email(value: str | None) -> str:
    """Return the canonical representation used by beta allowlists."""

    return (value or "").strip().casefold()


def parse_email_allowlist(value: str | Iterable[str] | None) -> frozenset[str]:
    """Parse a comma/newline separated email allowlist.

    Invalid values are ignored rather than becoming an accidental match.  The
    settings validator separately reports malformed entries when desired; this
    helper remains safe for values supplied by an operator at runtime.
    """

    if value is None:
        return frozenset()
    values = value.split(",") if isinstance(value, str) else value
    result: set[str] = set()
    for item in values:
        email = normalize_email(str(item))
        if email and EMAIL_RE.fullmatch(email):
            result.add(email)
    return frozenset(result)


def rollout_bucket(subject: str | int) -> int:
    """Return a stable bucket in ``[0, 99]`` for deterministic rollout."""

    digest = hashlib.sha256(str(subject).encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "big") % 100


@dataclass(frozen=True)
class BetaDecision:
    enabled: bool
    eligible: bool
    reason: str
    cohort: str


def evaluate_beta_access(
    *,
    enabled: bool,
    invite_required: bool,
    email: str | None,
    subject: str | int | None,
    allowlist: str | Iterable[str] | None = None,
    rollout_percent: int = 0,
    invite_redeemed: bool = False,
) -> BetaDecision:
    """Evaluate closed-beta access without exposing rollout internals.

    Explicit allowlist entries and redeemed invitations win over the percentage
    cohort.  When ``invite_required`` is true, the percentage cohort can never
    open access on its own.  This makes the safe default suitable for a closed
    beta and avoids a UI-only rollout switch becoming a public launch.
    """

    if not enabled:
        return BetaDecision(False, False, "disabled", "none")

    normalized_email = normalize_email(email)
    if normalized_email and normalized_email in parse_email_allowlist(allowlist):
        return BetaDecision(True, True, "allowlist", "allowlist")

    if invite_redeemed:
        return BetaDecision(True, True, "invite", "invite")

    bounded_percent = max(0, min(int(rollout_percent), 100))
    if invite_required:
        return BetaDecision(True, False, "invite_required", "closed")

    if subject is not None and rollout_bucket(subject) < bounded_percent:
        return BetaDecision(True, True, "rollout", f"percent:{bounded_percent}")

    return BetaDecision(True, False, "not_in_cohort", f"percent:{bounded_percent}")


def generate_invite_code() -> str:
    """Generate a human-copyable, high-entropy base32 invitation code."""

    # Two groups of ten base32 characters are short enough for email/SMS but
    # still contain more than 80 bits of entropy. Raw codes are returned only
    # at issue time; the database stores an HMAC digest.
    return "-".join(
        "".join(secrets.choice(INVITE_ALPHABET) for _ in range(10))
        for _ in range(2)
    )


def normalize_invite_code(value: str | None) -> str:
    return re.sub(r"[^A-Z2-7]", "", (value or "").strip().upper())


def hash_invite_code(code: str, secret: str) -> str:
    """Hash an invite with a deployment secret; never persist the raw code."""

    normalized = normalize_invite_code(code)
    if not normalized or len(normalized) < 16:
        return ""
    return hmac.new(
        secret.encode("utf-8"), normalized.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def verify_webhook_signature(payload: bytes, signature: str | None, secret: str) -> bool:
    """Constant-time verification for provider adapters.

    Providers may wrap this primitive with their documented timestamp scheme;
    this function intentionally accepts only a plain hex HMAC-SHA256 value and
    fails closed for malformed or missing values.
    """

    if not signature or not secret:
        return False
    candidate = signature.strip().lower()
    if candidate.startswith("sha256="):
        candidate = candidate[7:]
    if not re.fullmatch(r"[0-9a-f]{64}", candidate):
        return False
    expected = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(candidate, expected)
