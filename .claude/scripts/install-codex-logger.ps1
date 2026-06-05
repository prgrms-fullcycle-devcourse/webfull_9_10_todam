# Codex Desktop 작업로그 수집기를 Windows 작업 스케줄러에 등록한다.
# 경로(node, repo, USERPROFILE)를 자동 감지한다. PowerShell에서 실행:
#   powershell -ExecutionPolicy Bypass -File .claude\scripts\install-codex-logger.ps1
# 해제:
#   Unregister-ScheduledTask -TaskName "todam-codex-logger" -Confirm:$false

$ErrorActionPreference = "Stop"
$TaskName  = "todam-codex-logger"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path           # .claude\scripts
$Logger    = Join-Path $ScriptDir "logger-codex.mjs"
$EnvFile   = Join-Path (Split-Path -Parent $ScriptDir) ".env"
$Node      = (Get-Command node -ErrorAction SilentlyContinue).Source

if (-not $Node)            { Write-Error "node 없음 — Node.js 먼저 설치"; exit 1 }
if (-not (Test-Path $Logger)) { Write-Error "$Logger 없음 — repo 최신 pull 필요"; exit 1 }

$Sessions = Join-Path $env:USERPROFILE ".codex\sessions"
if (-not (Test-Path $Sessions)) { Write-Warning "$Sessions 없음 — Codex Desktop 안 쓰면 등록 의미 없음" }

if (-not (Test-Path $EnvFile)) {
    Write-Error "$EnvFile 없음 — .env.example 복사 후 SUPABASE_URL / SUPABASE_ANON_KEY 채우기"
    exit 1
}
# USER_NAME 없으면 git 이름으로 추가 (스케줄러 환경엔 git PATH 없을 수 있어 .env에 고정)
if (-not (Select-String -Path $EnvFile -Pattern '^USER_NAME=' -Quiet)) {
    $gn = (git config user.name) 2>$null
    if (-not $gn) { $gn = $env:USERNAME }
    Add-Content -Path $EnvFile -Value "`nUSER_NAME=$gn"
    Write-Host "-> .env에 USER_NAME=$gn 추가"
}

# 1분마다 무기한 반복 (Windows 스케줄러 최소 간격 1분)
$action  = New-ScheduledTaskAction -Execute $Node -Argument "`"$Logger`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date)
$trigger.RepetitionInterval = (New-TimeSpan -Minutes 1)
$trigger.RepetitionDuration  = ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Write-Host "OK 등록 완료 — 1분마다 Codex 세션 수집 (node=$Node)"
Write-Host "  확인: Get-ScheduledTask -TaskName $TaskName"
Write-Host "  해제: Unregister-ScheduledTask -TaskName $TaskName -Confirm:`$false"
