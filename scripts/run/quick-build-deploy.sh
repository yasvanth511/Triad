#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
RUN_BACKEND=0
RUN_SITE=0
RUN_ADMIN=0
RUN_WEB=0
RUN_BUSINESS=0
RUN_IOS=0
RUN_ANDROID=0
EXPLICIT_SELECTION=0

usage() {
  cat <<'EOF'
Usage: ./scripts/run/quick-build-deploy.sh [--backend] [--site] [--admin|--ui] [--web] [--business] [--ios] [--android] [--all] [--help]
EOF
}

log_layer() {
  printf '\n==> %s\n' "$1"
}

run_backend() {
  log_layer "triad-backend"
  "$ROOT_DIR/scripts/docker.sh" up triad-backend
}

run_site() {
  log_layer "triad-marketing"
  "$ROOT_DIR/scripts/docker.sh" up triad-marketing
}

run_admin() {
  log_layer "triad-admin"
  "$ROOT_DIR/scripts/docker.sh" up triad-admin
}

run_web() {
  log_layer "triad-web"
  "$ROOT_DIR/scripts/docker.sh" up triad-web
}

run_business() {
  log_layer "triad-business"
  "$ROOT_DIR/scripts/docker.sh" up triad-business
}

run_ios() {
  log_layer "ios"
  if [[ "$RUN_BACKEND" == "1" ]]; then
    SKIP_API_DEPLOY=1 "$ROOT_DIR/scripts/mobile/run-ios.sh"
  else
    "$ROOT_DIR/scripts/mobile/run-ios.sh"
  fi
}

run_android() {
  log_layer "android"
  if [[ "$RUN_BACKEND" == "1" ]]; then
    SKIP_API_DEPLOY=1 "$ROOT_DIR/scripts/mobile/run-android.sh"
  else
    "$ROOT_DIR/scripts/mobile/run-android.sh"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend)
      RUN_BACKEND=1
      EXPLICIT_SELECTION=1
      ;;
    --site)
      RUN_SITE=1
      EXPLICIT_SELECTION=1
      ;;
    --ui)
      RUN_ADMIN=1
      EXPLICIT_SELECTION=1
      ;;
    --admin)
      RUN_ADMIN=1
      EXPLICIT_SELECTION=1
      ;;
    --web)
      RUN_WEB=1
      EXPLICIT_SELECTION=1
      ;;
    --business)
      RUN_BUSINESS=1
      EXPLICIT_SELECTION=1
      ;;
    --ios)
      RUN_IOS=1
      EXPLICIT_SELECTION=1
      ;;
    --android)
      RUN_ANDROID=1
      EXPLICIT_SELECTION=1
      ;;
    --all)
      RUN_BACKEND=1
      RUN_SITE=1
      RUN_ADMIN=1
      RUN_WEB=1
      RUN_BUSINESS=1
      RUN_IOS=1
      RUN_ANDROID=1
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
  RUN_SITE=1
  RUN_ADMIN=1
  RUN_WEB=1
  RUN_BUSINESS=1
  RUN_IOS=1
  RUN_ANDROID=1
fi

if [[ "$RUN_BACKEND" == "1" ]]; then
  run_backend
fi

if [[ "$RUN_SITE" == "1" ]]; then
  run_site
fi

if [[ "$RUN_ADMIN" == "1" ]]; then
  run_admin
fi

if [[ "$RUN_WEB" == "1" ]]; then
  run_web
fi

if [[ "$RUN_BUSINESS" == "1" ]]; then
  run_business
fi

if [[ "$RUN_IOS" == "1" ]]; then
  run_ios
fi

if [[ "$RUN_ANDROID" == "1" ]]; then
  run_android
fi
