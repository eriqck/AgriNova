$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot ".local-dev"
$backendPidFile = Join-Path $runtimeDir "backend.pid"
$frontendPidFile = Join-Path $runtimeDir "frontend.pid"

function Stop-TrackedProcess {
  param(
    [string]$PidFile,
    [string]$Name
  )

  if (-not (Test-Path $PidFile)) {
    Write-Host "$Name is not tracked."
    return
  }

  $pidValue = Get-Content $PidFile -ErrorAction SilentlyContinue

  if ($pidValue -and $pidValue -match "^\d+$") {
    try {
      Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
      Write-Host "$Name stopped (PID $pidValue)."
    } catch {
      Write-Host "$Name was already stopped."
    }
  }

  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

Stop-TrackedProcess -PidFile $backendPidFile -Name "Backend"
Stop-TrackedProcess -PidFile $frontendPidFile -Name "Frontend"
