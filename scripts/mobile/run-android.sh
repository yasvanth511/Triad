#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"

# Backend
API_PORT="${API_PORT:-5127}"
SKIP_API_DEPLOY="${SKIP_API_DEPLOY:-0}"

# Android project
ANDROID_DIR="${ANDROID_DIR:-$ROOT_DIR/android}"
ANDROID_PACKAGE="${ANDROID_PACKAGE:-com.triad.app}"
ANDROID_LAUNCH_ACTIVITY="${ANDROID_LAUNCH_ACTIVITY:-com.triad.app/.MainActivity}"
GRADLE_TASK="${GRADLE_TASK:-:app:installDebug}"

# Emulator selection
ANDROID_AVD="${ANDROID_AVD:-Pixel_7}"
ANDROID_SERIAL_OVERRIDE="${ANDROID_SERIAL:-}"
EMULATOR_BOOT_TIMEOUT_SECONDS="${EMULATOR_BOOT_TIMEOUT_SECONDS:-180}"

# Backend URL passed into BuildConfig.API_BASE_URL
TRIAD_API_BASE_URL="${TRIAD_API_BASE_URL:-http://10.0.2.2:${API_PORT}}"

# Optional override for the JDK that runs Gradle. We default to the JDK 21
# that ships with Android Studio because that's what the wrapper expects.
ANDROID_STUDIO_JBR="${ANDROID_STUDIO_JBR:-}"

log() {
  printf '\n==> %s\n' "$1"
}

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required tool: %s\n' "$1" >&2
    exit 1
  fi
}

resolve_android_home() {
  if [[ -n "${ANDROID_HOME:-}" && -d "$ANDROID_HOME" ]]; then
    return 0
  fi
  if [[ -n "${ANDROID_SDK_ROOT:-}" && -d "$ANDROID_SDK_ROOT" ]]; then
    export ANDROID_HOME="$ANDROID_SDK_ROOT"
    return 0
  fi

  local candidates=(
    "$HOME/Library/Android/sdk"
    "$HOME/Android/Sdk"
    "$LOCALAPPDATA/Android/Sdk"
    "C:/Users/$USER/AppData/Local/Android/Sdk"
  )
  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -n "$candidate" && -d "$candidate" ]]; then
      export ANDROID_HOME="$candidate"
      return 0
    fi
  done

  printf 'ANDROID_HOME could not be resolved. Set ANDROID_HOME or install the Android SDK.\n' >&2
  exit 1
}

resolve_java_home() {
  if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
    return 0
  fi
  if [[ -n "$ANDROID_STUDIO_JBR" && -x "$ANDROID_STUDIO_JBR/bin/java" ]]; then
    export JAVA_HOME="$ANDROID_STUDIO_JBR"
    return 0
  fi

  local candidates=(
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
    "$HOME/.config/Android Studio/jbr"
    "/usr/lib/android-studio/jbr"
    "/c/Program Files/Android/Android Studio/jbr"
    "C:/Program Files/Android/Android Studio/jbr"
  )
  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -n "$candidate" && -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      return 0
    fi
  done

  if command -v java >/dev/null 2>&1; then
    return 0
  fi

  printf 'JAVA_HOME could not be resolved. Install JDK 17+ or Android Studio (provides bundled JBR 21).\n' >&2
  exit 1
}

emulator_bin() {
  printf '%s/emulator/emulator' "$ANDROID_HOME"
}

adb_bin() {
  printf '%s/platform-tools/adb' "$ANDROID_HOME"
}

ensure_running_device() {
  local serial="$1"
  if [[ -z "$serial" ]]; then
    return 1
  fi
  "$(adb_bin)" -s "$serial" get-state 2>/dev/null | grep -q "device"
}

