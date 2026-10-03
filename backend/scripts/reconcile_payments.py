"""Run the Phase 6 aggregate payment/entitlement reconciliation check."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal  # noqa: E402
from app.services.payments import reconcile_payment_ledger  # noqa: E402


async def main() -> int:
    async with SessionLocal() as session:
        result = await reconcile_payment_ledger(session)
    print(json.dumps(result, sort_keys=True))
    return 0 if result["healthy"] else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
