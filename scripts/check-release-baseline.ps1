[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$manifest = Join-Path $root "docs\PHASE_0_RELEASE_BASELINE_FA.md"
$gitConfig = @("-c", "safe.directory=$($root -replace '\\', '/')")

Push-Location $root
try {
    $trackedUploads = @(git @gitConfig ls-files -- backend/uploads backend/static/uploads)
    if ($LASTEXITCODE -ne 0) {
        throw "Could not inspect tracked files."
    }
    if ($trackedUploads.Count -gt 0) {
        throw "Runtime user uploads must not be tracked:`n$($trackedUploads -join "`n")"
    }

    $trackedEnvironmentFiles = @(git @gitConfig ls-files | Where-Object {
        $_ -match '(^|/)\.env($|\.)' -and
        $_ -notin @(".env.template", "backend/.env.example", "frontend/.env.example")
    })
    if ($trackedEnvironmentFiles.Count -gt 0) {
        throw "Private environment files must not be tracked:`n$($trackedEnvironmentFiles -join "`n")"
    }

    $secretPatterns = [ordered]@{
        private_key = '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'
        github_token = '\bgh[pousr]_[A-Za-z0-9]{36,}\b'
        huggingface_token = '\bhf_[A-Za-z0-9]{30,}\b'
        aws_access_key = '\b(AKIA|ASIA)[A-Z0-9]{16}\b'
        stripe_secret = '\b(sk_live|rk_live)_[A-Za-z0-9]{20,}\b'
        slack_token = '\bxox[baprs]-[A-Za-z0-9-]{20,}\b'
    }
    foreach ($entry in $secretPatterns.GetEnumerator()) {
        $matches = @(git @gitConfig grep -IEn -e $entry.Value -- . 2>$null)
        if ($LASTEXITCODE -notin @(0, 1)) {
            throw "Secret scan failed for pattern $($entry.Key)."
        }
        if ($matches.Count -gt 0) {
            throw "Potential $($entry.Key) secret found in tracked files:`n$($matches -join "`n")"
        }
    }

    $history = @(git @gitConfig log --all -p --no-color -- .)
    if ($LASTEXITCODE -ne 0) {
        throw "Could not inspect Git history."
    }
    foreach ($entry in $secretPatterns.GetEnumerator()) {
        $historyMatchCount = @(
            $history | Select-String -Pattern $entry.Value
        ).Count
        if ($historyMatchCount -gt 0) {
            throw "Potential $($entry.Key) secret found in Git history. Rotate it before release."
        }
    }

    $migration = Get-Content -Raw -LiteralPath (
        Join-Path $root "backend\alembic\versions\b7d4e2f1a9c6_normalize_existing_display_names.py"
    )
    if ($migration -match '[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.') {
        throw "A historical migration still contains personal email addresses."
    }

    $changeCount = @(
        Select-String -LiteralPath $manifest -Pattern '^\d+\. \*\*CHG-\d{2}\*\*'
    ).Count
    if ($changeCount -ne 29) {
        throw "The release baseline must contain exactly 29 change groups; found $changeCount."
    }

    $frontendEnvironment = Get-Content -Raw -LiteralPath (
        Join-Path $root "frontend\.env.example"
    )
    foreach ($requiredDefault in @(
        "NEXT_PUBLIC_DEPLOYMENT_TIER=staging",
        "NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS=false",
        "NEXT_PUBLIC_FEATURE_REFERRALS=false",
        "NEXT_PUBLIC_FEATURE_POINTS=false"
    )) {
        if (-not $frontendEnvironment.Contains($requiredDefault)) {
            throw "Missing safe release default: $requiredDefault"
        }
    }
}
finally {
    Pop-Location
}

Write-Host "Release baseline guard passed." -ForegroundColor Green
