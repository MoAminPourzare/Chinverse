Write-Host "Checking Alembic migration status..." -ForegroundColor Cyan

$venvAlembic = Join-Path $PSScriptRoot ".venv\Scripts\alembic.exe"

if (Test-Path $venvAlembic) {
    & $venvAlembic current

    Write-Host "`nApplying pending migrations..." -ForegroundColor Cyan
    & $venvAlembic upgrade head

    Write-Host "`nMigration complete. Current status:" -ForegroundColor Green
    & $venvAlembic current
} else {
    Write-Host "Could not find .venv\Scripts\alembic.exe." -ForegroundColor Yellow
    Write-Host "Activate the backend venv, install dependencies, then run:" -ForegroundColor Yellow
    Write-Host "  .\.venv\Scripts\Activate.ps1"
    Write-Host "  alembic upgrade head"
    exit 1
}

Write-Host "`nRestart the backend server after migrations finish." -ForegroundColor Yellow
