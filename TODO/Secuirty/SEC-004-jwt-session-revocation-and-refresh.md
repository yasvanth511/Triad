# SEC-004: Add JWT Session Revocation and Refresh Token Rotation

## Risk Level
High

## Security Area
Token Security

## Problem
The API issues seven-day self-contained JWT access tokens and has no refresh token model, rotation, revocation list, token version, `jti` tracking, or middleware that rejects tokens for banned/deleted users after issuance.

## Why This Matters
Stolen tokens remain usable until expiration. Banned users and changed accounts may keep access with already-issued tokens. Without refresh token rotation and server-side revocation, session compromise is difficult to contain.

## Evidence From Code
- `backend/ThirdWheel.API/AppConstants.cs`: `TokenExpiryDays = 7`.
- `backend/ThirdWheel.API/Services/AuthService.cs`: `GenerateToken` creates JWTs with `DateTime.UtcNow.AddDays(AppConstants.TokenExpiryDays)`.
- `GenerateToken` includes no `jti`, session id, token version, or revocation claim.
- No refresh token entity or DbSet is present in `backend/ThirdWheel.API/Models/*` or `backend/ThirdWheel.API/Data/AppDbContext.cs`.
- `AuthService.LoginAsync` checks `user.IsBanned` only during login.
- `Program.cs` validates JWT signature, issuer, audience, and lifetime but does not perform server-side session/user-state checks.

## Recommended Fix
Use short-lived access tokens plus hashed refresh tokens with rotation and reuse detection. Add server-side session state or token version checks so logout, ban, password change, account deletion, and suspected compromise can revoke access.

## Implementation Steps
1. Reduce access token lifetime to a short duration appropriate for bearer tokens.
2. Add a refresh token/session model that stores only hashed refresh token values.
3. Add refresh token rotation with one-time-use semantics.
4. Add token revocation on logout, account deletion, ban/suspension, password changes, and suspected compromise.
5. Add a `jti` or session id claim and validate it against server-side session state.
6. Add JWT validation events or authorization middleware that rejects banned/deleted users.

## Acceptance Criteria
- Access tokens are short-lived.
- Refresh tokens are rotated and stored hashed at rest.
- Reused or revoked refresh tokens are rejected.
- Banned, deleted, or revoked sessions cannot continue using old access tokens beyond the chosen short lifetime.
- Logout invalidates the current refresh/session record.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
No refresh-token implementation was found during review.
