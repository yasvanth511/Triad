# SEC-011: Minimize PII in JWT Claims

## Risk Level
Medium

## Security Area
Token Security

## Problem
JWT access tokens include email and username claims.

## Why This Matters
JWTs are bearer credentials that commonly appear in browser storage, mobile storage, telemetry, crash reports, proxy logs, and support screenshots. Embedding PII increases exposure if tokens are leaked.

## Evidence From Code
- `backend/ThirdWheel.API/Services/AuthService.cs`
- `GenerateToken(User user)` adds:
  - `ClaimTypes.NameIdentifier`
  - `ClaimTypes.Email`
  - `"username"`
  - `ClaimTypes.Role`
- `AdminController.EnsureSeedAdminAccess()` depends on `ClaimTypes.Email`, increasing coupling to PII-bearing tokens.

## Recommended Fix
Keep access token claims minimal. Prefer subject/session identifiers and authorization-relevant claims only. Load email/username from the database when needed by application code.

## Implementation Steps
1. Remove email and username from standard access token claims unless a route has a proven authorization requirement.
2. Replace email-dependent authorization checks with role/policy/session checks.
3. Keep `sub` or `NameIdentifier`, role, token id/session id, issuer, audience, issued-at, and expiration.
4. Review frontend code to ensure it does not rely on decoding token PII.

## Acceptance Criteria
- Access tokens do not contain email or username by default.
- Authorization does not depend on email claims.
- User display data is fetched through authenticated APIs instead of token decoding.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
No frontend token decoding was found; this task is driven by backend token generation evidence.
