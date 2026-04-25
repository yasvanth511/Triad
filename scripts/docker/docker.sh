#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
COMMAND="${1:-help}"
SERVICE="${2:-${DOCKER_SERVICE:-triad-backend}}"
PROJECT_NAME="${DOCKER_PROJECT_NAME:-triad}"
ENV_FILE="${DOCKER_ENV_FILE:-$ROOT_DIR/.env.docker}"
UPLOADS_VOLUME="${DOCKER_UPLOADS_VOLUME:-triad_api_uploads}"
IMAGE_NAME=""
IMAGE_TAG=""
IMAGE_REF=""
CONTAINER_NAME=""
BUILD_CONTEXT=""
DOCKERFILE_PATH=""
HOST_PORT=""
CONTAINER_PORT=""
REQUIRES_ENV_FILE=0
BUILD_ARGS=()
RUN_ARGS=()
COMPOSE_FILE=""

usage() {
  cat <<'EOF'
Usage: ./scripts/docker/docker.sh <command> [service]

Commands:
  build    Build the image
  run      Run the main service with docker run
  up       Start the compose service(s)
  stop     Stop compose or direct-run containers
  down     Stop the compose stack
  clean    Remove compose or direct-run containers
  logs     Tail logs
  restart  Restart compose or direct-run containers
  rebuild  Rebuild and restart
  deploy   Build and start detached for reuse in dev/staging
  help     Show this message

Services:
  triad-backend   ASP.NET Core backend
  triad-admin     Internal admin dashboard
  triad-web       Consumer Next.js web app
  triad-business  Business partner Next.js portal
  triad-marketing Public marketing website

Key env vars:
  DOCKER_ENV_FILE, DOCKER_IMAGE_NAME, DOCKER_IMAGE_TAG
  DOCKER_CONTAINER_NAME, DOCKER_PROJECT_NAME, DOCKER_SERVICE
  DOCKER_BUILD_CONTEXT, DOCKERFILE_PATH, API_PORT, ADMIN_PORT, WEB_PORT, BUSINESS_PORT, SITE_PORT
  DOCKER_NO_CACHE=1   Force a no-cache image build for up/rebuild/deploy
EOF
}

log() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

require_tool() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required tool: $1"
}

detect_compose_file() {
  local candidate
  for candidate in \
    "$ROOT_DIR/docker-compose.yml" \
    "$ROOT_DIR/docker-compose.yaml" \
    "$ROOT_DIR/compose.yml" \
    "$ROOT_DIR/compose.yaml"
  do
    if [[ -f "$candidate" ]]; then
      COMPOSE_FILE="$candidate"
      return 0
    fi
  done
}

ensure_env_file() {
  [[ -f "$ENV_FILE" ]] || fail "missing env file: $ENV_FILE (start from .env.docker.example)"
}

