#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/deploy.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
APP_DIR="$ROOT_DIR/web/triad-web"
DEPLOY_ENVIRONMENT="production"

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy/web-app.sh [--preview|--prod]

Environment:
  NEXT_PUBLIC_API_ORIGIN  Browser-visible backend origin for the web app
  BACKEND_PUBLIC_ORIGIN   Fallback backend origin if NEXT_PUBLIC_API_ORIGIN is unset
  TRIAD_WEB_VERCEL_PROJECT  Vercel project name or id used when the app is not linked yet
  TRIAD_VERCEL_SCOPE      Optional Vercel team/account scope for linking
  VERCEL_TOKEN            Optional token for non-interactive auth
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
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

api_origin="$(resolve_origin_var NEXT_PUBLIC_API_ORIGIN BACKEND_PUBLIC_ORIGIN)"
[[ -n "$api_origin" ]] || fail "Set NEXT_PUBLIC_API_ORIGIN or BACKEND_PUBLIC_ORIGIN before deploying the web app."

ensure_vercel_project_link "$APP_DIR" TRIAD_WEB_VERCEL_PROJECT

log_step "deploying Triad web to Vercel ($DEPLOY_ENVIRONMENT)"

(
  cd "$APP_DIR"
  vercel_run pull --yes --environment="$DEPLOY_ENVIRONMENT"

  if [[ "$DEPLOY_ENVIRONMENT" == "production" ]]; then
    vercel_run deploy --prod --yes \
      --build-env "NEXT_PUBLIC_API_ORIGIN=$api_origin" \
      --env "NEXT_PUBLIC_API_ORIGIN=$api_origin"
  else
    vercel_run deploy --yes \
      --build-env "NEXT_PUBLIC_API_ORIGIN=$api_origin" \
      --env "NEXT_PUBLIC_API_ORIGIN=$api_origin"
  fi
)
