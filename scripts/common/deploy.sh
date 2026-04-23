#!/usr/bin/env bash

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

log_step() {
  printf '\n==> %s\n' "$1"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Command '$1' is required."
}

normalize_origin() {
  local value="${1:-}"

  while [[ "$value" == */ ]]; do
    value="${value%/}"
  done

  if [[ "$value" == */api ]]; then
    value="${value%/api}"
  fi

  printf '%s' "$value"
}

resolve_origin_var() {
  local preferred_name="$1"
  local fallback_name="$2"
  local value="${!preferred_name:-${!fallback_name:-}}"

  normalize_origin "$value"
}

vercel_cli() {
  if command -v vercel >/dev/null 2>&1; then
    vercel "$@"
    return
  fi

  require_command npx
  npx --yes vercel@latest "$@"
}

vercel_run() {
  if [[ -n "${VERCEL_TOKEN:-}" ]]; then
    vercel_cli --token "$VERCEL_TOKEN" "$@"
    return
  fi

  vercel_cli "$@"
}

ensure_vercel_project_link() {
  local app_dir="$1"
  local project_env_name="$2"
  local linked_project="$app_dir/.vercel/project.json"
  local project_name="${!project_env_name:-}"

  if [[ -f "$linked_project" ]]; then
    return
  fi

  [[ -n "$project_name" ]] || fail "No Vercel project is linked for $app_dir. Run 'vercel link' there once or set $project_env_name."

  log_step "linking $(basename "$app_dir") to Vercel project $project_name"

  (
    cd "$app_dir"

    if [[ -n "${TRIAD_VERCEL_SCOPE:-}" ]]; then
      vercel_run link --yes --project "$project_name" --scope "$TRIAD_VERCEL_SCOPE"
    else
      vercel_run link --yes --project "$project_name"
    fi
  )
}
