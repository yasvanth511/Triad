# SEC-012: Harden Authentication Rate Limiting

## Risk Level
Medium

## Security Area
API Security

## Problem
The API has a global IP-based rate limiter, but no auth-specific limiter for login and registration attempts keyed by email/username plus IP.

## Why This Matters
Authentication endpoints need tighter abuse controls than general API traffic. A global IP limiter can be too permissive for password guessing and too coarse behind NATs or proxies.

## Evidence From Code
- `backend/ThirdWheel.API/Program.cs`
  - Global sliding window: 120 requests per 60 seconds per remote IP.
- `backend/ThirdWheel.API/Controllers/AuthController.cs`
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/business/register`
- No endpoint-specific `[EnableRateLimiting]` policy or credential-keyed limiter was found for auth actions.

## Recommended Fix
Add strict, auth-specific rate limits and lockout/backoff behavior keyed by normalized email/username and client IP. Avoid returning account-enumerating responses.

## Implementation Steps
1. Add named rate-limiting policies for login and registration.
2. Partition login limits by normalized email and IP.
3. Add progressive backoff or temporary lockout for repeated failures.
4. Keep error messages generic for credential failures.
5. Ensure limits account for reverse proxy headers only after trusted proxy configuration exists.

## Acceptance Criteria
- Login has stricter limits than the global API limiter.
- Repeated attempts against one account are throttled even from rotating IPs where feasible.
- Registration abuse is throttled separately from normal API traffic.
- Credential failure responses remain generic.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
Password hashing uses BCrypt, so this task focuses on online guessing resistance rather than password storage.
