#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
MODE="${1:-all}"
SDK_IMAGE="mcr.microsoft.com/dotnet/sdk:10.0"

dotnet_runner() {
  if command -v dotnet >/dev/null 2>&1; then
    dotnet "$@"
  elif command -v docker >/dev/null 2>&1; then
    docker run --rm \
      -v "$ROOT_DIR:/workspace" \
      -w /workspace \
      -e DOTNET_CLI_HOME=/tmp \
      -e NUGET_PACKAGES=/tmp/nuget \
      "$SDK_IMAGE" \
      dotnet "$@"
  else
    echo "Neither dotnet nor docker is available." >&2
    exit 1
  fi
}

run_project() {
  local project="$1"
  dotnet_runner test "$project" --nologo --verbosity minimal
}

case "$MODE" in
  unit)
    run_project "tests/ThirdWheel.API.UnitTests/ThirdWheel.API.UnitTests.csproj"
    ;;
  integration)
    run_project "tests/ThirdWheel.API.IntegrationTests/ThirdWheel.API.IntegrationTests.csproj"
    ;;
  all)
    run_project "tests/ThirdWheel.API.UnitTests/ThirdWheel.API.UnitTests.csproj"
    run_project "tests/ThirdWheel.API.IntegrationTests/ThirdWheel.API.IntegrationTests.csproj"
    ;;
  *)
    echo "Usage: ./scripts/run/test-backend.sh [unit|integration|all]" >&2
    exit 1
    ;;
esac
