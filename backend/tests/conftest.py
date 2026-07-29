import os


os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = os.environ.get(
    "CHINVERSE_TEST_DATABASE_URL",
    "postgresql://chinverse_test:chinverse_test@127.0.0.1:55432/chinverse_test",
)
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-automated-tests"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["ENABLE_API_DOCS"] = "true"
os.environ["SECURE_HEADERS_ENABLED"] = "true"
