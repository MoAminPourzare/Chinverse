import ipaddress

from fastapi import Request

from app.core.config import settings


def client_ip(request: Request) -> str:
    remote_ip = request.client.host if request.client and request.client.host else "unknown"
    if not settings.TRUST_PROXY_HEADERS:
        return remote_ip

    try:
        remote_address = ipaddress.ip_address(remote_ip)
        trusted_networks = [
            ipaddress.ip_network(value, strict=False)
            for value in settings.TRUSTED_PROXY_CIDRS
        ]
    except ValueError:
        return remote_ip
    if not trusted_networks or not any(
        remote_address in network for network in trusted_networks
    ):
        return remote_ip

    forwarded_for = request.headers.get("x-forwarded-for", "")
    candidates = [item.strip() for item in forwarded_for.split(",") if item.strip()]
    if not candidates or len(candidates) > 20:
        return remote_ip

    validated: list[str] = []
    for candidate in candidates:
        try:
            validated.append(str(ipaddress.ip_address(candidate)))
        except ValueError:
            return remote_ip

    trusted_proxy_count = max(1, settings.TRUSTED_PROXY_COUNT)
    if len(validated) < trusted_proxy_count:
        return remote_ip
    return validated[-trusted_proxy_count]
