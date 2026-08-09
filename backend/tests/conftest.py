import os
import shutil
from pathlib import Path

import pytest


_WORKSPACE_TMP = Path(__file__).resolve().parents[2] / ".tmp"
_WORKSPACE_TMP.mkdir(parents=True, exist_ok=True)
_TEST_STORAGE_ROOT = _WORKSPACE_TMP / f"chinverse-tests-{os.getpid()}"
_TEST_STORAGE_ROOT.mkdir(parents=True, exist_ok=True)


os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = os.environ.get(
    "CHINVERSE_TEST_DATABASE_URL",
    "postgresql://chinverse_test:chinverse_test@127.0.0.1:55432/chinverse_test",
)
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-automated-tests"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["ENABLE_API_DOCS"] = "true"
os.environ["SECURE_HEADERS_ENABLED"] = "true"
os.environ["FILE_STORAGE_MODE"] = "mounted"
os.environ["MOUNTED_STORAGE_ROOT"] = str(_TEST_STORAGE_ROOT)


@pytest.hookimpl(trylast=True)
def pytest_sessionfinish() -> None:
    """Keep upload integration tests isolated from the repository filesystem."""
    shutil.rmtree(_TEST_STORAGE_ROOT, ignore_errors=True)
