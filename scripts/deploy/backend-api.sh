#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/deploy.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
APP_DIR="$ROOT_DIR/backend/ThirdWheel.API"
IMAGE_REPO="${BACKEND_IMAGE_REPO:-}"
IMAGE_TAG="${BACKEND_IMAGE_TAG:-$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
LATEST_TAG="${BACKEND_IMAGE_LATEST_TAG:-latest}"
PLATFORM="${BACKEND_DOCKER_PLATFORM:-linux/amd64}"
PUSH_IMAGE=1
RUN_RELEASE_HOOK=1

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy/backend-api.sh [--skip-push] [--skip-release] [--tag <value>]

Environment:
  BACKEND_IMAGE_REPO        Required OCI repository, for example ghcr.io/acme/triad-api
  BACKEND_IMAGE_TAG         Optional image tag override
  BACKEND_IMAGE_LATEST_TAG  Optional mutable tag, defaults to latest
  BACKEND_DOCKER_PLATFORM   Optional target platform, defaults to linux/amd64
  BACKEND_RELEASE_COMMAND   Optional shell command run after the image is pushed

The release command receives:
  TRIAD_BACKEND_IMAGE
  TRIAD_BACKEND_IMAGE_TAG
  TRIAD_BACKEND_IMAGE_LATEST
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

[[ -n "$IMAGE_REPO" ]] || fail "Set BACKEND_IMAGE_REPO before deploying the backend API."

require_command docker

image_ref="$IMAGE_REPO:$IMAGE_TAG"
latest_ref="$IMAGE_REPO:$LATEST_TAG"

log_step "building backend image $image_ref"

if docker buildx version >/dev/null 2>&1; then
  buildx_args=(
    build
    --platform "$PLATFORM"
    --file "$APP_DIR/Dockerfile"
    --tag "$image_ref"
    --tag "$latest_ref"
  )

  if [[ "$PUSH_IMAGE" == "1" ]]; then
    buildx_args+=(--push)
  fi

  buildx_args+=("$APP_DIR")
  docker buildx "${buildx_args[@]}"
else
  docker build --file "$APP_DIR/Dockerfile" --tag "$image_ref" --tag "$latest_ref" "$APP_DIR"

  if [[ "$PUSH_IMAGE" == "1" ]]; then
    log_step "pushing backend image tags"
    docker push "$image_ref"
    docker push "$latest_ref"
  fi
fi

if [[ "$RUN_RELEASE_HOOK" != "1" ]]; then
  exit 0
fi

if [[ -z "${BACKEND_RELEASE_COMMAND:-}" ]]; then
  log_step "backend image built"
  printf 'No BACKEND_RELEASE_COMMAND provided; image is ready at %s\n' "$image_ref"
  exit 0
fi

log_step "running backend release hook"
TRIAD_BACKEND_IMAGE="$image_ref" \
TRIAD_BACKEND_IMAGE_TAG="$IMAGE_TAG" \
TRIAD_BACKEND_IMAGE_LATEST="$latest_ref" \
  bash -lc "$BACKEND_RELEASE_COMMAND"
