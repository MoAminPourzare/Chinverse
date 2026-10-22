[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$manifest = Join-Path $root "docs\PHASE_0_RELEASE_BASELINE_FA.md"
$frontendRoot = Join-Path $root "frontend"
$backendRoot = Join-Path $root "backend"
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

    $historicalUploads = @(
        git @gitConfig log --all --name-only --format= -- backend/uploads backend/static/uploads |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
    if ($LASTEXITCODE -ne 0) {
        throw "Could not inspect Git history for runtime uploads."
    }
    if ($historicalUploads.Count -gt 0) {
        throw "Runtime user uploads are still present in reachable Git history:`n$($historicalUploads -join "`n")"
    }

    $trackedDatabaseArtifacts = @(git @gitConfig ls-files | Where-Object {
        $_ -match '(?i)(^|/)([^/]+\.(sqlite|sqlite3|db|dump|backup|bak))$'
    })
    if ($trackedDatabaseArtifacts.Count -gt 0) {
        throw "Database/backup artifacts must not be tracked:`n$($trackedDatabaseArtifacts -join "`n")"
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

    $legacyMigrationPath = "backend/alembic/versions/b7d4e2f1a9c6_normalize_existing_display_names.py"
    $legacyPersonalDataCommits = @(
        git @gitConfig log --all --format=%H -G 'DISPLAY_NAME_UPDATES|redacted-user@example\.invalid' -- $legacyMigrationPath
    )
    if ($LASTEXITCODE -ne 0) {
        throw "Could not inspect Git history for legacy personal-data migrations."
    }
    if ($legacyPersonalDataCommits.Count -gt 0) {
        throw "Legacy personal-data migration content remains in $($legacyPersonalDataCommits.Count) reachable commit(s); rewrite history before release."
    }

    $changeCount = @(
        Select-String -LiteralPath $manifest -Pattern '^\d+\. \*\*CHG-\d{2}\*\*'
    ).Count
    if ($changeCount -ne 29) {
        throw "The release baseline must contain exactly 29 change groups; found $changeCount."
    }

    $frontendEnvironment = Get-Content -Raw -LiteralPath (Join-Path $frontendRoot ".env.example")
    foreach ($requiredDefault in @(
        "NEXT_PUBLIC_DEPLOYMENT_TIER=staging",
        "NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS=false",
        "NEXT_PUBLIC_FEATURE_REFERRALS=false",
        "NEXT_PUBLIC_FEATURE_POINTS=false",
        "NEXT_PUBLIC_BETA_MODE=false"
    )) {
        if (-not $frontendEnvironment.Contains($requiredDefault)) {
            throw "Missing safe release default: $requiredDefault"
        }
    }

    $backendEnvironment = Get-Content -Raw -LiteralPath (Join-Path $backendRoot ".env.example")
    foreach ($requiredBackendDefault in @(
        "DEPLOYMENT_TIER=staging",
        "FEATURE_SUBSCRIPTIONS_ENABLED=false",
        "FEATURE_REFERRALS_ENABLED=false",
        "FEATURE_POINTS_ENABLED=false",
        "FEATURE_BETA_ENABLED=false",
        "PAYMENT_PROVIDER=disabled"
    )) {
        if (-not $backendEnvironment.Contains($requiredBackendDefault)) {
            throw "Missing safe backend release default: $requiredBackendDefault"
        }
    }

    $sourceContracts = @{
        "frontend release configuration" = @(
            (Join-Path $frontendRoot "src\config\release.ts"),
            'deploymentTier.*staging|deploymentTier.*\|\|.*staging',
            'isPublicRelease: deploymentTier === "production"'
        )
        "frontend robots policy" = @(
            (Join-Path $frontendRoot "src\app\robots.ts"),
            '!releaseConfig\.isPublicRelease',
            'disallow: "/"'
        )
        "frontend metadata policy" = @(
            (Join-Path $frontendRoot "src\app\layout.tsx"),
            'robots: releaseConfig\.isPublicRelease',
            'index: false'
        )
        "frontend health release contract" = @(
            (Join-Path $frontendRoot "src\app\api\health\route.ts"),
            'indexable: releaseConfig\.isPublicRelease',
            'Cache-Control.*no-store'
        )
        "backend noindex policy" = @(
            (Join-Path $backendRoot "app\main.py"),
            'if not settings\.IS_PUBLIC_RELEASE',
            'X-Robots-Tag'
        )
        "backend incomplete feature routing" = @(
            (Join-Path $backendRoot "app\api\v1\api.py"),
            'if settings\.FEATURE_REFERRALS_ENABLED',
            'if settings\.FEATURE_SUBSCRIPTIONS_ENABLED'
        )
        "frontend incomplete feature navigation" = @(
            (Join-Path $frontendRoot "src\app\settings\page.tsx"),
            'item\.feature.*releaseConfig\.features',
            'item\.beta.*releaseConfig\.betaEnabled'
        )
    }
    foreach ($contract in $sourceContracts.GetEnumerator()) {
        $path = $contract.Value[0]
        if (-not (Test-Path -LiteralPath $path)) {
            throw "Release baseline contract file is missing for $($contract.Key): $path"
        }
        $contents = Get-Content -Raw -LiteralPath $path
        foreach ($pattern in $contract.Value[1..($contract.Value.Count - 1)]) {
            if ($contents -notmatch $pattern) {
                throw "Release baseline contract '$($contract.Key)' is missing pattern '$pattern'."
            }
        }
    }

    $deployWorkflow = Get-Content -Raw -LiteralPath (Join-Path $root ".github\workflows\deploy-hf-space.yml")
    if ($deployWorkflow -match "codex/phase-7-performance-operations") {
        throw "Staging deploy workflow still contains the retired Phase 7 branch guard."
    }
    foreach ($requiredWorkflowContract in @(
        "RELEASE_REF",
        'git merge-base --is-ancestor "$RELEASE_SHA" "origin/$RELEASE_REF"',
        "release_ref"
    )) {
        if ($deployWorkflow -notmatch [regex]::Escape($requiredWorkflowContract)) {
            throw "Staging deploy workflow is missing traceability contract: $requiredWorkflowContract"
        }
    }
}
finally {
    Pop-Location
}

Write-Host "Release baseline guard passed." -ForegroundColor Green
