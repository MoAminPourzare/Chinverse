from starlette.requests import Request

from app.api.rate_limit import _client_ip
from app.core.config import settings


def make_request(
    forwarded_for: str | None = None,
    *,
    remote_ip: str = "10.0.0.25",
) -> Request:
    headers = []
    if forwarded_for:
        headers.append((b"x-forwarded-for", forwarded_for.encode("ascii")))

    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": headers,
            "client": (remote_ip, 12345),
            "server": ("test", 80),
            "scheme": "http",
            "query_string": b"",
        }
    )


def test_client_ip_does_not_trust_forwarded_header_by_default(monkeypatch):
    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", False)
    assert _client_ip(make_request("198.51.100.10")) == "10.0.0.25"


def test_client_ip_uses_only_configured_proxy_hops(monkeypatch):
    request = make_request(
        "203.0.113.7, 198.51.100.10",
        remote_ip="10.0.0.25",
    )
    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", True)
    monkeypatch.setattr(settings, "TRUSTED_PROXY_NETWORKS", "10.0.0.0/8")

    monkeypatch.setattr(settings, "TRUSTED_PROXY_COUNT", 1)
    assert _client_ip(request) == "198.51.100.10"

    monkeypatch.setattr(settings, "TRUSTED_PROXY_COUNT", 2)
    assert _client_ip(request) == "203.0.113.7"


def test_client_ip_rejects_malformed_or_incomplete_forwarding_chains(monkeypatch):
    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", True)
    monkeypatch.setattr(settings, "TRUSTED_PROXY_COUNT", 2)
    monkeypatch.setattr(settings, "TRUSTED_PROXY_NETWORKS", "10.0.0.0/8")

    assert _client_ip(make_request("not-an-ip, 198.51.100.10")) == "10.0.0.25"
    assert _client_ip(make_request("198.51.100.10")) == "10.0.0.25"
    assert _client_ip(make_request(", ".join(["198.51.100.10"] * 21))) == "10.0.0.25"


def test_client_ip_ignores_forwarding_headers_from_untrusted_peer(monkeypatch):
    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", True)
    monkeypatch.setattr(settings, "TRUSTED_PROXY_NETWORKS", "10.0.0.0/8")

    request = make_request("198.51.100.10", remote_ip="203.0.113.50")

    assert _client_ip(request) == "203.0.113.50"
