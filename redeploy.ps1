[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Target = "all",
    [switch]$NoCache,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

$validTargets = @("backend", "site", "admin", "web", "business", "ios", "all")
$Target = $Target.ToLower()

if ($validTargets -notcontains $Target) {
    Write-Host "Invalid target: $Target" -ForegroundColor Red
    Write-Host "Valid targets: $($validTargets -join ', ')"
    Write-Host "Flags: -NoCache (force fresh image build), -Clean (wipe local .next before build)"
    exit 1
}

function Assert-DockerRunning {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker is not running. Start Docker Desktop and try again." -ForegroundColor Red
        exit 1
    }
}

function Clear-NextBuildCache {
    param([string]$ServiceName)

    $nextDir = switch ($ServiceName) {
        "triad-web"       { "web/triad-web/.next" }
        "triad-business"  { "web/triad-business/.next" }
        "triad-marketing" { "web/triad-site/.next" }
        default           { $null }
    }

    if ($nextDir -and (Test-Path $nextDir)) {
        Write-Host "Removing stale build artifacts: $nextDir" -ForegroundColor DarkGray
        Remove-Item -Recurse -Force $nextDir
    }
}

function Invoke-ServiceDeploy {
    param(
        [string]$ServiceName
    )

    Write-Host "Redeploying $ServiceName..." -ForegroundColor Cyan

    if ($Clean) {
        Clear-NextBuildCache -ServiceName $ServiceName
    }

    if ($NoCache) {
        Write-Host "Building $ServiceName with --no-cache..." -ForegroundColor DarkCyan
        docker compose build --no-cache $ServiceName
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to build $ServiceName" -ForegroundColor Red
            exit $LASTEXITCODE
        }

        docker compose up -d --force-recreate --remove-orphans $ServiceName
    }
    else {
        docker compose up -d --build --force-recreate --remove-orphans $ServiceName
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to redeploy $ServiceName" -ForegroundColor Red
        exit $LASTEXITCODE
    }

    Write-Host "$ServiceName redeployed successfully." -ForegroundColor Green
}

Assert-DockerRunning

switch ($Target) {
    "business" {
        Invoke-ServiceDeploy "triad-business"
    }
    "web" {
        Invoke-ServiceDeploy "triad-web"
    }
    "admin" {
        Invoke-ServiceDeploy "triad-admin"
    }
    "site" {
        Invoke-ServiceDeploy "triad-marketing"
    }
    "backend" {
        Invoke-ServiceDeploy "triad-backend"
    }
    "ios" {
        Write-Host "iOS cannot be redeployed through Docker on Windows PowerShell." -ForegroundColor Yellow
    }
    "all" {
        Invoke-ServiceDeploy "triad-backend"
        Invoke-ServiceDeploy "triad-marketing"
        Invoke-ServiceDeploy "triad-admin"
        Invoke-ServiceDeploy "triad-web"
        Invoke-ServiceDeploy "triad-business"
    }
}
