#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/deploy.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
RUN_BACKEND=0
RUN_SITE=0
RUN_WEB=0
RUN_ADMIN=0
RUN_BUSINESS=0
RUN_ANDROID=0
EXPLICIT_SELECTION=0
DEPLOY_ENVIRONMENT="production"

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy/deploy.sh [--backend] [--site] [--web] [--admin] [--business] [--android] [--all] [--preview|--prod]

Default behavior (no flags): deploy backend API, marketing site, web app, admin
app, and business app to production. Android is opt-in via --android or --all
because release builds typically need a signing keystore configured (see
scripts/deploy/android-app.sh).
EOF
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
    --web)
      RUN_WEB=1
      EXPLICIT_SELECTION=1
      ;;
    --admin)
      RUN_ADMIN=1
      EXPLICIT_SELECTION=1
      ;;
    --business)
      RUN_BUSINESS=1
      EXPLICIT_SELECTION=1
      ;;
    --android)
      RUN_ANDROID=1
      EXPLICIT_SELECTION=1
      ;;
    --all)
      RUN_BACKEND=1
      RUN_SITE=1
      RUN_WEB=1
      RUN_ADMIN=1
      RUN_BUSINESS=1
      RUN_ANDROID=1
      EXPLICIT_SELECTION=1
      ;;
    --preview)
      DEPLOY_ENVIRONMENT="preview"
      ;;
    --prod)
      DEPLOY_ENVIRONMENT="production"
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
  if [[ "$DEPLOY_ENVIRONMENT" == "preview" ]]; then
    RUN_SITE=1
    RUN_WEB=1
    RUN_ADMIN=1
    RUN_BUSINESS=1
  else
    RUN_BACKEND=1
    RUN_SITE=1
    RUN_WEB=1
    RUN_ADMIN=1
    RUN_BUSINESS=1
  fi
fi

if [[ "$RUN_BACKEND" == "1" ]]; then
  "$ROOT_DIR/scripts/deploy/backend-api.sh"
fi

if [[ "$RUN_SITE" == "1" ]]; then
  "$ROOT_DIR/scripts/deploy/site-app.sh"
fi

if [[ "$RUN_WEB" == "1" ]]; then
  if [[ "$DEPLOY_ENVIRONMENT" == "production" ]]; then
    "$ROOT_DIR/scripts/deploy/web-app.sh" --prod
  else
    "$ROOT_DIR/scripts/deploy/web-app.sh" --preview
  fi
fi

if [[ "$RUN_ADMIN" == "1" ]]; then
  if [[ "$DEPLOY_ENVIRONMENT" == "production" ]]; then
    "$ROOT_DIR/scripts/deploy/admin-app.sh" --prod
  else
    "$ROOT_DIR/scripts/deploy/admin-app.sh" --preview
  fi
fi

if [[ "$RUN_BUSINESS" == "1" ]]; then
  if [[ "$DEPLOY_ENVIRONMENT" == "production" ]]; then
    "$ROOT_DIR/scripts/deploy/business-app.sh" --prod
  else
    "$ROOT_DIR/scripts/deploy/business-app.sh" --preview
  fi
fi

if [[ "$RUN_ANDROID" == "1" ]]; then
  if [[ "$DEPLOY_ENVIRONMENT" == "production" ]]; then
    "$ROOT_DIR/scripts/deploy/android-app.sh" --release
  else
    "$ROOT_DIR/scripts/deploy/android-app.sh" --debug
  fi
fi
