#!/usr/bin/env bash

repo_root_from_script() {
  local script_path="${1:-${BASH_SOURCE[0]}}"
  local script_dir
  script_dir="$(cd "$(dirname "$script_path")" && pwd)"
  cd "$script_dir/../.." && pwd
}
