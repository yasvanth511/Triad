# SEC_005 — Implement Session Revocation and Logout

**Severity:** HIGH  
**SOC 2 Criteria:** CC6.2, CC6.3  
**Status:** Open  
**Effort:** Medium (1–2 days)

---

## Problem

JWT tokens are stateless and cannot be invalidated server-side. Currently:

- There is no logout endpoint in the API.
- A stolen or compromised 7-day JWT remains valid for the full 7 days.
- If a user's account is banned, their active JWT sessions continue to work until expiry.
- Account deletion (`DELETE /api/profile`) does not invalidate active sessions.

## Required State for SOC 2

SOC 2 CC6.3 requires that logical access is removed promptly when it is no longer needed. A user who deletes their account, changes their password, or is banned should have all active sessions invalidated immediately.

## Fix

### Approach A — Token Deny-List (Recommended for Current Scale)

1. Create a `RevokedTokens` table (or Redis set) storing revoked JTI (JWT ID) values with their expiry time.
2. Add a `jti` claim to every issued JWT (unique GUID per token).
3. Add middleware that checks the `jti` against the deny-list on every request.
4. Add a `POST /api/auth/logout` endpoint that adds the current token's `jti` to the deny-list.
5. On account deletion, password change, or ban: add all active tokens for that user to the deny-list.
6. Purge expired entries from the deny-list via a background job.

### Approach B — Short-Lived Tokens + Refresh Tokens

1. Reduce access token lifetime to 15 minutes.
2. Issue an opaque refresh token (stored server-side in a `RefreshTokens` table) on login.
3. Add `POST /api/auth/refresh` to issue a new access token given a valid refresh token.
4. Logout invalidates the refresh token.

Approach A is simpler given the current architecture. Approach B is more scalable and is the industry standard for mobile apps.

### Immediate Steps

1. Add `POST /api/auth/logout` that:
   - Reads the current JWT from the Authorization header.
   - Adds the `jti` to an in-memory or Redis deny-list.
   - Returns `204 No Content`.
2. On iOS: call `/auth/logout` on explicit sign-out and delete the token from Keychain.
3. On web: call `/auth/logout` and clear session storage.

## Files To Edit

- `backend/ThirdWheel.API/Controllers/AuthController.cs` — add `POST /api/auth/logout`
- `backend/ThirdWheel.API/Services/AuthService.cs` — add JTI generation and revocation logic
- `backend/ThirdWheel.API/Program.cs` — register deny-list middleware
- `IOSNative/ThirdWheelNative/SessionStore.swift` — call logout endpoint on sign-out
- `web/triad-web/src/lib/api/services.ts` — add logout API call

## Verification

```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:5127/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}' | jq -r .token)

# Verify token works
curl -H "Authorization: Bearer $TOKEN" http://localhost:5127/api/profile

# Logout
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:5127/api/auth/logout
# Expected: 204

# Verify token is revoked
curl -H "Authorization: Bearer $TOKEN" http://localhost:5127/api/profile
# Expected: 401
```

## Fix Prompt

```
In backend/ThirdWheel.API/Services/AuthService.cs:
- When issuing a JWT, add a "jti" claim: new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())

Create RevokedTokens table (or use IMemoryCache keyed by jti with expiry matching the token TTL):
- Entity: RevokedToken { Jti (string PK), ExpiresAt (DateTimeOffset) }
- Add DbSet<RevokedToken> to AppDbContext.cs and generate a migration.

In backend/ThirdWheel.API/Program.cs, add middleware after UseAuthentication():
    app.Use(async (ctx, next) => {
        var jti = ctx.User.FindFirstValue(JwtRegisteredClaimNames.Jti);
        if (jti != null && await revokedTokenStore.IsRevokedAsync(jti))
            { ctx.Response.StatusCode = 401; return; }
        await next();
    });

In backend/ThirdWheel.API/Controllers/AuthController.cs, add:
    [Authorize] [HttpPost("logout")]
    → extract jti from User claims, call revokedTokenStore.RevokeAsync(jti, expiry), return 204.

In ProfileService.DeleteAsync and ban logic: revoke all tokens for the affected userId by adding their
jtis (query RevokedTokens by userId if you add a userId column, or set a short-lived per-user
"revoke-all-before" timestamp in cache).

In IOSNative/ThirdWheelNative/SessionStore.swift: on explicit sign-out, call POST /api/auth/logout
before deleting the token from Keychain.

In web/triad-web/src/lib/api/services.ts: add logoutUser() that calls POST /api/auth/logout.
```
