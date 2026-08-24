param(
    [Parameter(Mandatory = $true)]
    [string]$DumpPath,
    [string]$TargetDatabaseUrl = $env:RESTORE_DATABASE_URL,
    [string]$MetadataPath = "$DumpPath.json",
    [string]$ExpectedAlembicRevision = "",
    [switch]$ConfirmIsolatedTarget,
    [switch]$AllowSameHost,
    [string]$PostgresClientImage = "postgres:18.4-alpine3.24",
    [string]$PostgresClientDirectory = ""
)

$ErrorActionPreference = "Stop"

if ($PSVersionTable.PSVersion.Major -lt 7) {
    throw "PowerShell 7 or newer is required. Run this script with pwsh."
}

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

$metadataRevision = if ($metadata.PSObject.Properties.Name -contains "alembic_revision") {
    [string]$metadata.alembic_revision
} else {
    ""
}
$expectedRevision = if (-not [string]::IsNullOrWhiteSpace($ExpectedAlembicRevision)) {
    $ExpectedAlembicRevision.Trim()
} else {
    $metadataRevision.Trim()
}
if ([string]::IsNullOrWhiteSpace($expectedRevision)) {
    throw "Backup metadata has no Alembic revision. Supply -ExpectedAlembicRevision for a reviewed legacy backup."
}
if ($expectedRevision -notmatch '^[A-Za-z0-9_]+$') {
    throw "Expected Alembic revision has an invalid format."
}
if (-not [string]::IsNullOrWhiteSpace($metadataRevision) -and $metadataRevision.Trim() -ne $expectedRevision) {
    throw "Explicit Alembic revision does not match backup metadata."
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
$useNativeClient = -not [string]::IsNullOrWhiteSpace($PostgresClientDirectory)
$nativeClientDirectory = $null
$pgRestorePath = $null
$psqlPath = $null

function Resolve-PostgresClientExecutable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Directory,
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $candidate = Join-Path $Directory $Name
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
        $candidate = "$candidate.exe"
    }
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
        throw "Native PostgreSQL client is missing: $candidate"
    }
    return (Get-Item -LiteralPath $candidate).FullName
}

if ($useNativeClient) {
    $nativeClientDirectory = [System.IO.Path]::GetFullPath($PostgresClientDirectory)
    if (-not (Test-Path -LiteralPath $nativeClientDirectory -PathType Container)) {
        throw "-PostgresClientDirectory does not exist or is not a directory: $nativeClientDirectory"
    }
    $pgRestorePath = Resolve-PostgresClientExecutable -Directory $nativeClientDirectory -Name "pg_restore"
    $psqlPath = Resolve-PostgresClientExecutable -Directory $nativeClientDirectory -Name "psql"
}

$env:CHINVERSE_RESTORE_DATABASE_URL = $TargetDatabaseUrl
$env:CHINVERSE_RESTORE_FILE = $dump.Name
try {
    if ($useNativeClient) {
        & $pgRestorePath `
            "--dbname=$TargetDatabaseUrl" `
            "--clean" "--if-exists" "--no-owner" "--no-acl" `
            "--exit-on-error" "--single-transaction" $dump.FullName
    } else {
        & docker run --rm `
            -e CHINVERSE_RESTORE_DATABASE_URL `
            -e CHINVERSE_RESTORE_FILE `
            -v "${dumpDirectory}:/backup:ro" `
            $image `
            sh -c 'pg_restore --dbname="$CHINVERSE_RESTORE_DATABASE_URL" --clean --if-exists --no-owner --no-acl --exit-on-error --single-transaction "/backup/$CHINVERSE_RESTORE_FILE"'
    }
    if ($LASTEXITCODE -ne 0) {
        throw "pg_restore failed with exit code $LASTEXITCODE."
    }

    if ($useNativeClient) {
        & $psqlPath "--dbname=$TargetDatabaseUrl" "-v" "ON_ERROR_STOP=1" "-c" "ANALYZE" | Out-Null
    } else {
        & docker run --rm `
            -e CHINVERSE_RESTORE_DATABASE_URL `
            $image `
            sh -c 'psql "$CHINVERSE_RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -c "ANALYZE" >/dev/null'
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Post-restore ANALYZE failed with exit code $LASTEXITCODE."
    }

    if ($useNativeClient) {
        $verifyOutput = & $psqlPath `
            "--dbname=$TargetDatabaseUrl" `
            "-v" "ON_ERROR_STOP=1" "-tA" `
            "-c" "SELECT version_num FROM alembic_version ORDER BY version_num"
    } else {
        $verifyOutput = & docker run --rm `
            -e CHINVERSE_RESTORE_DATABASE_URL `
            $image `
            sh -c 'psql "$CHINVERSE_RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -tA -c "SELECT version_num FROM alembic_version ORDER BY version_num"'
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Post-restore revision verification failed with exit code $LASTEXITCODE."
    }
    $restoredRevisions = @(
        $verifyOutput |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
    if ($restoredRevisions.Count -ne 1 -or $restoredRevisions[0] -ne $expectedRevision) {
        throw "Restored database Alembic revision does not match the reviewed backup metadata."
    }
}
finally {
    Remove-Item Env:CHINVERSE_RESTORE_DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:CHINVERSE_RESTORE_FILE -ErrorAction SilentlyContinue
}

Write-Output "Restore verified on isolated target $($targetUri.Host)/$targetDatabase"
