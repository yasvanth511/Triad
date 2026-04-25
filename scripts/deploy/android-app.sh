#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/deploy.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"
ANDROID_DIR="$ROOT_DIR/android"

# Inputs
ANDROID_API_BASE_URL="${ANDROID_API_BASE_URL:-${BACKEND_PUBLIC_ORIGIN:-}}"
ANDROID_VARIANT="${ANDROID_VARIANT:-release}"            # debug | release
ANDROID_OUTPUT_DIR="${ANDROID_OUTPUT_DIR:-$ROOT_DIR/dist/android}"
ANDROID_KEYSTORE="${ANDROID_KEYSTORE:-}"                 # absolute path; required for signed release
ANDROID_KEY_ALIAS="${ANDROID_KEY_ALIAS:-}"
ANDROID_KEYSTORE_PASSWORD="${ANDROID_KEYSTORE_PASSWORD:-}"
ANDROID_KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-$ANDROID_KEYSTORE_PASSWORD}"
ANDROID_BUNDLE_ONLY="${ANDROID_BUNDLE_ONLY:-0}"          # 1 = only :app:bundleRelease (AAB), skip APK
ANDROID_RELEASE_COMMAND="${ANDROID_RELEASE_COMMAND:-}"

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy/android-app.sh [--debug|--release] [--bundle-only] [--api-base <url>] [--output <dir>]

Builds the Android app artifacts (APK and/or AAB) and copies them into a dist/
directory. When ANDROID_RELEASE_COMMAND is set, it runs after the build with
the artifact paths exported as TRIAD_ANDROID_APK / TRIAD_ANDROID_AAB.

Environment:
  ANDROID_API_BASE_URL       Backend origin baked into BuildConfig.API_BASE_URL.
                             Falls back to BACKEND_PUBLIC_ORIGIN.
  ANDROID_VARIANT            debug or release. Default release.
  ANDROID_OUTPUT_DIR         Where to copy the artifacts. Default dist/android.
  ANDROID_BUNDLE_ONLY        1 to skip APK and only build the Play AAB.
  ANDROID_KEYSTORE           Absolute path to a JKS/PKCS12 keystore. Required
                             for signed release builds. Optional for debug.
  ANDROID_KEY_ALIAS          Key alias inside the keystore.
  ANDROID_KEYSTORE_PASSWORD  Store password.
  ANDROID_KEY_PASSWORD       Key password (defaults to store password).
  ANDROID_RELEASE_COMMAND    Optional shell command run after build, with
                             TRIAD_ANDROID_APK and TRIAD_ANDROID_AAB exported.
                             Use it for Play upload, Firebase App Distribution,
                             or any custom rollout.

