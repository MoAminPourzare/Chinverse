from starlette.requests import Request

from app.api.rate_limit import _client_ip
from app.core.config import settings


def make_request(forwarded_for: str | None = None) -> Request:
    headers = []
    if forwarded_for:
        headers.append((b"x-forwarded-for", forwarded_for.encode("ascii")))

    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": headers,
            "client": ("10.0.0.25", 12345),
            "server": ("test", 80),
            "scheme": "http",
            "query_string": b"",
        }
    )


def test_client_ip_does_not_trust_forwarded_header_by_default(monkeypatch):
    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", False)
    assert _client_ip(make_request("198.51.100.10")) == "10.0.0.25"


def test_client_ip_uses_only_configured_proxy_hops(monkeypatch):
    request = make_request("203.0.113.7, 198.51.100.10")
    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", True)

    monkeypatch.setattr(settings, "TRUSTED_PROXY_COUNT", 1)
    assert _client_ip(request) == "198.51.100.10"

    monkeypatch.setattr(settings, "TRUSTED_PROXY_COUNT", 2)
    assert _client_ip(request) == "203.0.113.7"
