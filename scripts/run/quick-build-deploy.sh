#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
RUN_BACKEND=0
RUN_UI=0
RUN_IOS=0
EXPLICIT_SELECTION=0

usage() {
  cat <<'EOF'
Usage: ./scripts/run/quick-build-deploy.sh [--backend] [--ui] [--ios] [--all] [--help]
EOF
}

log_layer() {
  printf '\n==> %s\n' "$1"
}

run_backend() {
  log_layer "backend"
  "$ROOT_DIR/scripts/docker.sh" up
}

run_ui() {
  log_layer "ui"
  "$ROOT_DIR/scripts/docker.sh" up admin
}

run_ios() {
  log_layer "ios"
  if [[ "$RUN_BACKEND" == "1" ]]; then
    SKIP_API_DEPLOY=1 "$ROOT_DIR/scripts/mobile/run-ios.sh"
  else
    "$ROOT_DIR/scripts/mobile/run-ios.sh"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend)
      RUN_BACKEND=1
      EXPLICIT_SELECTION=1
      ;;
    --ui)
      RUN_UI=1
      EXPLICIT_SELECTION=1
      ;;
    --ios)
      RUN_IOS=1
      EXPLICIT_SELECTION=1
      ;;
    --all)
      RUN_BACKEND=1
      RUN_UI=1
      RUN_IOS=1
      EXPLICIT_SELECTION=1
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

if [[ "$EXPLICIT_SELECTION" == "0" ]]; then
  RUN_BACKEND=1
  RUN_UI=1
  RUN_IOS=1
fi

if [[ "$RUN_BACKEND" == "1" ]]; then
  run_backend
fi

if [[ "$RUN_UI" == "1" ]]; then
  run_ui
fi

if [[ "$RUN_IOS" == "1" ]]; then
  run_ios
fi