This script does not push to the Play Store directly. The release command is
the integration point — for example, fastlane supply, Firebase App Distribution,
or `gh release upload`. See README.md > Cloud Deployment for the env keys.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --debug)
      ANDROID_VARIANT="debug"
      ;;
    --release)
      ANDROID_VARIANT="release"
      ;;
    --bundle-only)
      ANDROID_BUNDLE_ONLY=1
      ;;
    --api-base)
      shift
      [[ $# -gt 0 ]] || fail "--api-base requires a value."
      ANDROID_API_BASE_URL="$1"
      ;;
    --output)
      shift
      [[ $# -gt 0 ]] || fail "--output requires a value."
      ANDROID_OUTPUT_DIR="$1"
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

if [[ ! -d "$ANDROID_DIR" ]]; then
  fail "Android project directory missing: $ANDROID_DIR"
fi

if [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* || "$(uname -s)" == CYGWIN* ]]; then
  GRADLEW="$ANDROID_DIR/gradlew.bat"
else
  GRADLEW="$ANDROID_DIR/gradlew"
fi

if [[ ! -f "$GRADLEW" ]]; then
  fail "Gradle wrapper missing at $GRADLEW. Run 'gradle wrapper --gradle-version 8.10.2' inside $ANDROID_DIR or open the project in Android Studio once."
fi

if [[ "$ANDROID_VARIANT" == "release" ]]; then
  if [[ -z "$ANDROID_KEYSTORE" ]]; then
    printf 'Warning: ANDROID_KEYSTORE not set. The release artifact will be unsigned and Gradle may fail.\n' >&2
  elif [[ ! -f "$ANDROID_KEYSTORE" ]]; then
    fail "ANDROID_KEYSTORE points to a missing file: $ANDROID_KEYSTORE"
  fi
fi

mkdir -p "$ANDROID_OUTPUT_DIR"

# Compose Gradle args. Property names mirror app/build.gradle.kts conventions.
gradle_props=()
if [[ -n "$ANDROID_API_BASE_URL" ]]; then
  gradle_props+=("-Ptriad.apiBaseUrl=$ANDROID_API_BASE_URL")
fi
if [[ -n "$ANDROID_KEYSTORE" ]]; then
  gradle_props+=(
    "-Ptriad.signing.storeFile=$ANDROID_KEYSTORE"
    "-Ptriad.signing.storePassword=$ANDROID_KEYSTORE_PASSWORD"
    "-Ptriad.signing.keyAlias=$ANDROID_KEY_ALIAS"
    "-Ptriad.signing.keyPassword=$ANDROID_KEY_PASSWORD"
  )
fi

gradle_tasks=()
case "$ANDROID_VARIANT" in
  debug)
    if [[ "$ANDROID_BUNDLE_ONLY" == "1" ]]; then
      gradle_tasks+=(":app:bundleDebug")
    else
      gradle_tasks+=(":app:assembleDebug")
    fi
    ;;
  release)
    if [[ "$ANDROID_BUNDLE_ONLY" == "1" ]]; then
      gradle_tasks+=(":app:bundleRelease")
    else
      gradle_tasks+=(":app:assembleRelease" ":app:bundleRelease")
    fi
    ;;
  *)
    fail "Unknown ANDROID_VARIANT: $ANDROID_VARIANT (expected debug or release)"
    ;;
esac

log_step "building Android $ANDROID_VARIANT (api=$ANDROID_API_BASE_URL)"
(
  cd "$ANDROID_DIR"
  "$GRADLEW" "${gradle_tasks[@]}" "${gradle_props[@]}"
)

# Locate produced artifacts.
apk_path=""
aab_path=""
case "$ANDROID_VARIANT" in
  debug)
    apk_path="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
    aab_path="$ANDROID_DIR/app/build/outputs/bundle/debug/app-debug.aab"
    ;;
  release)
    apk_path="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
    if [[ ! -f "$apk_path" ]]; then
      apk_path="$ANDROID_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"
    fi
    aab_path="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
    ;;
esac

copied_apk=""
copied_aab=""
if [[ "$ANDROID_BUNDLE_ONLY" != "1" && -f "$apk_path" ]]; then
  copied_apk="$ANDROID_OUTPUT_DIR/$(basename "$apk_path")"
  cp "$apk_path" "$copied_apk"
  log_step "APK ready at $copied_apk"
fi
if [[ -f "$aab_path" ]]; then
  copied_aab="$ANDROID_OUTPUT_DIR/$(basename "$aab_path")"
  cp "$aab_path" "$copied_aab"
  log_step "AAB ready at $copied_aab"
fi

if [[ -z "$copied_apk" && -z "$copied_aab" ]]; then
  fail "Build finished but no APK or AAB was produced where expected."
fi

if [[ -z "$ANDROID_RELEASE_COMMAND" ]]; then
  log_step "Android build complete"
  printf 'APK: %s\n' "${copied_apk:-<skipped>}"
  printf 'AAB: %s\n' "${copied_aab:-<skipped>}"
  exit 0
fi

log_step "running Android release hook"
TRIAD_ANDROID_APK="$copied_apk" \
TRIAD_ANDROID_AAB="$copied_aab" \
TRIAD_ANDROID_VARIANT="$ANDROID_VARIANT" \
  bash -lc "$ANDROID_RELEASE_COMMAND"