resolve_target_serial() {
  local adb
  adb="$(adb_bin)"

  if [[ -n "$ANDROID_SERIAL_OVERRIDE" ]]; then
    if ensure_running_device "$ANDROID_SERIAL_OVERRIDE"; then
      printf '%s\n' "$ANDROID_SERIAL_OVERRIDE"
      return 0
    fi
    printf 'ANDROID_SERIAL %s is not online.\n' "$ANDROID_SERIAL_OVERRIDE" >&2
    exit 1
  fi

  local existing
  existing="$("$adb" devices | awk '$2=="device" && $1!="List" {print $1; exit}')"
  if [[ -n "$existing" ]]; then
    printf '%s\n' "$existing"
    return 0
  fi

  log "Booting Android emulator: $ANDROID_AVD"
  if [[ ! -x "$(emulator_bin)" ]]; then
    printf 'Emulator binary missing at %s. Install the "emulator" SDK component.\n' "$(emulator_bin)" >&2
    exit 1
  fi

  local available
  available="$("$(emulator_bin)" -list-avds 2>/dev/null || true)"
  if ! grep -Fxq "$ANDROID_AVD" <<<"$available"; then
    printf 'AVD "%s" not found. Available: \n%s\n' "$ANDROID_AVD" "$available" >&2
    printf 'Create one with `sdkmanager --install "system-images;android-34;google_apis;x86_64"` then `avdmanager create avd`.\n' >&2
    exit 1
  fi

  ( "$(emulator_bin)" -avd "$ANDROID_AVD" -no-snapshot-save -no-boot-anim >/dev/null 2>&1 & )

  local started_at
  started_at="$(date +%s)"
  while :; do
    existing="$("$adb" devices | awk '$2=="device" && $1!="List" {print $1; exit}')"
    if [[ -n "$existing" ]]; then
      printf '%s\n' "$existing"
      return 0
    fi
    if (( $(date +%s) - started_at > EMULATOR_BOOT_TIMEOUT_SECONDS )); then
      printf 'Emulator failed to come online within %ss.\n' "$EMULATOR_BOOT_TIMEOUT_SECONDS" >&2
      exit 1
    fi
    sleep 2
  done
}

wait_for_boot() {
  local serial="$1"
  local adb
  adb="$(adb_bin)"
  "$adb" -s "$serial" wait-for-device

  local started_at
  started_at="$(date +%s)"
  while :; do
    local boot_complete
    boot_complete="$("$adb" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
    if [[ "$boot_complete" == "1" ]]; then
      return 0
    fi
    if (( $(date +%s) - started_at > EMULATOR_BOOT_TIMEOUT_SECONDS )); then
      printf 'Device %s did not finish booting within %ss.\n' "$serial" "$EMULATOR_BOOT_TIMEOUT_SECONDS" >&2
      exit 1
    fi
    sleep 2
  done
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
  require_tool curl

  resolve_android_home
  resolve_java_home

  local adb_path emu_path
  adb_path="$(adb_bin)"
  emu_path="$(emulator_bin)"
  if [[ ! -x "$adb_path" ]]; then
    printf 'adb missing at %s. Install Android SDK platform-tools.\n' "$adb_path" >&2
    exit 1
  fi

  local gradlew
  if [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* || "$(uname -s)" == CYGWIN* ]]; then
    gradlew="$ANDROID_DIR/gradlew.bat"
  else
    gradlew="$ANDROID_DIR/gradlew"
  fi
  if [[ ! -x "$gradlew" && ! -f "$gradlew" ]]; then
    printf 'Gradle wrapper missing at %s. Run "gradle wrapper --gradle-version 8.10.2" inside %s, or open the project in Android Studio once.\n' "$gradlew" "$ANDROID_DIR" >&2
    exit 1
  fi

  if [[ "$SKIP_API_DEPLOY" != "1" ]]; then
    require_tool docker
    log "Building and deploying API"
    (
      cd "$ROOT_DIR"
      docker compose up -d --build api
    )
  fi

  log "Waiting for API health"
  wait_for_api

  log "Resolving Android target device"
  local serial
  serial="$(resolve_target_serial)"
  printf 'Using device: %s\n' "$serial"

  log "Waiting for device boot to complete"
  wait_for_boot "$serial"

  log "Building and installing Android app (target=$GRADLE_TASK)"
  (
    cd "$ANDROID_DIR"
    ANDROID_SERIAL="$serial" "$gradlew" "$GRADLE_TASK" \
      "-Ptriad.apiBaseUrl=${TRIAD_API_BASE_URL}"
  )

  log "Launching app"
  "$adb_path" -s "$serial" shell am start -n "$ANDROID_LAUNCH_ACTIVITY" >/dev/null

  printf '\nDone.\n'
  printf 'API: http://localhost:%s\n' "$API_PORT"
  printf 'Device: %s\n' "$serial"
  printf 'Package: %s\n' "$ANDROID_PACKAGE"
  printf 'API base URL baked into APK: %s\n' "$TRIAD_API_BASE_URL"
}

main "$@"
