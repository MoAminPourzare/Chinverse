"""Run a bounded, synthetic Phase 2 smoke against the staging API.

The command creates one random account through the public signup flow, checks
authenticated account/beta/chat/RBAC contracts, exercises the chat websocket,
and deletes the account in a ``finally`` block.  It refuses non-staging targets
and never prints credentials, tokens, email addresses, phone numbers, or
response bodies.

Example (CI):

    python scripts/phase2_backend_live_smoke.py \
      --base-url https://moamin9-chinverse-api.hf.space \
      --expected-release "$EXPECTED_RELEASE"
"""

from __future__ import annotations

import argparse
import asyncio
from dataclasses import dataclass
import hashlib
import json
import os
import secrets
from urllib.parse import urlsplit, urlunsplit

import httpx


DEFAULT_BASE_URL = "https://moamin9-chinverse-api.hf.space"
STAGING_HOST = "moamin9-chinverse-api.hf.space"
RELEASE_SHA_LENGTH = 40


class SmokeFailure(RuntimeError):
    """A live smoke contract failed without exposing response data."""


@dataclass(frozen=True)
class SyntheticAccount:
    email: str
    phone: str
    password: str


def normalize_base_url(raw_value: str, *, allow_local: bool = False) -> str:
    value = raw_value.strip().rstrip("/")
    parsed = urlsplit(value)
    if parsed.scheme != "https" and not (
        allow_local and parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost"}
    ):
        raise SmokeFailure("base_url must use HTTPS (HTTP is allowed only for loopback with --allow-local)")
    if not parsed.hostname:
        raise SmokeFailure("base_url has no hostname")
    if not allow_local and parsed.hostname.lower() != STAGING_HOST:
        raise SmokeFailure("refusing a non-audited staging host")
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path.rstrip("/"), "", ""))


def require_release(value: str) -> str:
    release = value.strip().lower()
    if len(release) != RELEASE_SHA_LENGTH or any(char not in "0123456789abcdef" for char in release):
        raise SmokeFailure("expected_release must be a full lowercase Git SHA")
    return release


def build_synthetic_account() -> SyntheticAccount:
    nonce = secrets.token_hex(8)
    phone_suffix = int.from_bytes(hashlib.sha256(nonce.encode("ascii")).digest()[:8], "big") % 1_000_000_000
    # The password is deliberately unrelated to every account field so the
    # server's account-data password guard cannot reject this generated user.
    password = f"Qz!{secrets.token_urlsafe(18)}_phase2"
    return SyntheticAccount(
        email=f"phase2-{nonce}@example.com",
        phone=f"09{phone_suffix:09d}",
        password=password,
    )


def expect_status(response: httpx.Response, expected: int, label: str) -> None:
    if response.status_code != expected:
        raise SmokeFailure(f"{label}: expected HTTP {expected}, received {response.status_code}")


def json_body(response: httpx.Response, label: str) -> dict:
    try:
        value = response.json()
    except (TypeError, ValueError) as exc:
        raise SmokeFailure(f"{label}: response was not JSON") from exc
    if not isinstance(value, dict):
        raise SmokeFailure(f"{label}: response JSON was not an object")
    return value


async def websocket_smoke(base_url: str, token: str) -> None:
    try:
        try:
            from websockets.asyncio.client import connect  # websockets >= 14
        except ImportError:  # pragma: no cover - compatibility for older lockfiles
            from websockets import connect  # type: ignore[no-redef]

        parsed = urlsplit(base_url)
        scheme = "wss" if parsed.scheme == "https" else "ws"
        websocket_url = urlunsplit((scheme, parsed.netloc, "/api/v1/chat/ws", "", ""))
        async with connect(websocket_url, open_timeout=10, close_timeout=5, max_size=256_000) as socket:
            await socket.send(json.dumps({"type": "auth", "token": token}))
            ready = json.loads(await asyncio.wait_for(socket.recv(), timeout=10))
            if ready.get("type") != "connection:ready":
                raise SmokeFailure("chat websocket did not emit connection:ready")
            await socket.send(json.dumps({"type": "ping"}))
            pong = json.loads(await asyncio.wait_for(socket.recv(), timeout=10))
            if pong.get("type") != "pong":
                raise SmokeFailure("chat websocket did not emit pong")
    except SmokeFailure:
        raise
    except Exception as exc:  # Do not leak a URL, token, or provider response.
        raise SmokeFailure(f"chat websocket failed: {type(exc).__name__}") from exc


