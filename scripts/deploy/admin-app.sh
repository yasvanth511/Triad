#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/deploy.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
APP_DIR="$ROOT_DIR/admin/nextjs-admin"
DEPLOY_ENVIRONMENT="production"
TEMP_CONFIG=""
BACKUP_CONFIG=""

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy/admin-app.sh [--preview|--prod]

Environment:
  ADMIN_API_ORIGIN        Backend origin used for /api/* rewrites
  BACKEND_PUBLIC_ORIGIN   Fallback backend origin if ADMIN_API_ORIGIN is unset
  TRIAD_ADMIN_VERCEL_PROJECT  Vercel project name or id used when the app is not linked yet
  TRIAD_VERCEL_SCOPE      Optional Vercel team/account scope for linking
  VERCEL_TOKEN            Optional token for non-interactive auth
EOF
}

cleanup() {
  if [[ -n "$BACKUP_CONFIG" && -f "$BACKUP_CONFIG" ]]; then
    mv "$BACKUP_CONFIG" "$APP_DIR/vercel.json"
    return
  fi

  if [[ -n "$TEMP_CONFIG" && -f "$TEMP_CONFIG" ]]; then
    rm -f "$TEMP_CONFIG"
  fi
}

trap cleanup EXIT

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

api_origin="$(resolve_origin_var ADMIN_API_ORIGIN BACKEND_PUBLIC_ORIGIN)"
[[ -n "$api_origin" ]] || fail "Set ADMIN_API_ORIGIN or BACKEND_PUBLIC_ORIGIN before deploying the admin app."

ensure_vercel_project_link "$APP_DIR" TRIAD_ADMIN_VERCEL_PROJECT

if [[ -f "$APP_DIR/vercel.json" ]]; then
  BACKUP_CONFIG="$(mktemp)"
  cp "$APP_DIR/vercel.json" "$BACKUP_CONFIG"
fi

TEMP_CONFIG="$APP_DIR/vercel.json"
cat > "$TEMP_CONFIG" <<EOF
{
  "\$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "$api_origin/api/:path*"
    }
  ]
}
EOF

log_step "deploying Triad admin to Vercel ($DEPLOY_ENVIRONMENT)"

(
  cd "$APP_DIR"
  vercel_run pull --yes --environment="$DEPLOY_ENVIRONMENT"

  if [[ "$DEPLOY_ENVIRONMENT" == "production" ]]; then
    vercel_run deploy --prod --yes
  else
    vercel_run deploy --yes
  fi
)
