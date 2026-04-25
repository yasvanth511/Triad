# SEC-006: Prevent Production CORS Fail-Open

## Risk Level
High

## Security Area
Backend Security

## Problem
The CORS policy allows any origin when `Cors:AllowedOrigins` is empty, even outside development.

## Why This Matters
If production configuration omits or clears allowed origins, the API becomes callable from any browser origin. This weakens browser-origin isolation and increases the impact of token exposure or malicious web origins.

## Evidence From Code
- `backend/ThirdWheel.API/Program.cs`
- CORS origin list is read from `Cors:AllowedOrigins`.
- Policy uses:
  - `if (builder.Environment.IsDevelopment() || corsOrigins.Length == 0)`
  - `policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();`
- Non-development branch only locks origins when `corsOrigins.Length > 0`.

## Recommended Fix
Fail closed in non-development environments. Allow wildcard CORS only in development. Require explicit allowed origins outside development and fail startup if none are configured.

## Implementation Steps
1. Change CORS configuration so `AllowAnyOrigin()` is used only when `builder.Environment.IsDevelopment()`.
2. In non-development, throw a startup exception if `Cors:AllowedOrigins` is empty.
3. Reject wildcard `*` in non-development allowed origins.
4. Keep `AllowCredentials()` only with explicit trusted origins.
5. Document required production origin configuration.

## Acceptance Criteria
- Production startup fails when no allowed CORS origins are configured.
- Production never uses `AllowAnyOrigin()`.
- Production rejects `*` as an allowed origin.
- Development remains convenient for local clients.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
This is a secure configuration/code behavior task, not deployment work.