configure_service() {
  case "$SERVICE" in
    triad-backend|backend)
      SERVICE="triad-backend"
      IMAGE_NAME="${DOCKER_IMAGE_NAME:-triad-backend}"
      IMAGE_TAG="${DOCKER_IMAGE_TAG:-dev}"
      CONTAINER_NAME="${DOCKER_CONTAINER_NAME:-triad-backend}"
      BUILD_CONTEXT="${DOCKER_BUILD_CONTEXT:-$ROOT_DIR/backend/ThirdWheel.API}"
      DOCKERFILE_PATH="${DOCKERFILE_PATH:-$BUILD_CONTEXT/Dockerfile}"
      HOST_PORT="${API_PORT:-5127}"
      CONTAINER_PORT="${DOCKER_CONTAINER_PORT:-5000}"
      REQUIRES_ENV_FILE=1
      RUN_ARGS=(
        --env-file "$ENV_FILE"
        -v "${UPLOADS_VOLUME}:/app/uploads"
      )
      ;;
    triad-admin|admin)
      SERVICE="triad-admin"
      IMAGE_NAME="${ADMIN_IMAGE_NAME:-triad-admin}"
      IMAGE_TAG="${ADMIN_IMAGE_TAG:-dev}"
      CONTAINER_NAME="${ADMIN_CONTAINER_NAME:-triad-admin}"
      BUILD_CONTEXT="${DOCKER_BUILD_CONTEXT:-$ROOT_DIR/admin}"
      DOCKERFILE_PATH="${DOCKERFILE_PATH:-$BUILD_CONTEXT/Dockerfile}"
      HOST_PORT="${ADMIN_PORT:-5173}"
      CONTAINER_PORT="${DOCKER_CONTAINER_PORT:-80}"
      REQUIRES_ENV_FILE=0
      ;;
    triad-web|web)
      SERVICE="triad-web"
      IMAGE_NAME="${WEB_IMAGE_NAME:-triad-web}"
      IMAGE_TAG="${WEB_IMAGE_TAG:-dev}"
      CONTAINER_NAME="${WEB_CONTAINER_NAME:-triad-web}"
      BUILD_CONTEXT="${DOCKER_BUILD_CONTEXT:-$ROOT_DIR/web/triad-web}"
      DOCKERFILE_PATH="${DOCKERFILE_PATH:-$BUILD_CONTEXT/Dockerfile}"
      HOST_PORT="${WEB_PORT:-3000}"
      CONTAINER_PORT="${DOCKER_CONTAINER_PORT:-3000}"
      REQUIRES_ENV_FILE=0
      BUILD_ARGS=(
        --build-arg "NEXT_PUBLIC_API_ORIGIN=${WEB_PUBLIC_API_ORIGIN:-http://localhost:${API_PORT:-5127}}"
      )
      RUN_ARGS=(
        -e "NEXT_PUBLIC_API_ORIGIN=${WEB_PUBLIC_API_ORIGIN:-http://localhost:${API_PORT:-5127}}"
        -e "PORT=${CONTAINER_PORT}"
        -e "HOSTNAME=0.0.0.0"
      )
      ;;
    triad-business|business)
      SERVICE="triad-business"
      IMAGE_NAME="${BUSINESS_IMAGE_NAME:-triad-business}"
      IMAGE_TAG="${BUSINESS_IMAGE_TAG:-dev}"
      CONTAINER_NAME="${BUSINESS_CONTAINER_NAME:-triad-business}"
      BUILD_CONTEXT="${DOCKER_BUILD_CONTEXT:-$ROOT_DIR/web/triad-business}"
      DOCKERFILE_PATH="${DOCKERFILE_PATH:-$BUILD_CONTEXT/Dockerfile}"
      HOST_PORT="${BUSINESS_PORT:-3002}"
      CONTAINER_PORT="${DOCKER_CONTAINER_PORT:-3002}"
      REQUIRES_ENV_FILE=0
      BUILD_ARGS=(
        --build-arg "NEXT_PUBLIC_API_ORIGIN=${BUSINESS_PUBLIC_API_ORIGIN:-http://localhost:${API_PORT:-5127}}"
      )
      RUN_ARGS=(
        -e "NEXT_PUBLIC_API_ORIGIN=${BUSINESS_PUBLIC_API_ORIGIN:-http://localhost:${API_PORT:-5127}}"
        -e "PORT=${CONTAINER_PORT}"
        -e "HOSTNAME=0.0.0.0"
      )
      ;;
    triad-marketing|marketing|site)
      SERVICE="triad-marketing"
      IMAGE_NAME="${SITE_IMAGE_NAME:-triad-marketing}"
      IMAGE_TAG="${SITE_IMAGE_TAG:-dev}"
      CONTAINER_NAME="${SITE_CONTAINER_NAME:-triad-marketing}"
      BUILD_CONTEXT="${DOCKER_BUILD_CONTEXT:-$ROOT_DIR/web/triad-site}"
      DOCKERFILE_PATH="${DOCKERFILE_PATH:-$BUILD_CONTEXT/Dockerfile}"
      HOST_PORT="${SITE_PORT:-3003}"
      CONTAINER_PORT="${DOCKER_CONTAINER_PORT:-3003}"
      REQUIRES_ENV_FILE=0
      BUILD_ARGS=(
        --build-arg "NEXT_PUBLIC_TRIAD_WEB_APP_URL=${SITE_PUBLIC_TRIAD_WEB_APP_URL:-http://localhost:${WEB_PORT:-3000}}"
        --build-arg "NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL=${SITE_PUBLIC_TRIAD_BUSINESS_APP_URL:-http://localhost:${BUSINESS_PORT:-3002}}"
        --build-arg "NEXT_PUBLIC_APP_STORE_URL=${SITE_PUBLIC_APP_STORE_URL:-}"
        --build-arg "NEXT_PUBLIC_GOOGLE_PLAY_URL=${SITE_PUBLIC_GOOGLE_PLAY_URL:-}"
        --build-arg "NEXT_PUBLIC_CONTACT_EMAIL=${SITE_PUBLIC_CONTACT_EMAIL:-hello@triad.app}"
      )
      RUN_ARGS=(
        -e "NEXT_PUBLIC_TRIAD_WEB_APP_URL=${SITE_PUBLIC_TRIAD_WEB_APP_URL:-http://localhost:${WEB_PORT:-3000}}"
        -e "NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL=${SITE_PUBLIC_TRIAD_BUSINESS_APP_URL:-http://localhost:${BUSINESS_PORT:-3002}}"
        -e "NEXT_PUBLIC_APP_STORE_URL=${SITE_PUBLIC_APP_STORE_URL:-}"
        -e "NEXT_PUBLIC_GOOGLE_PLAY_URL=${SITE_PUBLIC_GOOGLE_PLAY_URL:-}"
        -e "NEXT_PUBLIC_CONTACT_EMAIL=${SITE_PUBLIC_CONTACT_EMAIL:-hello@triad.app}"
        -e "PORT=${CONTAINER_PORT}"
        -e "HOSTNAME=0.0.0.0"
      )
      ;;
    *)
      fail "unsupported service: $SERVICE (expected triad-backend, triad-admin, triad-web, triad-business, or triad-marketing)"
      ;;
  esac

  IMAGE_REF="${IMAGE_NAME}:${IMAGE_TAG}"
}

