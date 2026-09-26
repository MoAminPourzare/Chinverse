"""Bounded, read-only load and soak runner for ChinVerse staging.

The runner deliberately has no production override. A remote target must prove
that its health endpoint reports ``deployment_tier=staging`` before traffic is
generated. Credentials are accepted only through environment variables and are
never written to console or JSON results.
"""

from __future__ import annotations

import argparse
import asyncio
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
import json
import math
import os
from pathlib import Path
import re
import sys
import time
from typing import Sequence
from urllib.parse import urlsplit

import httpx


REMOTE_MAX_CONCURRENCY = 25
REMOTE_MAX_RATE_PER_SECOND = 25.0
REMOTE_MAX_DURATION_SECONDS = 3600
LOCAL_MAX_CONCURRENCY = 200
LOCAL_MAX_RATE_PER_SECOND = 200.0
LOCAL_MAX_DURATION_SECONDS = 7200
LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1"}
TRUSTED_REMOTE_HOSTS = {
    "backend": "moamin9-chinverse-api.hf.space",
    "frontend": "chinverse-git-codex-phase-7-performance-operations-death-stroke.vercel.app",
}


@dataclass(frozen=True)
class Profile:
    duration_seconds: int
    concurrency: int
    rate_per_second: float
    max_error_rate: float
    max_p95_ms: float


PROFILES = {
    "smoke": Profile(15, 2, 1.0, 0.0, 2500.0),
    "load": Profile(180, 10, 5.0, 0.01, 2500.0),
    "soak": Profile(900, 5, 2.0, 0.01, 2500.0),
}

DEFAULT_ENDPOINTS = {
    "backend": ["/health@3", "/api/v1/courses/@2"],
    "frontend": ["/api/health@2", "/landing@1", "/explore/hsk@1"],
}
SAFE_ENDPOINT_PATTERNS = {
    "backend": (
        re.compile(r"^/health$"),
        re.compile(r"^/api/v1/courses(?:/[A-Za-z0-9_-]+)*/?$"),
    ),
    "frontend": (
        re.compile(r"^/api/health$"),
        re.compile(r"^/landing$"),
        re.compile(r"^/explore/hsk$"),
    ),
}


class ConfigurationError(ValueError):
    """A safety guard or CLI contract was violated."""


@dataclass(frozen=True)
class Endpoint:
    path: str
    weight: int


@dataclass
class Observation:
    latency_ms: float
    status_code: int | None
    ok: bool
    error_type: str | None = None


def parse_endpoint(raw: str) -> Endpoint:
    value = raw.strip()
    path, separator, weight_value = value.rpartition("@")
    if not separator:
        path, weight_value = value, "1"
    if not path.startswith("/") or path.startswith("//"):
        raise ConfigurationError("Each endpoint must be an absolute path beginning with one slash")
    if "#" in path or "?" in path or "://" in path:
        raise ConfigurationError("Endpoint paths cannot contain a URL, query string, or fragment")
    try:
        weight = int(weight_value)
    except ValueError as exc:
        raise ConfigurationError(f"Invalid endpoint weight: {raw}") from exc
    if weight < 1 or weight > 100:
        raise ConfigurationError("Endpoint weight must be between 1 and 100")
    return Endpoint(path=path, weight=weight)


def validate_read_only_endpoints(target: str, endpoints: Sequence[Endpoint]) -> None:
    patterns = SAFE_ENDPOINT_PATTERNS[target]
    for endpoint in endpoints:
        if not any(pattern.fullmatch(endpoint.path) for pattern in patterns):
            raise ConfigurationError(
                f"Endpoint is not in the audited read-only allowlist for {target}: {endpoint.path}"
            )


def validate_base_url(base_url: str) -> tuple[str, bool]:
    value = base_url.strip().rstrip("/")
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ConfigurationError("Base URL must be an absolute HTTP(S) URL")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ConfigurationError("Base URL cannot contain credentials, query parameters, or a fragment")
    is_local = parsed.hostname.lower() in LOOPBACK_HOSTS
    if not is_local and parsed.scheme != "https":
        raise ConfigurationError("Remote staging targets must use HTTPS")
    return value, is_local


