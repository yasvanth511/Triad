#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/deploy.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
APP_DIR="$ROOT_DIR/web/triad-site"
IMAGE_REPO="${SITE_IMAGE_REPO:-}"
IMAGE_TAG="${SITE_IMAGE_TAG:-$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
LATEST_TAG="${SITE_IMAGE_LATEST_TAG:-latest}"
PLATFORM="${SITE_DOCKER_PLATFORM:-linux/amd64}"
PUSH_IMAGE=1
RUN_RELEASE_HOOK=1

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy/site-app.sh [--skip-push] [--skip-release] [--tag <value>]

Environment:
  SITE_IMAGE_REPO                         Required OCI repository, for example ghcr.io/acme/triad-site
  SITE_IMAGE_TAG                          Optional image tag override
  SITE_IMAGE_LATEST_TAG                   Optional mutable tag, defaults to latest
  SITE_DOCKER_PLATFORM                    Optional target platform, defaults to linux/amd64
  SITE_PUBLIC_TRIAD_WEB_APP_URL           Browser-visible Triad web app URL
  SITE_PUBLIC_TRIAD_BUSINESS_APP_URL      Browser-visible business portal URL
  SITE_PUBLIC_APP_STORE_URL               Optional App Store URL
  SITE_PUBLIC_GOOGLE_PLAY_URL             Optional Google Play URL
  SITE_PUBLIC_CONTACT_EMAIL               Optional contact email
  SITE_RELEASE_COMMAND                    Optional shell command run after the image is pushed

The release command receives:
  TRIAD_SITE_IMAGE
  TRIAD_SITE_IMAGE_TAG
  TRIAD_SITE_IMAGE_LATEST
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-push)
      PUSH_IMAGE=0
      ;;
    --skip-release)
      RUN_RELEASE_HOOK=0
      ;;
    --tag)
      shift
      [[ $# -gt 0 ]] || fail "--tag requires a value."
      IMAGE_TAG="$1"
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

[[ -n "$IMAGE_REPO" ]] || fail "Set SITE_IMAGE_REPO before deploying the marketing site."

require_command docker

image_ref="$IMAGE_REPO:$IMAGE_TAG"
latest_ref="$IMAGE_REPO:$LATEST_TAG"

build_args=(
  --build-arg "NEXT_PUBLIC_TRIAD_WEB_APP_URL=${SITE_PUBLIC_TRIAD_WEB_APP_URL:-http://localhost:3000}"
  --build-arg "NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL=${SITE_PUBLIC_TRIAD_BUSINESS_APP_URL:-http://localhost:3002}"
  --build-arg "NEXT_PUBLIC_APP_STORE_URL=${SITE_PUBLIC_APP_STORE_URL:-}"
  --build-arg "NEXT_PUBLIC_GOOGLE_PLAY_URL=${SITE_PUBLIC_GOOGLE_PLAY_URL:-}"
  --build-arg "NEXT_PUBLIC_CONTACT_EMAIL=${SITE_PUBLIC_CONTACT_EMAIL:-hello@triad.app}"
)

log_step "building marketing site image $image_ref"

if docker buildx version >/dev/null 2>&1; then
  buildx_args=(
    build
    --platform "$PLATFORM"
    --file "$APP_DIR/Dockerfile"
    --tag "$image_ref"
    --tag "$latest_ref"
    "${build_args[@]}"
  )

  if [[ "$PUSH_IMAGE" == "1" ]]; then
    buildx_args+=(--push)
  fi

  buildx_args+=("$APP_DIR")
  docker buildx "${buildx_args[@]}"
else
  docker build "${build_args[@]}" --file "$APP_DIR/Dockerfile" --tag "$image_ref" --tag "$latest_ref" "$APP_DIR"

  if [[ "$PUSH_IMAGE" == "1" ]]; then
    log_step "pushing marketing site image tags"
    docker push "$image_ref"
    docker push "$latest_ref"
  fi
fi

if [[ "$RUN_RELEASE_HOOK" != "1" ]]; then
  exit 0
fi

if [[ -z "${SITE_RELEASE_COMMAND:-}" ]]; then
  log_step "marketing site image built"
  printf 'No SITE_RELEASE_COMMAND provided; image is ready at %s\n' "$image_ref"
  exit 0
fi

log_step "running marketing site release hook"
TRIAD_SITE_IMAGE="$image_ref" \
TRIAD_SITE_IMAGE_TAG="$IMAGE_TAG" \
TRIAD_SITE_IMAGE_LATEST="$latest_ref" \
  bash -lc "$SITE_RELEASE_COMMAND"
