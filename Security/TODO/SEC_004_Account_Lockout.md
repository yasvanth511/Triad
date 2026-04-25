# SEC_004 — Implement Account Lockout After Failed Login Attempts

**Severity:** HIGH  
**SOC 2 Criteria:** CC6.1, CC6.6  
**Status:** Open  
**Effort:** Small–Medium (1 day)

---

## Problem

The login endpoint `POST /api/auth/login` has no account lockout mechanism. An attacker can attempt unlimited password guesses against a known email address. The only protection is the global rate limiter (120 requests per 60 seconds per IP), which still allows 7,200 guesses per IP per hour, and does nothing against distributed attacks from multiple IPs.

## Required State for SOC 2

SOC 2 CC6.1 requires that access to systems is restricted. Industry baseline is a lockout after 5–10 consecutive failed attempts with a time-based or manual unlock.

## Fix

### Implementation Approach

1. Add a `FailedLoginAttempts` (integer) and `LockoutUntil` (DateTimeOffset?) column to the `Users` table.
2. In `AuthService.LoginAsync`:
   - On failed password check: increment `FailedLoginAttempts`, set `LockoutUntil = now + 15 minutes` when `FailedLoginAttempts >= 5`.
   - On successful login: reset `FailedLoginAttempts = 0` and `LockoutUntil = null`.
   - Before verifying password: check `LockoutUntil > now` and return `AccountLocked` result.
3. Return a generic `401 Unauthorized` on lockout (do not reveal the lockout state to prevent enumeration).
4. Log lockout events as security telemetry tags.

### EF Migration Required

```csharp
// New columns on User entity
public int FailedLoginAttempts { get; set; } = 0;
public DateTimeOffset? LockoutUntil { get; set; }
```

### Lockout Parameters (Recommended)

| Parameter | Value |
|---|---|
| Max failed attempts before lockout | 5 |
| Lockout duration | 15 minutes (progressive: double on each subsequent lockout) |
| Admin unlock | `POST /api/admin/users/{id}/unlock` (admin only) |

## Files To Edit

- `backend/ThirdWheel.API/Models/User.cs` — add lockout fields
- `backend/ThirdWheel.API/Services/AuthService.cs` — add lockout logic
- `backend/ThirdWheel.API/Data/AppDbContext.cs` — configure new columns
- `backend/ThirdWheel.API/Migrations/` — generate new migration
- `tests/ThirdWheel.API.UnitTests/` — add lockout unit tests

## Verification

```bash
# After 5 failed logins, 6th attempt should return 401
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:5127/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpass"}'
  echo
done
# First 5: 401 (invalid credentials)
# 6th: 401 (locked) — response body should NOT differ
```

## Fix Prompt

```
In backend/ThirdWheel.API/Models/User.cs, add:
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTimeOffset? LockoutUntil { get; set; }

In backend/ThirdWheel.API/Services/AuthService.cs, in LoginAsync:
1. Before password check: if (user.LockoutUntil > DateTimeOffset.UtcNow) return AuthResult.AccountLocked;
2. On failed password: user.FailedLoginAttempts++;
   if (user.FailedLoginAttempts >= 5)
       user.LockoutUntil = DateTimeOffset.UtcNow.AddMinutes(15 * Math.Pow(2, lockoutCount - 1));
3. On success: user.FailedLoginAttempts = 0; user.LockoutUntil = null;
4. Return a generic 401 for both invalid-password and locked (same message, no enumeration).

In backend/ThirdWheel.API/Controllers/AdminController.cs, add:
    POST /api/admin/users/{id}/unlock → reset FailedLoginAttempts = 0 and LockoutUntil = null.

In backend/ThirdWheel.API/Data/AppDbContext.cs, configure the two new columns (default 0, nullable).
Generate an EF migration.
Add unit tests in tests/ThirdWheel.API.UnitTests/ covering: lockout after 5 failures, reset on success,
locked account returns same 401, admin unlock.
```
