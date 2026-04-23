#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
COMMAND="${1:-help}"
SERVICE="${2:-${DOCKER_SERVICE:-api}}"
PROJECT_NAME="${DOCKER_PROJECT_NAME:-triad}"
IMAGE_NAME="${DOCKER_IMAGE_NAME:-triad-api}"
IMAGE_TAG="${DOCKER_IMAGE_TAG:-dev}"
IMAGE_REF="${IMAGE_NAME}:${IMAGE_TAG}"
CONTAINER_NAME="${DOCKER_CONTAINER_NAME:-triad-api}"
ENV_FILE="${DOCKER_ENV_FILE:-$ROOT_DIR/.env.docker}"
BUILD_CONTEXT="${DOCKER_BUILD_CONTEXT:-$ROOT_DIR/backend/ThirdWheel.API}"
DOCKERFILE_PATH="${DOCKERFILE_PATH:-$BUILD_CONTEXT/Dockerfile}"
HOST_PORT="${API_PORT:-5127}"
CONTAINER_PORT="${DOCKER_CONTAINER_PORT:-5000}"
UPLOADS_VOLUME="${DOCKER_UPLOADS_VOLUME:-triad_api_uploads}"
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

Key env vars:
  DOCKER_ENV_FILE, DOCKER_IMAGE_NAME, DOCKER_IMAGE_TAG
  DOCKER_CONTAINER_NAME, DOCKER_PROJECT_NAME, DOCKER_SERVICE
  DOCKER_BUILD_CONTEXT, DOCKERFILE_PATH, API_PORT
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
  export DOCKER_IMAGE_NAME="$IMAGE_NAME"
  export DOCKER_IMAGE_TAG="$IMAGE_TAG"
  export API_PORT="$HOST_PORT"
}

build_image() {
  log "Building $IMAGE_REF"
  docker build -t "$IMAGE_REF" -f "$DOCKERFILE_PATH" "$BUILD_CONTEXT"
}

run_direct() {
  ensure_env_file
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
    --env-file "$ENV_FILE" \
    -p "${HOST_PORT}:${CONTAINER_PORT}" \
    -v "${UPLOADS_VOLUME}:/app/uploads" \
    "$IMAGE_REF"
}

compose_up() {
  ensure_env_file
  export_runtime_env
  log "Starting compose service $SERVICE"
  compose_cmd up -d --build "$SERVICE"
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
    ensure_env_file
    export_runtime_env
    log "Rebuilding compose service $SERVICE"
    compose_cmd up -d --build --force-recreate "$SERVICE"
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
    compose_cmd up -d --build --remove-orphans
    return 0
  fi

  build_image
  run_direct
}

main() {
  require_tool docker
  detect_compose_file

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
