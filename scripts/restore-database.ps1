param(
    [Parameter(Mandatory = $true)]
    [string]$DumpPath,
    [string]$TargetDatabaseUrl = $env:RESTORE_DATABASE_URL,
    [string]$MetadataPath = "$DumpPath.json",
    [switch]$ConfirmIsolatedTarget,
    [switch]$AllowSameHost,
    [string]$PostgresClientImage = "postgres:18.4-alpine3.24"
)

$ErrorActionPreference = "Stop"

if (-not $ConfirmIsolatedTarget) {
    throw "Restore requires -ConfirmIsolatedTarget."
}
if ([string]::IsNullOrWhiteSpace($TargetDatabaseUrl)) {
    throw "RESTORE_DATABASE_URL or -TargetDatabaseUrl is required."
}
if (-not (Test-Path -LiteralPath $DumpPath)) {
    throw "Dump file does not exist: $DumpPath"
}
if (-not (Test-Path -LiteralPath $MetadataPath)) {
    throw "Backup metadata does not exist: $MetadataPath"
}

$dump = Get-Item -LiteralPath $DumpPath
$metadata = Get-Content -Raw -LiteralPath $MetadataPath -Encoding utf8 | ConvertFrom-Json
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $dump.FullName).Hash.ToLowerInvariant()
if ($actualHash -ne $metadata.sha256) {
    throw "Backup checksum mismatch."
}

$targetUri = [Uri]$TargetDatabaseUrl
$targetDatabase = $targetUri.AbsolutePath.TrimStart("/")
$sameHost = $targetUri.Host -eq $metadata.source_host
$sameDatabase = $targetDatabase -eq $metadata.source_database
if ($sameHost -and $sameDatabase) {
    throw "Refusing to restore over the source database."
}
if ($sameHost -and -not $AllowSameHost) {
    throw "Target host matches the source. Use a Neon branch endpoint or pass -AllowSameHost for an isolated local database."
}

$dumpDirectory = $dump.Directory.FullName
$image = $PostgresClientImage
$verifyName = "chinverse-restore-verify-$([guid]::NewGuid().ToString('N')).sql"
$verifyPath = Join-Path $dumpDirectory $verifyName
"ANALYZE;`nSELECT version_num FROM alembic_version;`n" |
    Set-Content -LiteralPath $verifyPath -Encoding ascii
$env:CHINVERSE_RESTORE_DATABASE_URL = $TargetDatabaseUrl
$env:CHINVERSE_RESTORE_FILE = $dump.Name
$env:CHINVERSE_RESTORE_VERIFY_FILE = $verifyName
try {
    & docker run --rm `
        -e CHINVERSE_RESTORE_DATABASE_URL `
        -e CHINVERSE_RESTORE_FILE `
        -v "${dumpDirectory}:/backup:ro" `
        $image `
        sh -c 'pg_restore --dbname="$CHINVERSE_RESTORE_DATABASE_URL" --clean --if-exists --no-owner --no-acl --exit-on-error --single-transaction "/backup/$CHINVERSE_RESTORE_FILE"'
    if ($LASTEXITCODE -ne 0) {
        throw "pg_restore failed with exit code $LASTEXITCODE."
    }

    $verifyOutput = & docker run --rm `
        -e CHINVERSE_RESTORE_DATABASE_URL `
        -e CHINVERSE_RESTORE_VERIFY_FILE `
        -v "${dumpDirectory}:/backup:ro" `
        $image `
        sh -c 'psql "$CHINVERSE_RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -tA -f "/backup/$CHINVERSE_RESTORE_VERIFY_FILE"'
    if ($LASTEXITCODE -ne 0) {
        throw "Post-restore verification failed with exit code $LASTEXITCODE."
    }
    if (($verifyOutput -join "`n") -notmatch "c8f1e2a4d6b9") {
        throw "Restored database is not at the expected Alembic revision."
    }
}
finally {
    Remove-Item Env:CHINVERSE_RESTORE_DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:CHINVERSE_RESTORE_FILE -ErrorAction SilentlyContinue
    Remove-Item Env:CHINVERSE_RESTORE_VERIFY_FILE -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $verifyPath -Force -ErrorAction SilentlyContinue
}

Write-Output "Restore verified on isolated target $($targetUri.Host)/$targetDatabase"