compose_cmd() {
  [[ -n "$COMPOSE_FILE" ]] || fail "no compose file found"
  docker compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" "$@"
}

compose_service_exists() {
  [[ -n "$COMPOSE_FILE" ]] || return 1
  compose_cmd ps -q "$SERVICE" 2>/dev/null | grep -q .
}

direct_container_exists() {
  docker ps -aq -f "name=^/${CONTAINER_NAME}$" | grep -q .
}

export_runtime_env() {
  export DOCKER_ENV_FILE="$ENV_FILE"
  export DOCKER_IMAGE_NAME="${DOCKER_IMAGE_NAME:-triad-backend}"
  export DOCKER_IMAGE_TAG="${DOCKER_IMAGE_TAG:-dev}"
  export ADMIN_IMAGE_NAME="${ADMIN_IMAGE_NAME:-triad-admin}"
  export ADMIN_IMAGE_TAG="${ADMIN_IMAGE_TAG:-dev}"
  export WEB_IMAGE_NAME="${WEB_IMAGE_NAME:-triad-web}"
  export WEB_IMAGE_TAG="${WEB_IMAGE_TAG:-dev}"
  export BUSINESS_IMAGE_NAME="${BUSINESS_IMAGE_NAME:-triad-business}"
  export BUSINESS_IMAGE_TAG="${BUSINESS_IMAGE_TAG:-dev}"
  export SITE_IMAGE_NAME="${SITE_IMAGE_NAME:-triad-marketing}"
  export SITE_IMAGE_TAG="${SITE_IMAGE_TAG:-dev}"
  export API_PORT="${API_PORT:-5127}"
  export ADMIN_PORT="${ADMIN_PORT:-5173}"
  export WEB_PORT="${WEB_PORT:-3000}"
  export BUSINESS_PORT="${BUSINESS_PORT:-3002}"
  export SITE_PORT="${SITE_PORT:-3003}"
  export WEB_PUBLIC_API_ORIGIN="${WEB_PUBLIC_API_ORIGIN:-http://localhost:${API_PORT}}"
  export BUSINESS_PUBLIC_API_ORIGIN="${BUSINESS_PUBLIC_API_ORIGIN:-http://localhost:${API_PORT}}"
  export SITE_PUBLIC_TRIAD_WEB_APP_URL="${SITE_PUBLIC_TRIAD_WEB_APP_URL:-http://localhost:${WEB_PORT}}"
  export SITE_PUBLIC_TRIAD_BUSINESS_APP_URL="${SITE_PUBLIC_TRIAD_BUSINESS_APP_URL:-http://localhost:${BUSINESS_PORT}}"
  export SITE_PUBLIC_APP_STORE_URL="${SITE_PUBLIC_APP_STORE_URL:-}"
  export SITE_PUBLIC_GOOGLE_PLAY_URL="${SITE_PUBLIC_GOOGLE_PLAY_URL:-}"
  export SITE_PUBLIC_CONTACT_EMAIL="${SITE_PUBLIC_CONTACT_EMAIL:-hello@triad.app}"
}

build_image() {
  log "Building $IMAGE_REF"
  docker build "${BUILD_ARGS[@]}" -t "$IMAGE_REF" -f "$DOCKERFILE_PATH" "$BUILD_CONTEXT"
}

