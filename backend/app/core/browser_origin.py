import re


def is_allowed_browser_origin(
    origin: str,
    *,
    allowed_origins: list[str],
    allowed_origin_regex: str = "",
) -> bool:
    """Return whether a browser Origin header matches the configured allowlist.

    HTTP CORS middleware does not protect WebSocket handshakes, so HTTP and
    WebSocket entry points share this fail-closed check.
    """
    normalized_origin = origin.strip()
    if normalized_origin in allowed_origins:
        return True

    if not allowed_origin_regex:
        return False

    try:
        return re.fullmatch(allowed_origin_regex, normalized_origin) is not None
    except re.error:
        return False
