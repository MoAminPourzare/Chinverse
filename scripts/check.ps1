[CmdletBinding()]
param(
    [switch]$WithIntegration,
    [switch]$WithE2E,
    [string]$Python = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend"
$env:PYTHONPYCACHEPREFIX = Join-Path ([System.IO.Path]::GetTempPath()) "chinverse-pycache"
$env:COVERAGE_FILE = Join-Path ([System.IO.Path]::GetTempPath()) "chinverse.coverage"
$pytestBaseTemp = Join-Path ([System.IO.Path]::GetTempPath()) ("chinverse-pytest-" + [guid]::NewGuid().ToString("N"))

function Assert-NativeSuccess {
    param([Parameter(Mandatory = $true)][string]$Step)

    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE."
    }
}

if (-not $Python) {
    $Python = Join-Path $backend ".venv-test\Scripts\python.exe"
}

if (-not (Test-Path -LiteralPath $Python)) {
    throw "Python test environment not found at '$Python'. Follow the bootstrap steps in README.md."
}

Write-Host "`n[1/2] Frontend quality gates" -ForegroundColor Cyan
Push-Location $frontend
try {
    npm.cmd audit --omit=dev --audit-level=low
    Assert-NativeSuccess "Frontend dependency audit"
    npm.cmd run check
    Assert-NativeSuccess "Frontend checks"
    if ($WithE2E) {
        $previousPlaywrightServerMode = $env:PLAYWRIGHT_SERVER_MODE
        try {
            $env:PLAYWRIGHT_SERVER_MODE = "production"
            npm.cmd run test:e2e
            Assert-NativeSuccess "Frontend browser tests"
        }
        finally {
            if ($null -eq $previousPlaywrightServerMode) {
                Remove-Item Env:PLAYWRIGHT_SERVER_MODE -ErrorAction SilentlyContinue
            }
            else {
                $env:PLAYWRIGHT_SERVER_MODE = $previousPlaywrightServerMode
            }
        }
    }
}
finally {
    Pop-Location
}

Write-Host "`n[2/2] Backend quality gates" -ForegroundColor Cyan
Push-Location $backend
try {
    & $Python -m pip check
    Assert-NativeSuccess "Backend dependency consistency"
    & $Python -m pip_audit
    Assert-NativeSuccess "Backend dependency audit"
    & $Python -m ruff check --no-cache app tests
    Assert-NativeSuccess "Backend lint"
    & $Python -m compileall -q app tests
    Assert-NativeSuccess "Backend bytecode compilation"
    & $Python -m pytest -p no:cacheprovider --basetemp $pytestBaseTemp -m "not integration" --cov=app --cov-report=term-missing --cov-fail-under=50
    Assert-NativeSuccess "Backend unit tests"

    if ($WithIntegration) {
        docker compose -f (Join-Path $root "compose.test.yml") up -d --wait
        Assert-NativeSuccess "Test database startup"
        try {
            $env:CHINVERSE_TEST_DATABASE_URL = "postgresql://chinverse_test:chinverse_test@127.0.0.1:55432/chinverse_test"
            $env:DATABASE_URL = $env:CHINVERSE_TEST_DATABASE_URL
            $env:ENVIRONMENT = "test"
            $env:SECRET_KEY = "test-secret-key-that-is-long-enough-for-automated-tests"
            & $Python -m alembic upgrade head
            Assert-NativeSuccess "Database migration"
            & $Python -m alembic check
            Assert-NativeSuccess "Model and migration parity"
            & $Python -m pytest -p no:cacheprovider --basetemp $pytestBaseTemp -m integration
            Assert-NativeSuccess "Backend integration tests"
            & $Python -m alembic downgrade base
            Assert-NativeSuccess "Migration rollback"
            & $Python -m alembic upgrade head
            Assert-NativeSuccess "Migration rebuild"
            & $Python -m alembic check
            Assert-NativeSuccess "Post-rebuild migration parity"

            docker build --tag chinverse-backend:local-check .
            Assert-NativeSuccess "Production backend container build"
        }
        finally {
            docker compose -f (Join-Path $root "compose.test.yml") down -v
            Assert-NativeSuccess "Test database cleanup"
        }
    }
}
finally {
    Pop-Location
}

Write-Host "`nAll requested quality gates passed." -ForegroundColor Green
