param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\.backups"),
    [string]$SourceLabel = "unknown",
    [string]$PostgresClientImage = "postgres:18.4-alpine3.24"
)

$ErrorActionPreference = "Stop"

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
try {
    & docker run --rm `
        -e CHINVERSE_BACKUP_DATABASE_URL `
        -e CHINVERSE_BACKUP_FILE `
        -v "${outputPath}:/backup" `
        $image `
        sh -c 'pg_dump --dbname="$CHINVERSE_BACKUP_DATABASE_URL" --schema=public --format=custom --compress=9 --no-owner --no-acl --file="/backup/$CHINVERSE_BACKUP_FILE"'
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE."
    }
}
finally {
    Remove-Item Env:CHINVERSE_BACKUP_DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:CHINVERSE_BACKUP_FILE -ErrorAction SilentlyContinue
}

if (-not (Test-Path -LiteralPath $dumpPath)) {
    throw "Backup file was not created."
}

$sourceUri = [Uri]$DatabaseUrl
$releaseSha = (& git -c safe.directory=E:/Chinverse rev-parse HEAD 2>$null)
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
}
$metadata | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $metadataPath -Encoding utf8

Write-Output "Backup: $dumpPath"
Write-Output "Metadata: $metadataPath"
Write-Output "SHA256: $($metadata.sha256)"
