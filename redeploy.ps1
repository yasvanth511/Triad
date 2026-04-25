$ErrorActionPreference = "Stop"

$target = if ($args.Count -gt 0) { $args[0].ToLower() } else { "all" }

$validTargets = @("backend", "site", "admin", "web", "business", "ios", "all")

if ($validTargets -notcontains $target) {
    Write-Host "Invalid target: $target" -ForegroundColor Red
    Write-Host "Valid targets: $($validTargets -join ', ')"
    exit 1
}

function Assert-DockerRunning {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker is not running. Start Docker Desktop and try again." -ForegroundColor Red
        exit 1
    }
}

function Invoke-ServiceDeploy {
    param(
        [string]$ServiceName
    )

    Write-Host "Redeploying $ServiceName..." -ForegroundColor Cyan

    docker compose up -d --build --remove-orphans $ServiceName

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to redeploy $ServiceName" -ForegroundColor Red
        exit $LASTEXITCODE
    }

    Write-Host "$ServiceName redeployed successfully." -ForegroundColor Green
}

Assert-DockerRunning

switch ($target) {
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