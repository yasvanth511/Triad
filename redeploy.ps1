$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptPath = Join-Path $rootDir "scripts/run/quick-build-deploy.sh"

if ($args.Count -eq 0) {
  & $scriptPath --backend --admin --web --business --ios
  exit $LASTEXITCODE
}

& $scriptPath @args
exit $LASTEXITCODE
