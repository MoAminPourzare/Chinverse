param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\.backups"),
    [string]$SourceLabel = "unknown",
    [string]$PostgresClientImage = "postgres:18.4-alpine3.24"
)

$ErrorActionPreference = "Stop"

if ($PSVersionTable.PSVersion.Major -lt 7) {
    throw "PowerShell 7 or newer is required. Run this script with pwsh."
}

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    throw "DATABASE_URL or -DatabaseUrl is required."
}
if ($DatabaseUrl -match "user:password|postgres:postgres") {
    throw "Refusing to back up a placeholder database URL."
}

$outputPath = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$dumpName = "chinverse-$timestamp.dump"
$dumpPath = Join-Path $outputPath $dumpName
$metadataPath = "$dumpPath.json"
$image = $PostgresClientImage

$env:CHINVERSE_BACKUP_DATABASE_URL = $DatabaseUrl
$env:CHINVERSE_BACKUP_FILE = $dumpName
function Get-SourceAlembicRevision {
    $revisionOutput = & docker run --rm `
        -e CHINVERSE_BACKUP_DATABASE_URL `
        $image `
        sh -c 'psql "$CHINVERSE_BACKUP_DATABASE_URL" -v ON_ERROR_STOP=1 -tA -c "SELECT version_num FROM alembic_version ORDER BY version_num"'
    if ($LASTEXITCODE -ne 0) {
        throw "Could not read the source Alembic revision (exit code $LASTEXITCODE)."
    }
    $revisionText = [string]::Join("`n", @($revisionOutput | ForEach-Object { [string]$_ })).Trim()
    $revisions = @(
        $revisionText -split "`r?`n" |
            ForEach-Object { $_.Trim() } |
            Where-Object { $_.Length -gt 0 }
    )
    if ($revisions.Count -ne 1 -or ([string]$revisions[0]) -notmatch '^[A-Za-z0-9_]+$') {
        throw "Source database must contain exactly one valid Alembic revision."
    }
    return ([string]$revisions[0]).Trim()
}

try {
    $alembicRevisionBefore = Get-SourceAlembicRevision

    & docker run --rm `
        -e CHINVERSE_BACKUP_DATABASE_URL `
        -e CHINVERSE_BACKUP_FILE `
        -v "${outputPath}:/backup" `
        $image `
        sh -c 'pg_dump --dbname="$CHINVERSE_BACKUP_DATABASE_URL" --schema=public --format=custom --compress=9 --no-owner --no-acl --file="/backup/$CHINVERSE_BACKUP_FILE"'
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE."
    }

    $alembicRevisionAfter = Get-SourceAlembicRevision
    if ($alembicRevisionBefore -ne $alembicRevisionAfter) {
        Remove-Item -LiteralPath $dumpPath -Force -ErrorAction SilentlyContinue
        throw "Source Alembic revision changed while the backup snapshot was being created. Retry after migrations finish."
    }
    $alembicRevision = $alembicRevisionBefore
}
finally {
    Remove-Item Env:CHINVERSE_BACKUP_DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:CHINVERSE_BACKUP_FILE -ErrorAction SilentlyContinue
}

if (-not (Test-Path -LiteralPath $dumpPath)) {
    throw "Backup file was not created."
}

$sourceUri = [Uri]$DatabaseUrl
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$safeRepositoryRoot = $repositoryRoot.Replace("\", "/")
$releaseSha = (& git -c "safe.directory=$safeRepositoryRoot" -C $repositoryRoot rev-parse HEAD 2>$null)
$metadata = [ordered]@{
    format = "postgres-custom"
    created_at_utc = (Get-Date).ToUniversalTime().ToString("o")
    source_label = $SourceLabel
    source_host = $sourceUri.Host
    source_database = $sourceUri.AbsolutePath.TrimStart("/")
    dump_file = $dumpName
    size_bytes = (Get-Item -LiteralPath $dumpPath).Length
    sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $dumpPath).Hash.ToLowerInvariant()
    postgres_client_image = $image
    release_sha = ($releaseSha | Select-Object -First 1)
    alembic_revision = $alembicRevision
}
$metadata | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $metadataPath -Encoding utf8

Write-Output "Backup: $dumpPath"
Write-Output "Metadata: $metadataPath"
Write-Output "SHA256: $($metadata.sha256)"
