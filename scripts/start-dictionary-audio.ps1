param(
    [string]$PythonExe,
    [string]$ExistingAudioDir = 'E:\chini\hsk1_audio',
    [int]$Limit = 0,
    [switch]$ReportOnly
)
$ErrorActionPreference = 'Stop'
$taskProjectRoot = Split-Path -Parent $PSScriptRoot
$taskOutputDir = Join-Path $taskProjectRoot 'dictionary-audio-output'
$taskVenvDir = Join-Path $taskProjectRoot '.tmp\dictionary-audio-venv'
$taskVenvPython = Join-Path $taskVenvDir 'Scripts\python.exe'
if (-not (Test-Path -LiteralPath $taskVenvPython)) {
    if (-not $PythonExe) {
        $taskBundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
        if (Test-Path -LiteralPath $taskBundledPython) { $PythonExe = $taskBundledPython }
        else {
            $taskPythonCommand = Get-Command python -ErrorAction SilentlyContinue
            if ($taskPythonCommand) { $PythonExe = $taskPythonCommand.Source }
        }
    }
    if (-not $PythonExe -or -not (Test-Path -LiteralPath $PythonExe)) {
        throw 'Python 3.10+ was not found. Run this script with -PythonExe pointing to your python.exe.'
    }
    & $PythonExe -m venv $taskVenvDir
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the isolated audio Python environment.' }
}
& $taskVenvPython -m pip install --disable-pip-version-check -r (Join-Path $taskProjectRoot 'backend\requirements-audio.txt')
if ($LASTEXITCODE -ne 0) { throw 'Could not install audio dependencies. Completed audio files remain intact.' }
$taskArguments = @('-X', 'utf8', (Join-Path $taskProjectRoot 'backend\scripts\dictionary_audio.py'), '--output', $taskOutputDir)
if ($ExistingAudioDir) {
    if (-not (Test-Path -LiteralPath $ExistingAudioDir -PathType Container)) { throw 'The existing audio folder was not found.' }
    $taskArguments += @('--existing-dir', $ExistingAudioDir)
}
if ($Limit -lt 0) { throw 'Limit must be zero or positive.' }
if ($Limit) { $taskArguments += @('--limit', $Limit) }
if ($ReportOnly) { $taskArguments += '--report-only' }
Write-Host 'Keep this window open. If interrupted, run the same command to resume.'
& $taskVenvPython @taskArguments
$taskExitCode = $LASTEXITCODE
Write-Host "Output folder: $taskOutputDir"
if ($taskExitCode -eq 2) { Write-Warning 'Some recordings are missing. Run the same command again to retry them.' }
exit $taskExitCode
