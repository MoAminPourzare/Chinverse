[CmdletBinding()]
param(
    [string]$BlockersPath = "",
    [switch]$RequireAllProviderGates
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not $BlockersPath) {
    $BlockersPath = Join-Path $root "docs\PHASE_8_RELEASE_BLOCKERS.json"
}

if (-not (Test-Path -LiteralPath $BlockersPath)) {
    throw "Phase 8 blocker record was not found: $BlockersPath"
}

$record = Get-Content -Raw -LiteralPath $BlockersPath | ConvertFrom-Json
if ($record.schema_version -ne 1) {
    throw "Unsupported Phase 8 blocker record schema."
}

foreach ($field in @("open_p0", "open_p1", "known_critical", "known_high")) {
    $value = $record.release_condition.$field
    # ConvertFrom-Json materializes JSON integers as Int64 on PowerShell 7
    # (including pwsh on Ubuntu), while Windows PowerShell commonly yields
    # Int32.  Validate the JSON number semantically instead of relying on one
    # CLR width so this gate behaves identically on every runner.
    $parsedValue = 0L
    $isInteger = $null -ne $value -and [long]::TryParse(
        [string]$value,
        [Globalization.NumberStyles]::Integer,
        [Globalization.CultureInfo]::InvariantCulture,
        [ref]$parsedValue
    )
    if (-not $isInteger -or $parsedValue -lt 0) {
        throw "Release condition '$field' must be a non-negative integer."
    }
    if ($parsedValue -ne 0) {
        throw "Phase 8 release is blocked by $field=$parsedValue."
    }
}

$providerGates = @($record.provider_gates)
if ($providerGates.Count -eq 0) {
    throw "At least one provider gate must be recorded."
}
$allowedStatuses = @("pending", "verified", "waived")
foreach ($gate in $providerGates) {
    if ([string]::IsNullOrWhiteSpace([string]$gate.id)) {
        throw "Provider gate id cannot be empty."
    }
    if ($gate.status -notin $allowedStatuses) {
        throw "Provider gate '$($gate.id)' has unsupported status '$($gate.status)'."
    }
    if ([string]$gate.status -eq "verified" -and (
            [string]::IsNullOrWhiteSpace([string]$gate.evidence) -or
            [string]::IsNullOrWhiteSpace([string]$gate.verified_at)
        )) {
        throw "A verified provider gate requires evidence and verified_at."
    }
    if ([string]$gate.status -eq "waived" -and [string]::IsNullOrWhiteSpace([string]$gate.waiver)) {
        throw "A waived provider gate requires a documented waiver."
    }
    if ([string]$gate.status -eq "waived" -and [string]::IsNullOrWhiteSpace([string]$gate.waived_by)) {
        throw "A waived provider gate requires waived_by."
    }
}
if ($RequireAllProviderGates) {
    $pending = @($providerGates | Where-Object { $_.status -eq "pending" })
    if ($pending.Count -gt 0) {
        throw "Provider gates are still pending: $($pending.id -join ', ')"
    }
}

$frontendEnv = Get-Content -Raw -LiteralPath (Join-Path $root "frontend\.env.example")
foreach ($requiredDefault in @(
    "NEXT_PUBLIC_DEPLOYMENT_TIER=staging",
    "NEXT_PUBLIC_SENTRY_ENABLED=false",
    "NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS=false"
)) {
    if (-not $frontendEnv.Contains($requiredDefault)) {
        throw "Missing fail-closed frontend default: $requiredDefault"
    }
}

$workflow = Get-Content -Raw -LiteralPath (Join-Path $root ".github\workflows\phase8-release-gate.yml")
if ($workflow -match "(?m)^\s+push:") {
    throw "Phase 8 production gate must not deploy on push; keep it manual/protected."
}
if (-not $workflow.Contains("environment:")) {
    throw "Phase 8 production gate must use a protected environment."
}
if (-not $workflow.Contains("confirm_public")) {
    throw "Phase 8 production gate must require explicit public-release confirmation."
}

Write-Host "Phase 8 local release safety gate passed: no known P0/P1/Critical/High blockers." -ForegroundColor Green
if (-not $RequireAllProviderGates) {
    Write-Host "Provider gates remain evidence-driven; use -RequireAllProviderGates before public release." -ForegroundColor Yellow
}
