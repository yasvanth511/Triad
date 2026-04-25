# SEC-001: Exposed Development Secrets

## Risk Level
Critical

## Security Area
Secrets

## Problem
`appsettings.Development.json` contains a real-looking PostgreSQL connection string with host, username, and password, plus a hardcoded JWT signing key placeholder that satisfies the current minimum length check.

## Why This Matters
Committed database credentials can allow direct data access if the database is reachable. A committed JWT signing key can allow token forgery anywhere that key is used or copied into runtime configuration.

## Evidence From Code
- `backend/ThirdWheel.API/appsettings.Development.json`
- `ConnectionStrings:DefaultConnection` contains `Host=db.nikvmewjpkgxindstiro.supabase.co`, `Username=postgres`, and a password value.
- `Jwt:Key` contains `CHANGE-THIS-TO-A-SECURE-KEY-AT-LEAST-32-CHARS-LONG!!`.
- `backend/ThirdWheel.API/Program.cs` validates only presence and length of `Jwt:Key`, so this placeholder key is accepted.

## Recommended Fix
Remove all real secrets from committed configuration. Use empty placeholders in source-controlled config and load secrets only from environment variables, user secrets, or a secret manager. Rotate the exposed database password and any JWT keys that may have used this value.

## Implementation Steps
1. Replace committed development connection strings and JWT keys with empty placeholders.
2. Add startup validation that rejects known placeholder JWT key values, not just short keys.
3. Rotate the exposed PostgreSQL password and any related database credentials.
4. Rotate JWT signing keys in every environment that may have used the committed value.
5. Document local secret setup without including secret values.

## Acceptance Criteria
- No committed appsettings file contains a real database password or reusable JWT key.
- Runtime startup fails if `Jwt:Key` equals known placeholder text.
- The exposed database password is rotated outside the repository.
- Local development still works when secrets are supplied from environment-specific secret storage.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
I intentionally did not inspect `.env*` files. This task is based only on source-controlled configuration evidence.
