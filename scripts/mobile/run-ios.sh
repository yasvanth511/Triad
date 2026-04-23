#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"

API_PORT="${API_PORT:-5127}"
SKIP_API_DEPLOY="${SKIP_API_DEPLOY:-0}"
IOS_PROJECT="${IOS_PROJECT:-$ROOT_DIR/IOSNative/ThirdWheelNative.xcodeproj}"
IOS_SCHEME="${IOS_SCHEME:-ThirdWheelNative}"
IOS_BUILD_DIR="${IOS_BUILD_DIR:-/tmp/Triad/ios-build}"
IOS_APP_NAME="${IOS_APP_NAME:-ThirdWheelNative}"
IOS_BUNDLE_ID="${IOS_BUNDLE_ID:-com.thirdwheel.iosnative}"
SIMULATOR_NAME="${SIMULATOR_NAME:-iPhone 17}"
SIMULATOR_UDID="${SIMULATOR_UDID:-}"

log() {
  printf '\n==> %s\n' "$1"
}

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required tool: %s\n' "$1" >&2
    exit 1
  fi
}

resolve_simulator_udid() {
  if [[ -n "$SIMULATOR_UDID" ]]; then
    printf '%s\n' "$SIMULATOR_UDID"
    return 0
  fi

  local booted_udid
  booted_udid="$(
    xcrun simctl list devices booted | awk -F '[()]' '
      /Booted/ {
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2)
        print $2
        exit
      }
    '
  )"

  if [[ -n "$booted_udid" ]]; then
    printf '%s\n' "$booted_udid"
    return 0
  fi

  local named_udid
  named_udid="$(
    xcrun simctl list devices available | awk -v name="$SIMULATOR_NAME" -F '[()]' '
      $1 ~ name && $0 !~ /unavailable/ {
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2)
        print $2
        exit
      }
    '
  )"

  if [[ -n "$named_udid" ]]; then
    printf '%s\n' "$named_udid"
    return 0
  fi

  printf "Unable to find a booted simulator or a simulator named '%s'.\n" "$SIMULATOR_NAME" >&2
  exit 1
}

wait_for_api() {
  local url="http://localhost:${API_PORT}/health"

  for _ in {1..30}; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  printf 'API health check failed at %s\n' "$url" >&2
  exit 1
}

main() {
  require_tool docker
  require_tool curl
  require_tool open
  require_tool xcodebuild
  require_tool xcrun

  local simulator_udid
  simulator_udid="$(resolve_simulator_udid)"

  local app_path="${IOS_BUILD_DIR}/Build/Products/Debug-iphonesimulator/${IOS_APP_NAME}.app"

  if [[ "$SKIP_API_DEPLOY" != "1" ]]; then
    log "Building and deploying API"
    (
      cd "$ROOT_DIR"
      docker compose up -d --build api
    )
  fi

  log "Waiting for API health"
  wait_for_api

  log "Booting simulator"
  xcrun simctl boot "$simulator_udid" >/dev/null 2>&1 || true
  xcrun simctl bootstatus "$simulator_udid" -b
  open -a Simulator --args -CurrentDeviceUDID "$simulator_udid" >/dev/null 2>&1 || true

  log "Building iOS app"
  xcodebuild \
    -project "$IOS_PROJECT" \
    -scheme "$IOS_SCHEME" \
    -destination "platform=iOS Simulator,id=${simulator_udid}" \
    -derivedDataPath "$IOS_BUILD_DIR" \
    CODE_SIGNING_ALLOWED=NO \
    build

  if [[ ! -d "$app_path" ]]; then
    printf 'Expected app bundle was not produced: %s\n' "$app_path" >&2
    exit 1
  fi

  log "Installing and launching iOS app"
  xcrun simctl terminate "$simulator_udid" "$IOS_BUNDLE_ID" >/dev/null 2>&1 || true
  xcrun simctl install "$simulator_udid" "$app_path"
  xcrun simctl launch "$simulator_udid" "$IOS_BUNDLE_ID"

  printf '\nDone.\n'
  printf 'API: http://localhost:%s\n' "$API_PORT"
  printf 'Simulator UDID: %s\n' "$simulator_udid"
  printf 'App bundle: %s\n' "$app_path"
}

main "$@"
