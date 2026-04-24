#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/deploy.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
APP_DIR="$ROOT_DIR/web/triad-business"
DEPLOY_ENVIRONMENT="production"

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy/business-app.sh [--preview|--prod]

Environment:
  BUSINESS_PUBLIC_API_ORIGIN Browser-visible backend origin for the business app
  NEXT_PUBLIC_API_ORIGIN     Fallback backend origin if BUSINESS_PUBLIC_API_ORIGIN is unset
  BACKEND_PUBLIC_ORIGIN      Fallback backend origin if app-specific vars are unset
  TRIAD_BUSINESS_VERCEL_PROJECT Vercel project name or id used when the app is not linked yet
  TRIAD_VERCEL_SCOPE         Optional Vercel team/account scope for linking
  VERCEL_TOKEN               Optional token for non-interactive auth
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

api_origin="$(resolve_origin_var BUSINESS_PUBLIC_API_ORIGIN NEXT_PUBLIC_API_ORIGIN)"
if [[ -z "$api_origin" ]]; then
  api_origin="$(resolve_origin_var BACKEND_PUBLIC_ORIGIN BACKEND_PUBLIC_ORIGIN)"
fi
[[ -n "$api_origin" ]] || fail "Set BUSINESS_PUBLIC_API_ORIGIN, NEXT_PUBLIC_API_ORIGIN, or BACKEND_PUBLIC_ORIGIN before deploying the business app."

ensure_vercel_project_link "$APP_DIR" TRIAD_BUSINESS_VERCEL_PROJECT

log_step "deploying Triad business portal to Vercel ($DEPLOY_ENVIRONMENT)"

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
