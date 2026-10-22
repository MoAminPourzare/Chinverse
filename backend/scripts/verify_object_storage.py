from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import secrets
import sys

import httpx


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.core.storage import (  # noqa: E402
    CACHE_CONTROL_IMMUTABLE,
    get_object_storage_client,
)


def object_url(key: str) -> str:
    return f"{settings.OBJECT_STORAGE_PUBLIC_BASE_URL.rstrip('/')}/{key}"


def write_probe() -> dict[str, str | int]:
    payload = secrets.token_bytes(64)
    key = f"phase2-smoke/{secrets.token_hex(16)}.bin"
    get_object_storage_client().put_object(
        Bucket=settings.OBJECT_STORAGE_BUCKET_NAME,
        Key=key,
        Body=payload,
        ContentType="application/octet-stream",
        CacheControl=CACHE_CONTROL_IMMUTABLE,
    )
    return {
        "key": key,
        "sha256": hashlib.sha256(payload).hexdigest(),
        "size_bytes": len(payload),
        "public_url": object_url(key),
    }


def verify_probe(key: str, expected_sha256: str, *, delete: bool) -> dict[str, object]:
    response = get_object_storage_client().get_object(
        Bucket=settings.OBJECT_STORAGE_BUCKET_NAME,
        Key=key,
    )
    payload = response["Body"].read()
    actual_sha256 = hashlib.sha256(payload).hexdigest()
    if actual_sha256 != expected_sha256:
        raise RuntimeError("Object storage checksum mismatch")

    public_response = httpx.get(object_url(key), timeout=30.0)
    public_response.raise_for_status()
    if hashlib.sha256(public_response.content).hexdigest() != expected_sha256:
        raise RuntimeError("Public object URL checksum mismatch")

    if delete:
        get_object_storage_client().delete_object(
            Bucket=settings.OBJECT_STORAGE_BUCKET_NAME,
            Key=key,
        )

    return {
        "key": key,
        "sha256": actual_sha256,
        "public_status": public_response.status_code,
        "deleted": delete,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Write or verify an object storage probe across deployments."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("write")

    verify_parser = subparsers.add_parser("verify")
    verify_parser.add_argument("--key", required=True)
    verify_parser.add_argument("--sha256", required=True)
    verify_parser.add_argument("--delete", action="store_true")
    args = parser.parse_args()

    if settings.FILE_STORAGE_MODE != "s3":
        raise RuntimeError("FILE_STORAGE_MODE must be s3")

    if args.command == "write":
        result = write_probe()
    else:
        result = verify_probe(args.key, args.sha256, delete=args.delete)
    print(json.dumps(result, ensure_ascii=True))


if __name__ == "__main__":
    main()
