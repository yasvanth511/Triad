# SEC-014: Pin Security-Sensitive Dependency Versions

## Risk Level
Low

## Security Area
Dependency Security

## Problem
Several dependency manifests use floating versions such as `latest`, caret ranges, or wildcard patch versions.

## Why This Matters
Floating dependency versions reduce build reproducibility and can unexpectedly introduce vulnerable, malicious, or breaking versions. Lock files help npm installs, but manifests still encourage uncontrolled upgrades and .NET packages do not appear pinned exactly.

## Evidence From Code
- `web/triad-web/package.json`: many dependencies use `"latest"`.
- `web/triad-business/package.json`: many dependencies use `"latest"`.
- `web/triad-site/package.json`: dependencies and devDependencies use `"latest"`.
- `admin/nextjs-admin/package.json`: uses caret ranges such as `"react": "^18"`.
- `backend/ThirdWheel.API/ThirdWheel.API.csproj`: uses wildcard versions such as `Version="10.0.*"`.

## Recommended Fix
Pin direct dependency versions and use an intentional upgrade workflow with vulnerability review. Consider lock files for .NET restore if appropriate for the repo’s build model.

## Implementation Steps
1. Replace `latest`, caret, and wildcard direct dependency versions with explicit versions.
2. Keep lock files current for npm apps.
3. Consider central package management or lock files for .NET dependencies.
4. Add a dependency update policy that reviews auth, crypto, parser, image, and framework packages first.
5. Avoid adding packages with install scripts unless necessary and reviewed.

## Acceptance Criteria
- Direct npm dependencies are pinned to exact versions.
- Direct .NET package references are pinned to exact versions or centrally managed exact versions.
- Dependency updates are intentional and reviewable.
- Security-sensitive packages are tracked for update cadence.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
This is a hardening task, not a request to run dependency upgrades now.
