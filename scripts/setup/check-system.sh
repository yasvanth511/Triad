#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"

check_tool() {
  local tool="$1"
  if command -v "$tool" >/dev/null 2>&1; then
    printf '[ok] %s\n' "$tool"
  else
    printf '[missing] %s\n' "$tool"
  fi
}

printf 'Repo: %s\n' "$ROOT_DIR"
check_tool curl
check_tool docker
check_tool node
check_tool npm
check_tool open
check_tool xcodebuild
check_tool xcrun
check_tool dotnet

if [[ -f "$ROOT_DIR/.env.docker" ]]; then
  printf '[ok] .env.docker\n'
else
  printf '[missing] .env.docker (copy from .env.docker.example)\n'
fi