async def run_smoke(base_url: str, expected_release: str, *, allow_local: bool = False) -> dict:
    base_url = normalize_base_url(base_url, allow_local=allow_local)
    expected_release = require_release(expected_release)
    account = build_synthetic_account()
    token: str | None = None
    created = False
    checks: dict[str, bool] = {}
    cleanup_ok = False

    timeout = httpx.Timeout(connect=5.0, read=15.0, write=15.0, pool=5.0)
    async with httpx.AsyncClient(base_url=base_url, timeout=timeout, follow_redirects=False, trust_env=False) as client:
        try:
            health_response = await client.get("/health")
            expect_status(health_response, 200, "health")
            health = json_body(health_response, "health")
            if not (
                health.get("status") == "ok"
                and health.get("deployment_tier") == "staging"
                and health.get("indexable") is False
                and health.get("release") == expected_release
            ):
                raise SmokeFailure("health did not report the expected staging release")
            checks["health"] = True

            ready_response = await client.get("/health/ready")
            expect_status(ready_response, 200, "readiness")
            ready = json_body(ready_response, "readiness")
            if not (
                ready.get("status") == "ok"
                and ready.get("checks", {}).get("database_target") == "ok"
                and ready.get("checks", {}).get("database") == "ok"
                and ready.get("checks", {}).get("storage") == "ok"
            ):
                raise SmokeFailure("readiness did not report database target, database, and storage as healthy")
            checks["readiness"] = True

            signup_response = await client.post(
                "/api/v1/signup",
                json={
                    "email": account.email,
                    "phone": account.phone,
                    "display_name": "کاربر آزمایشی",
                    "password": account.password,
                    "accept_terms": True,
                    "accept_privacy": True,
                    "accept_community_guidelines": True,
                },
            )
            expect_status(signup_response, 200, "signup")
            signup = json_body(signup_response, "signup")
            if not isinstance(signup.get("id"), int):
                raise SmokeFailure("signup did not return a user id")
            created = True
            checks["signup"] = True

            login_response = await client.post(
                "/api/v1/login/access-token",
                data={"username": account.email, "password": account.password},
            )
            expect_status(login_response, 200, "login")
            login = json_body(login_response, "login")
            token = login.get("access_token")
            if not isinstance(token, str) or not token:
                raise SmokeFailure("login did not return an access token")
            auth_headers = {"Authorization": f"Bearer {token}"}
            checks["login"] = True

            me_response = await client.get("/api/v1/users/me", headers=auth_headers)
            expect_status(me_response, 200, "account")
            me = json_body(me_response, "account")
            if me.get("email") != account.email or me.get("is_verified") is not False:
                raise SmokeFailure("account response did not match the synthetic user contract")
            checks["account"] = True

            beta_response = await client.get("/api/v1/beta/status", headers=auth_headers)
            expect_status(beta_response, 200, "beta status")
            beta = json_body(beta_response, "beta status")
            if not (
                beta.get("enabled") is False
                and beta.get("eligible") is False
                and beta.get("reason") == "disabled"
                and beta.get("feedback_enabled") is False
            ):
                raise SmokeFailure("beta/feedback did not fail closed")
            checks["beta_disabled"] = True

            conversations_response = await client.get(
                "/api/v1/chat/conversations",
                headers=auth_headers,
            )
            expect_status(conversations_response, 200, "chat conversations")
            if not isinstance(conversations_response.json(), list):
                raise SmokeFailure("chat conversations response was not a list")
            checks["chat_http"] = True

            await websocket_smoke(base_url, token)
            checks["chat_websocket"] = True

            admin_response = await client.get("/api/v1/admin/users?limit=1", headers=auth_headers)
            expect_status(admin_response, 403, "normal-user admin access")
            checks["rbac"] = True
        finally:
            if created:
                if token is None:
                    # A transient login failure must not strand the synthetic
                    # account. Retry once using the same in-memory credentials
                    # before declaring cleanup impossible.
                    retry_login = await client.post(
                        "/api/v1/login/access-token",
                        data={"username": account.email, "password": account.password},
                    )
                    if retry_login.status_code == 200:
                        retry_payload = json_body(retry_login, "cleanup login")
                        token = retry_payload.get("access_token")
                    if not isinstance(token, str) or not token:
                        raise SmokeFailure("cleanup could not start because login did not return a token")
                delete_response = await client.request(
                    "DELETE",
                    "/api/v1/users/me",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"current_password": account.password, "confirm": True},
                )
                if delete_response.status_code != 200:
                    raise SmokeFailure(f"cleanup: expected HTTP 200, received {delete_response.status_code}")
                cleanup_ok = True
                post_delete_response = await client.get(
                    "/api/v1/users/me",
                    headers={"Authorization": f"Bearer {token}"},
                )
                if post_delete_response.status_code != 401:
                    raise SmokeFailure(
                        f"cleanup verification: expected HTTP 401, received {post_delete_response.status_code}"
                    )
                checks["cleanup"] = True

    passed = all(checks.values()) and cleanup_ok
    return {
        "passed": passed,
        "release": expected_release,
        "checks": checks,
        "synthetic_account_created": created,
        "cleanup": cleanup_ok,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=os.getenv("PHASE2_BACKEND_ORIGIN", DEFAULT_BASE_URL))
    parser.add_argument("--expected-release", default=os.getenv("EXPECTED_RELEASE", ""))
    parser.add_argument("--allow-local", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        result = asyncio.run(
            run_smoke(
                args.base_url,
                args.expected_release,
                allow_local=args.allow_local,
            )
        )
    except SmokeFailure as exc:
        print(json.dumps({"passed": False, "error": str(exc)}, ensure_ascii=False))
        return 1
    except (httpx.HTTPError, OSError) as exc:
        print(json.dumps({"passed": False, "error": type(exc).__name__}, ensure_ascii=False))
        return 1

    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
