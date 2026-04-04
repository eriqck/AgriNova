$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot ".local-dev"
$backendLog = Join-Path $runtimeDir "backend.log"
$backendErrLog = Join-Path $runtimeDir "backend.err.log"
$frontendLog = Join-Path $runtimeDir "frontend.log"
$frontendErrLog = Join-Path $runtimeDir "frontend.err.log"
$backendPidFile = Join-Path $runtimeDir "backend.pid"
$frontendPidFile = Join-Path $runtimeDir "frontend.pid"

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

function Stop-TrackedProcess {
  param(
    [string]$PidFile
  )

  if (-not (Test-Path $PidFile)) {
    return
  }

  $pidValue = Get-Content $PidFile -ErrorAction SilentlyContinue

  if ($pidValue -and $pidValue -match "^\d+$") {
    try {
      Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
    } catch {
    }
  }

  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

function Stop-ProcessesOnPort {
  param(
    [int]$Port
  )

  $matches = netstat -ano | Select-String ":$Port"

  foreach ($match in $matches) {
    $segments = ($match -split "\s+") | Where-Object { $_ }
    $pidValue = $segments[-1]

    if ($pidValue -match "^\d+$") {
      try {
        Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
      } catch {
      }
    }
  }
}

function Remove-OldLogs {
  param(
    [string[]]$Paths
  )

  foreach ($path in $Paths) {
    if (Test-Path $path) {
      Remove-Item $path -Force -ErrorAction SilentlyContinue
    }
  }
}

function Wait-ForUrl {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
    }

    Start-Sleep -Milliseconds 800
  }

  return $false
}

Stop-TrackedProcess -PidFile $backendPidFile
Stop-TrackedProcess -PidFile $frontendPidFile
Stop-ProcessesOnPort -Port 4000
Stop-ProcessesOnPort -Port 3000

Remove-OldLogs -Paths @($backendLog, $backendErrLog, $frontendLog, $frontendErrLog)

$backendProcess = Start-Process `
  -FilePath "npm.cmd" `
  -ArgumentList "run", "dev" `
  -WorkingDirectory $repoRoot `
  -RedirectStandardOutput $backendLog `
  -RedirectStandardError $backendErrLog `
  -PassThru

Set-Content -Path $backendPidFile -Value $backendProcess.Id

$frontendProcess = Start-Process `
  -FilePath "npm.cmd" `
  -ArgumentList "run", "start" `
  -WorkingDirectory (Join-Path $repoRoot "web") `
  -RedirectStandardOutput $frontendLog `
  -RedirectStandardError $frontendErrLog `
  -PassThru

Set-Content -Path $frontendPidFile -Value $frontendProcess.Id

$backendReady = Wait-ForUrl -Url "http://localhost:4000/api/v1/health" -TimeoutSeconds 30
$frontendReady = Wait-ForUrl -Url "http://localhost:3000" -TimeoutSeconds 40

Write-Host ""
Write-Host "Local services started"
Write-Host "Backend PID : $($backendProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"
Write-Host "Backend URL : http://localhost:4000/api/v1/health"
Write-Host "Frontend URL: http://localhost:3000"
Write-Host "Logs       : $runtimeDir"
Write-Host ""

if (-not $backendReady) {
  Write-Warning "Backend did not answer in time. Check $backendLog and $backendErrLog"
}

if (-not $frontendReady) {
  Write-Warning "Frontend did not answer in time. Check $frontendLog and $frontendErrLog"
}
