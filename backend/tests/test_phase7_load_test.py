from types import SimpleNamespace

import httpx
import pytest

from scripts import phase7_load_test as load


def _profile_args(*extra: str):
    return load.build_parser().parse_args(
        [
            "--target",
            "backend",
            "--base-url",
            "https://staging.example.com",
            "--profile",
            "smoke",
            *extra,
        ]
    )


@pytest.mark.asyncio
async def test_remote_guard_refuses_a_production_health_contract() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/health"
        return httpx.Response(
            200,
            json={
                "status": "ok",
                "deployment_tier": "production",
                "release": "a" * 40,
            },
        )

    async with httpx.AsyncClient(
        base_url="https://production.example.com",
        transport=httpx.MockTransport(handler),
    ) as client:
        with pytest.raises(load.ConfigurationError, match="production is always refused"):
            await load.assert_safe_target(
                client,
                target="backend",
                is_local=False,
                allow_staging=True,
                expected_release="",
            )


def test_remote_url_requires_https_and_rejects_credentials() -> None:
    with pytest.raises(load.ConfigurationError, match="must use HTTPS"):
        load.validate_base_url("http://staging.example.com")
    with pytest.raises(load.ConfigurationError, match="cannot contain credentials"):
        load.validate_base_url("https://operator:secret@staging.example.com")
    with pytest.raises(load.ConfigurationError, match="cannot contain credentials"):
        load.validate_base_url("https://staging.example.com?token=secret")


def test_endpoint_allowlist_rejects_active_readiness_and_stateful_paths() -> None:
    load.validate_read_only_endpoints(
        "backend",
        [load.Endpoint("/health", 1), load.Endpoint("/api/v1/courses/7", 1)],
    )
    with pytest.raises(load.ConfigurationError, match="read-only allowlist"):
        load.validate_read_only_endpoints(
            "backend",
            [load.Endpoint("/health/ready", 1)],
        )
    with pytest.raises(load.ConfigurationError, match="read-only allowlist"):
        load.validate_read_only_endpoints(
            "backend",
            [load.Endpoint("/api/v1/chat/42", 1)],
        )


def test_remote_caps_are_fail_closed() -> None:
    with pytest.raises(load.ConfigurationError, match="Concurrency"):
        load.resolved_profile(
            _profile_args("--concurrency", str(load.REMOTE_MAX_CONCURRENCY + 1)),
            is_local=False,
        )
    with pytest.raises(load.ConfigurationError, match="Rate"):
        load.resolved_profile(
            _profile_args("--rate-per-second", str(load.REMOTE_MAX_RATE_PER_SECOND + 1)),
            is_local=False,
        )
    with pytest.raises(load.ConfigurationError, match="Duration"):
        load.resolved_profile(
            _profile_args("--duration-seconds", str(load.REMOTE_MAX_DURATION_SECONDS + 1)),
            is_local=False,
        )


def test_remote_credentials_are_bound_to_the_exact_owned_host(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("PHASE7_BEARER_TOKEN", "short-lived-fixture-token")
    with pytest.raises(load.ConfigurationError, match="exact trusted staging host"):
        load.validate_credential_audience(
            target="backend",
            base_url="https://attacker.example/",
            is_local=False,
        )

    load.validate_credential_audience(
        target="backend",
        base_url="https://moamin9-chinverse-api.hf.space",
        is_local=False,
    )

    monkeypatch.setenv("PHASE7_VERCEL_BYPASS_SECRET", "preview-secret")
    with pytest.raises(load.ConfigurationError, match="only be used with the frontend"):
        load.validate_credential_audience(
            target="backend",
            base_url="https://moamin9-chinverse-api.hf.space",
            is_local=False,
        )

    monkeypatch.delenv("PHASE7_VERCEL_BYPASS_SECRET")
    with pytest.raises(load.ConfigurationError, match="only be used with the backend"):
        load.validate_credential_audience(
            target="frontend",
            base_url=(
                "https://chinverse-git-codex-phase-7-performance-operations-"
                "death-stroke.vercel.app"
            ),
            is_local=False,
        )


def test_percentile_and_threshold_verdict_are_deterministic() -> None:
    observations = [
        load.Observation(latency_ms=float(value), status_code=200, ok=True)
        for value in range(1, 101)
    ]
    profile = load.Profile(
        duration_seconds=1,
        concurrency=1,
        rate_per_second=1.0,
        max_error_rate=0.0,
        max_p95_ms=95.0,
    )
    report = load.summarize(
        args=SimpleNamespace(target="backend", profile="smoke"),
        base_url="http://127.0.0.1:8000",
        endpoints=[load.Endpoint("/health", 1)],
        profile=profile,
        observations=observations,
        elapsed_seconds=100.0,
    )

    assert load.percentile([1.0, 2.0, 3.0, 4.0], 0.95) == 4.0
    assert report["summary"]["latency_ms"]["p95"] == 95.0
    assert report["checks"] == {
        "error_rate": True,
        "p95_ms": True,
        "at_least_one_request": True,
    }
    assert report["passed"] is True

    observations[-1].ok = False
    failed = load.summarize(
        args=SimpleNamespace(target="backend", profile="smoke"),
        base_url="http://127.0.0.1:8000",
        endpoints=[load.Endpoint("/health", 1)],
        profile=profile,
        observations=observations,
        elapsed_seconds=100.0,
    )
    assert failed["checks"]["error_rate"] is False
    assert failed["passed"] is False


@pytest.mark.asyncio
async def test_dry_run_performs_no_network_and_never_outputs_secrets(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    class ForbiddenClient:
        def __init__(self, *args, **kwargs):
            raise AssertionError("dry-run attempted network access")

    monkeypatch.setattr(load.httpx, "AsyncClient", ForbiddenClient)
    monkeypatch.setenv("PHASE7_BEARER_TOKEN", "never-print-bearer")
    monkeypatch.delenv("PHASE7_VERCEL_BYPASS_SECRET", raising=False)
    args = load.build_parser().parse_args(
        [
            "--target",
            "backend",
            "--base-url",
            "https://moamin9-chinverse-api.hf.space",
            "--profile",
            "smoke",
            "--allow-staging",
            "--dry-run",
        ]
    )

    assert await load.async_main(args) == 0
    output = capsys.readouterr().out
    assert '"read_only": true' in output
    assert "never-print-bearer" not in output
    assert "never-print-bypass" not in output