run_direct() {
  if [[ "$REQUIRES_ENV_FILE" == "1" ]]; then
    ensure_env_file
  fi

  if ! docker image inspect "$IMAGE_REF" >/dev/null 2>&1; then
    build_image
  fi

  if direct_container_exists; then
    log "Replacing $CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME" >/dev/null
  fi

  log "Running $CONTAINER_NAME"
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "${HOST_PORT}:${CONTAINER_PORT}" \
    "${RUN_ARGS[@]}" \
    "$IMAGE_REF"
}

compose_up() {
  if [[ "$REQUIRES_ENV_FILE" == "1" || "$SERVICE" == "triad-admin" || "$SERVICE" == "triad-web" || "$SERVICE" == "triad-business" ]]; then
    ensure_env_file
  fi
  export_runtime_env
  if [[ "${DOCKER_NO_CACHE:-0}" == "1" ]]; then
    log "Rebuilding $SERVICE without cache"
    compose_cmd build --no-cache "$SERVICE"
    log "Starting compose service $SERVICE"
    compose_cmd up -d --force-recreate --remove-orphans "$SERVICE"
  else
    log "Starting compose service $SERVICE"
    compose_cmd up -d --build --force-recreate --remove-orphans "$SERVICE"
  fi
}

compose_down() {
  [[ -n "$COMPOSE_FILE" ]] || return 0
  export_runtime_env
  log "Stopping compose stack"
  compose_cmd down --remove-orphans
}

stop_all() {
  if compose_service_exists; then
    export_runtime_env
    log "Stopping compose service $SERVICE"
    compose_cmd stop "$SERVICE"
  fi

  if direct_container_exists; then
    log "Stopping $CONTAINER_NAME"
    docker stop "$CONTAINER_NAME" >/dev/null
  fi
}

clean_all() {
  if [[ -n "$COMPOSE_FILE" ]]; then
    export_runtime_env
    log "Cleaning compose resources"
    compose_cmd down --remove-orphans
  fi

  if direct_container_exists; then
    log "Removing $CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME" >/dev/null
  fi
}

show_logs() {
  if compose_service_exists; then
    export_runtime_env
    compose_cmd logs -f "$SERVICE"
    return 0
  fi

  if direct_container_exists; then
    docker logs -f "$CONTAINER_NAME"
    return 0
  fi

  fail "no compose service or direct-run container is available"
}

restart_all() {
  if compose_service_exists; then
    export_runtime_env
    log "Restarting compose service $SERVICE"
    compose_cmd restart "$SERVICE"
    return 0
  fi

  if direct_container_exists; then
    log "Restarting $CONTAINER_NAME"
    docker restart "$CONTAINER_NAME" >/dev/null
    return 0
  fi

  if [[ -n "$COMPOSE_FILE" ]]; then
    compose_up
    return 0
  fi

  run_direct
}

rebuild_all() {
  if [[ -n "$COMPOSE_FILE" ]]; then
    if [[ "$REQUIRES_ENV_FILE" == "1" || "$SERVICE" == "triad-admin" || "$SERVICE" == "triad-web" || "$SERVICE" == "triad-business" ]]; then
      ensure_env_file
    fi
    export_runtime_env
    log "Rebuilding compose service $SERVICE"
    if [[ "${DOCKER_NO_CACHE:-0}" == "1" ]]; then
      compose_cmd build --no-cache "$SERVICE"
      compose_cmd up -d --force-recreate --remove-orphans "$SERVICE"
    else
      compose_cmd up -d --build --force-recreate --remove-orphans "$SERVICE"
    fi
    return 0
  fi

  build_image
  run_direct
}

deploy_all() {
  if [[ -n "$COMPOSE_FILE" ]]; then
    ensure_env_file
    export_runtime_env
    log "Deploying compose stack"
    if [[ "${DOCKER_NO_CACHE:-0}" == "1" ]]; then
      compose_cmd build --no-cache
      compose_cmd up -d --force-recreate --remove-orphans
    else
      compose_cmd up -d --build --force-recreate --remove-orphans
    fi
    return 0
  fi

  build_image
  run_direct
}

main() {
  require_tool docker
  detect_compose_file
  configure_service

  case "$COMMAND" in
    build)
      build_image
      ;;
    run)
      run_direct
      ;;
    up)
      if [[ -n "$COMPOSE_FILE" ]]; then
        compose_up
      else
        run_direct
      fi
      ;;
    stop)
      stop_all
      ;;
    down)
      compose_down
      ;;
    clean)
      clean_all
      ;;
    logs)
      show_logs
      ;;
    restart)
      restart_all
      ;;
    rebuild)
      rebuild_all
      ;;
    deploy)
      deploy_all
      ;;
    help|-h|--help)
      usage
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
