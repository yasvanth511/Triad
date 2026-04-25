#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/common/repo-root.sh"

ROOT_DIR="$(repo_root_from_script "${BASH_SOURCE[0]}")"

check_tool() {
  local tool="$1"
  if command -v "$tool" >/dev/null 2>&1; then
    printf '[ok] %s\n' "$tool"
  else
    printf '[missing] %s\n' "$tool"
  fi
}

check_path() {
  local label="$1"
  local path="$2"
  if [[ -e "$path" ]]; then
    printf '[ok] %s (%s)\n' "$label" "$path"
  else
    printf '[missing] %s (looked for %s)\n' "$label" "$path"
  fi
}

printf 'Repo: %s\n' "$ROOT_DIR"

# General tooling
check_tool curl
check_tool docker
check_tool node
check_tool npm
check_tool dotnet

# iOS
check_tool open
check_tool xcodebuild
check_tool xcrun

# Android
if [[ -n "${ANDROID_HOME:-}" ]]; then
  printf '[ok] ANDROID_HOME (%s)\n' "$ANDROID_HOME"
elif [[ -n "${ANDROID_SDK_ROOT:-}" ]]; then
  printf '[ok] ANDROID_SDK_ROOT (%s)\n' "$ANDROID_SDK_ROOT"
else
  printf '[missing] ANDROID_HOME / ANDROID_SDK_ROOT\n'
fi
check_tool adb
check_tool emulator
if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
  printf '[ok] JAVA_HOME (%s)\n' "$JAVA_HOME"
else
  check_tool java
fi
check_path "Android project" "$ROOT_DIR/android"
check_path "Android Gradle wrapper" "$ROOT_DIR/android/gradlew"

if [[ -f "$ROOT_DIR/.env.docker" ]]; then
  printf '[ok] .env.docker\n'
else
  printf '[missing] .env.docker (copy from .env.docker.example)\n'
fi