def percentile(values: Sequence[float], percent: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = max(0, math.ceil(percent * len(ordered)) - 1)
    return ordered[index]


def validate_credential_audience(*, target: str, base_url: str, is_local: bool) -> None:
    if is_local:
        return
    has_bearer = bool(os.environ.get("PHASE7_BEARER_TOKEN", "").strip())
    has_bypass = bool(os.environ.get("PHASE7_VERCEL_BYPASS_SECRET", "").strip())
    if not has_bearer and not has_bypass:
        return
    hostname = (urlsplit(base_url).hostname or "").lower()
    if hostname != TRUSTED_REMOTE_HOSTS[target]:
        raise ConfigurationError(
            "Credentials may only be sent to the repository's exact trusted staging host"
        )
    if has_bypass and target != "frontend":
        raise ConfigurationError("The Vercel bypass secret may only be used with the frontend target")
    if has_bearer and target != "backend":
        raise ConfigurationError("The backend bearer token may only be used with the backend target")


def build_headers(*, target: str) -> dict[str, str]:
    headers = {"User-Agent": "chinverse-phase7-load-test/1"}
    bearer_token = os.environ.get("PHASE7_BEARER_TOKEN", "").strip()
    bypass_secret = os.environ.get("PHASE7_VERCEL_BYPASS_SECRET", "").strip()
    if bearer_token and target == "backend":
        headers["Authorization"] = f"Bearer {bearer_token}"
    if bypass_secret and target == "frontend":
        headers["x-vercel-protection-bypass"] = bypass_secret
    return headers


def resolved_profile(args: argparse.Namespace, *, is_local: bool) -> Profile:
    baseline = PROFILES[args.profile]
    profile = Profile(
        duration_seconds=args.duration_seconds or baseline.duration_seconds,
        concurrency=args.concurrency or baseline.concurrency,
        rate_per_second=args.rate_per_second or baseline.rate_per_second,
        max_error_rate=(
            baseline.max_error_rate if args.max_error_rate is None else args.max_error_rate
        ),
        max_p95_ms=baseline.max_p95_ms if args.max_p95_ms is None else args.max_p95_ms,
    )
    duration_cap = LOCAL_MAX_DURATION_SECONDS if is_local else REMOTE_MAX_DURATION_SECONDS
    concurrency_cap = LOCAL_MAX_CONCURRENCY if is_local else REMOTE_MAX_CONCURRENCY
    rate_cap = LOCAL_MAX_RATE_PER_SECOND if is_local else REMOTE_MAX_RATE_PER_SECOND
    if profile.duration_seconds < 1 or profile.duration_seconds > duration_cap:
        raise ConfigurationError(f"Duration must be between 1 and {duration_cap} seconds")
    if profile.concurrency < 1 or profile.concurrency > concurrency_cap:
        raise ConfigurationError(f"Concurrency must be between 1 and {concurrency_cap}")
    if profile.rate_per_second <= 0 or profile.rate_per_second > rate_cap:
        raise ConfigurationError(f"Rate must be greater than zero and at most {rate_cap} requests/s")
    if not 0 <= profile.max_error_rate <= 1:
        raise ConfigurationError("Maximum error rate must be between zero and one")
    if profile.max_p95_ms <= 0:
        raise ConfigurationError("Maximum p95 latency must be greater than zero")
    return profile


async def assert_safe_target(
    client: httpx.AsyncClient,
    *,
    target: str,
    is_local: bool,
    allow_staging: bool,
    expected_release: str,
) -> dict[str, object] | None:
    if is_local:
        return None
    if not allow_staging:
        raise ConfigurationError("Remote traffic requires the explicit --allow-staging flag")

    health_path = "/health" if target == "backend" else "/api/health"
    try:
        response = await client.get(health_path)
    except httpx.HTTPError as exc:
        raise ConfigurationError(f"Staging safety preflight failed: {type(exc).__name__}") from exc
    if response.status_code != 200:
        raise ConfigurationError(
            f"Staging safety preflight returned HTTP {response.status_code}; protected previews require a bypass secret"
        )
    try:
        payload = response.json()
    except ValueError as exc:
        raise ConfigurationError("Staging safety preflight did not return JSON") from exc
    if payload.get("status") != "ok" or payload.get("deployment_tier") != "staging":
        raise ConfigurationError("Remote target did not prove deployment_tier=staging; production is always refused")
    if expected_release and payload.get("release") != expected_release:
        raise ConfigurationError("Remote target release does not match --expected-release")
    return payload


async def warm_up(client: httpx.AsyncClient, endpoints: Sequence[Endpoint]) -> None:
    for endpoint in endpoints:
        try:
            response = await client.get(endpoint.path)
        except httpx.HTTPError as exc:
            raise ConfigurationError(
                f"Warm-up failed for {endpoint.path}: {type(exc).__name__}"
            ) from exc
        if not 200 <= response.status_code < 300:
            raise ConfigurationError(
                f"Warm-up for {endpoint.path} returned HTTP {response.status_code}"
            )


async def execute_request(
    client: httpx.AsyncClient,
    endpoint: Endpoint,
    semaphore: asyncio.Semaphore,
) -> Observation:
    try:
        started = time.perf_counter()
        try:
            response = await client.get(endpoint.path)
            latency_ms = (time.perf_counter() - started) * 1000
            return Observation(
                latency_ms=latency_ms,
                status_code=response.status_code,
                ok=200 <= response.status_code < 300,
            )
        except httpx.HTTPError as exc:
            return Observation(
                latency_ms=(time.perf_counter() - started) * 1000,
                status_code=None,
                ok=False,
                error_type=type(exc).__name__,
            )
    finally:
        semaphore.release()


async def generate_load(
    client: httpx.AsyncClient,
    *,
    endpoints: Sequence[Endpoint],
    profile: Profile,
) -> tuple[list[Observation], float]:
    weighted = [endpoint for endpoint in endpoints for _ in range(endpoint.weight)]
    semaphore = asyncio.Semaphore(profile.concurrency)
    tasks: set[asyncio.Task[Observation]] = set()
    observations: list[Observation] = []
    interval = 1.0 / profile.rate_per_second
    loop = asyncio.get_running_loop()
    started = loop.time()
    deadline = started + profile.duration_seconds
    next_start = started
    request_index = 0

    while next_start < deadline:
        delay = next_start - loop.time()
        if delay > 0:
            await asyncio.sleep(delay)
        await semaphore.acquire()
        if loop.time() >= deadline:
            semaphore.release()
            break
        endpoint = weighted[request_index % len(weighted)]
        task = asyncio.create_task(execute_request(client, endpoint, semaphore))
        tasks.add(task)
        task.add_done_callback(tasks.discard)
        task.add_done_callback(lambda completed: observations.append(completed.result()))
        request_index += 1
        next_start = max(started + request_index * interval, loop.time() + interval)

    if tasks:
        await asyncio.gather(*tasks)
    return observations, loop.time() - started


def summarize(
    *,
    args: argparse.Namespace,
    base_url: str,
    endpoints: Sequence[Endpoint],
    profile: Profile,
    observations: Sequence[Observation],
    elapsed_seconds: float,
) -> dict[str, object]:
    latencies = [item.latency_ms for item in observations]
    failed = sum(not item.ok for item in observations)
    total = len(observations)
    error_rate = failed / total if total else 1.0
    p95_ms = percentile(latencies, 0.95)
    thresholds = {
        "max_error_rate": profile.max_error_rate,
        "max_p95_ms": profile.max_p95_ms,
    }
    checks = {
        "error_rate": error_rate <= profile.max_error_rate,
        "p95_ms": p95_ms <= profile.max_p95_ms,
        "at_least_one_request": total > 0,
    }
    status_codes = Counter(str(item.status_code) if item.status_code is not None else "network_error" for item in observations)
    error_types = Counter(item.error_type for item in observations if item.error_type)
    return {
        "schema_version": 1,
        "generated_at_utc": datetime.now(UTC).isoformat(),
        "target": args.target,
        "base_url": base_url,
        "profile": args.profile,
        "configuration": {
            **asdict(profile),
            "endpoints": [asdict(endpoint) for endpoint in endpoints],
            "http_method": "GET",
        },
        "summary": {
            "requests": total,
            "succeeded": total - failed,
            "failed": failed,
            "error_rate": round(error_rate, 6),
            "throughput_per_second": round(total / elapsed_seconds, 3) if elapsed_seconds else 0.0,
            "elapsed_seconds": round(elapsed_seconds, 3),
            "latency_ms": {
                "p50": round(percentile(latencies, 0.50), 3),
                "p95": round(p95_ms, 3),
                "p99": round(percentile(latencies, 0.99), 3),
                "max": round(max(latencies), 3) if latencies else 0.0,
            },
            "status_codes": dict(sorted(status_codes.items())),
            "error_types": dict(sorted(error_types.items())),
        },
        "thresholds": thresholds,
        "checks": checks,
        "passed": all(checks.values()),
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", choices=sorted(DEFAULT_ENDPOINTS), required=True)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--profile", choices=sorted(PROFILES), default="smoke")
    parser.add_argument("--endpoint", action="append", default=[], help="Read-only path with optional @weight")
    parser.add_argument("--duration-seconds", type=int)
    parser.add_argument("--concurrency", type=int)
    parser.add_argument("--rate-per-second", type=float)
    parser.add_argument("--max-error-rate", type=float)
    parser.add_argument("--max-p95-ms", type=float)
    parser.add_argument("--request-timeout-seconds", type=float, default=10.0)
    parser.add_argument("--expected-release", default="")
    parser.add_argument("--allow-staging", action="store_true")
    parser.add_argument("--json-output", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    return parser


async def async_main(args: argparse.Namespace) -> int:
    base_url, is_local = validate_base_url(args.base_url)
    if args.request_timeout_seconds <= 0 or args.request_timeout_seconds > 30:
        raise ConfigurationError("Request timeout must be greater than zero and at most 30 seconds")
    if args.expected_release and not (
        len(args.expected_release) == 40
        and all(character in "0123456789abcdef" for character in args.expected_release)
    ):
        raise ConfigurationError("Expected release must be a full lowercase Git SHA")
    endpoints = [
        parse_endpoint(value)
        for value in (args.endpoint or DEFAULT_ENDPOINTS[args.target])
    ]
    validate_read_only_endpoints(args.target, endpoints)
    profile = resolved_profile(args, is_local=is_local)

    safe_configuration = {
        "target": args.target,
        "base_url": base_url,
        "profile": args.profile,
        "settings": asdict(profile),
        "endpoints": [asdict(endpoint) for endpoint in endpoints],
        "remote": not is_local,
        "read_only": True,
    }
    validate_credential_audience(
        target=args.target,
        base_url=base_url,
        is_local=is_local,
    )
    if args.dry_run:
        print(json.dumps(safe_configuration, ensure_ascii=False, indent=2))
        return 0

    limits = httpx.Limits(
        max_connections=profile.concurrency,
        max_keepalive_connections=profile.concurrency,
    )
    async with httpx.AsyncClient(
        base_url=base_url,
        headers=build_headers(target=args.target),
        timeout=httpx.Timeout(args.request_timeout_seconds),
        follow_redirects=False,
        limits=limits,
    ) as client:
        await assert_safe_target(
            client,
            target=args.target,
            is_local=is_local,
            allow_staging=args.allow_staging,
            expected_release=args.expected_release,
        )
        await warm_up(client, endpoints)
        observations, elapsed_seconds = await generate_load(
            client,
            endpoints=endpoints,
            profile=profile,
        )

    report = summarize(
        args=args,
        base_url=base_url,
        endpoints=endpoints,
        profile=profile,
        observations=observations,
        elapsed_seconds=elapsed_seconds,
    )
    if args.json_output:
        output_path = args.json_output.resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = output_path.with_suffix(f"{output_path.suffix}.tmp")
        temporary_path.write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        temporary_path.replace(output_path)

    summary = report["summary"]
    print(
        "Phase 7 load result: "
        f"passed={str(report['passed']).lower()} requests={summary['requests']} "
        f"errors={summary['failed']} p95_ms={summary['latency_ms']['p95']} "
        f"rps={summary['throughput_per_second']}"
    )
    return 0 if report["passed"] else 1


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return asyncio.run(async_main(args))
    except ConfigurationError as exc:
        print(f"Safety/configuration error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
