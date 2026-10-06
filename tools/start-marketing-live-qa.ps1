# Approved local-only QA server. Run manually when the agent tool cannot start it.
# Creates a separate profile and uses the existing model store; no model download.
param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$qaProject = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$qaReceiptPath = Join-Path $qaProject 'output/marketing-live-current.json'
if (-not (Test-Path -LiteralPath $qaReceiptPath)) {
    throw 'First run: node tools/verify-marketing-live.cjs --prepare'
}
$qaInfo = Get-Content -LiteralPath $qaReceiptPath -Raw | ConvertFrom-Json
$qaOutputRoot = [IO.Path]::GetFullPath((Join-Path $qaProject 'output/playwright')) + [IO.Path]::DirectorySeparatorChar
$qaRun = [IO.Path]::GetFullPath($qaInfo.dir)
if (-not $qaRun.StartsWith($qaOutputRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'QA directory is outside output/playwright.' }
if ($qaInfo.endpoint -ne 'http://127.0.0.1:11438/v1') { throw 'Unexpected QA endpoint.' }
if ($Stop) {
    if (-not $qaInfo.ollamaPid) { throw 'No owned QA server PID recorded.' }
    $qaOwned = Get-Process -Id $qaInfo.ollamaPid -ErrorAction SilentlyContinue
    if (-not $qaOwned) { Write-Output 'Recorded QA server already stopped.'; return }
    if ($qaOwned.Path -ne $qaInfo.ollamaExecutable -or $qaOwned.StartTime.ToUniversalTime().ToString('o') -ne $qaInfo.ollamaStartedAt) { throw 'PID ownership mismatch; no process was stopped.' }
    Stop-Process -Id $qaOwned.Id -ErrorAction Stop
    Write-Output 'Owned QA server stopped.'
    return
}
if (Get-NetTCPConnection -LocalPort 11438 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 11438 is already in use; no existing service was changed.' }
if (Test-Path -LiteralPath (Join-Path $qaRun 'live-result.json')) { throw 'This QA run already has evidence. Prepare a fresh diagnostic run before starting.' }
if (Test-Path -LiteralPath (Join-Path $qaRun 'ollama.stderr.log')) { throw 'This QA run already has server logs. Preserve them and prepare a fresh run.' }
$qaOllama = (Get-Command ollama -ErrorAction Stop).Source
$qaModels = $env:OLLAMA_MODELS
if (-not $qaModels) { $qaModels = Join-Path $env:USERPROFILE '.ollama/models' }
if (-not (Test-Path -LiteralPath (Join-Path $qaModels 'manifests/registry.ollama.ai/library/qwen3.5/4b'))) { throw 'The approved existing qwen3.5:4b model manifest was not found. No download attempted.' }
$qaOverrides = @{
    OLLAMA_HOST = '127.0.0.1:11438'; OLLAMA_CONTEXT_LENGTH = '32768'; OLLAMA_NUM_PARALLEL = '1'
    OLLAMA_NO_CLOUD = '1'; OLLAMA_KEEP_ALIVE = '2m'; OLLAMA_MODELS = $qaModels
    USERPROFILE = (Join-Path $qaRun 'ollama-home'); TEMP = (Join-Path $qaRun 'temp'); TMP = (Join-Path $qaRun 'temp')
}
$qaPrevious = @{}
try {
    foreach ($qaKey in $qaOverrides.Keys) {
        $qaPrevious[$qaKey] = [Environment]::GetEnvironmentVariable($qaKey, 'Process')
        [Environment]::SetEnvironmentVariable($qaKey, $qaOverrides[$qaKey], 'Process')
    }
    New-Item -ItemType Directory -Path $qaOverrides.USERPROFILE,$qaOverrides.TEMP -Force | Out-Null
    $qaServer = Start-Process -FilePath $qaOllama -ArgumentList 'serve' -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $qaRun 'ollama.stdout.log') -RedirectStandardError (Join-Path $qaRun 'ollama.stderr.log')
    $qaInfo | Add-Member -Force NoteProperty ollamaPid $qaServer.Id
    $qaInfo | Add-Member -Force NoteProperty ollamaExecutable $qaOllama
    $qaInfo | Add-Member -Force NoteProperty ollamaStartedAt $qaServer.StartTime.ToUniversalTime().ToString('o')
    $qaInfo | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $qaReceiptPath -Encoding utf8
    $qaInfo | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $qaRun 'run-receipt.json') -Encoding utf8
} finally {
    foreach ($qaKey in $qaPrevious.Keys) { [Environment]::SetEnvironmentVariable($qaKey, $qaPrevious[$qaKey], 'Process') }
}
$qaReady = $false
for ($qaAttempt = 0; $qaAttempt -lt 20; $qaAttempt++) {
    $qaServer.Refresh()
    if ($qaServer.HasExited) { throw "QA Ollama exited; inspect $qaRun/ollama.stderr.log" }
    try {
        $qaVersion = Invoke-RestMethod -Uri 'http://127.0.0.1:11438/api/version' -TimeoutSec 2
        $qaReady = $true
        break
    } catch { Start-Sleep -Milliseconds 500 }
}
if (-not $qaReady) { throw "QA server did not become ready. Its PID is $($qaServer.Id); no other service was stopped." }
Write-Output "QA ready: http://127.0.0.1:11438/v1; Ollama $($qaVersion.version); PID $($qaServer.Id)"
Write-Output 'Continue: node tools/verify-marketing-live.cjs'
