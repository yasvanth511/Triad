# SEC_013 — Add Per-Endpoint Rate Limiting for Sensitive Operations

**Severity:** HIGH  
**SOC 2 Criteria:** CC6.6, CC7.1  
**Status:** Open  
**Effort:** Medium (1–2 days)

---

## Problem

The platform has a single global rate limiter: 120 requests per 60 seconds per IP. This allows:

- **Credential stuffing**: 7,200 login attempts per IP per hour before hitting the global limit.
- **Registration spam**: 7,200 account registrations per IP per hour.
- **Report spam**: Rapid-fire reports against a target user.
- **Verification exhaustion**: Rapid verification attempts consuming third-party provider quotas.

High-sensitivity endpoints need their own, stricter limits independent of the global policy.

## Required Limits by Endpoint

| Endpoint | Suggested Limit | Reason |
|---|---|---|
| `POST /api/auth/login` | 5 per minute per IP | Brute-force prevention |
| `POST /api/auth/register` | 3 per hour per IP | Bot account creation |
| `POST /api/auth/resend-verification` | 3 per hour per email | Email bombing |
| `POST /api/auth/forgot-password` | 3 per hour per email | Email bombing (once implemented) |
| `POST /api/verifications/{key}/attempts` | 3 per hour per user | Verification provider quota |
| `POST /api/safety/report` | 10 per day per user | Report spam |
| `POST /api/impress-me` | 5 per day per user | Already in `AppConstants.ImpressMe.DailyQuota` — ensure enforced at rate-limiter layer too |
| `POST /api/match/like` | 50 per day per user | Already in `AppConstants.MaxLikesPerDay` — ensure enforced |
| `POST /api/profile/photos` | 20 per hour per user | Storage abuse |

## Implementation

ASP.NET Core 10's built-in rate limiter supports multiple named policies. Add per-endpoint policies alongside the existing global policy:

```csharp
// Program.cs — add alongside existing global limiter
builder.Services.AddRateLimiter(options => {
    // Existing global policy
    options.AddSlidingWindowLimiter("global", ...);

    // Login — strict per-IP
    options.AddFixedWindowLimiter("login", opt => {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });

    // Registration — per-IP
    options.AddFixedWindowLimiter("register", opt => {
        opt.PermitLimit = 3;
        opt.Window = TimeSpan.FromHours(1);
        opt.QueueLimit = 0;
    });
});
```

Apply to endpoints via `[EnableRateLimiting("login")]` on the controller action.

## User-Based Rate Limiting

For authenticated endpoints (like likes per day), the rate limiter partition key should be `userId` (from JWT claims), not IP address. This prevents shared-IP rate limit sharing and aligns with the per-user limits in `AppConstants`.

```csharp
options.AddFixedWindowLimiter("likes", opt => {
    opt.PermitLimit = AppConstants.MaxLikesPerDay;
    opt.Window = TimeSpan.FromDays(1);
});
// Partition by user ID
options.AddPolicy("likes-per-user", httpContext =>
    RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous",
        factory: _ => new FixedWindowRateLimiterOptions { PermitLimit = AppConstants.MaxLikesPerDay, Window = TimeSpan.FromDays(1) }
    ));
```

## Files To Edit

- `backend/ThirdWheel.API/Program.cs` — add named rate limit policies
- `backend/ThirdWheel.API/Controllers/AuthController.cs` — apply login and register policies
- `backend/ThirdWheel.API/Controllers/VerificationController.cs` — apply attempt policy
- `backend/ThirdWheel.API/Controllers/SafetyController.cs` — apply report policy
- `backend/ThirdWheel.API/Controllers/MatchController.cs` — apply likes-per-day policy

## Verification

```bash
# 6th login attempt within 1 minute should return 429
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:5127/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"t@t.com","password":"wrong"}'
  echo
done
# First 5: 401, 6th: 429
```

## Fix Prompt

```
In backend/ThirdWheel.API/Program.cs, inside builder.Services.AddRateLimiter(...), add named policies:
    options.AddFixedWindowLimiter("login",    o => { o.PermitLimit = 5;  o.Window = TimeSpan.FromMinutes(1); });
    options.AddFixedWindowLimiter("register", o => { o.PermitLimit = 3;  o.Window = TimeSpan.FromHours(1); });
    options.AddFixedWindowLimiter("resend",   o => { o.PermitLimit = 3;  o.Window = TimeSpan.FromHours(1); });
    options.AddFixedWindowLimiter("verify",   o => { o.PermitLimit = 3;  o.Window = TimeSpan.FromHours(1); });
    options.AddFixedWindowLimiter("report",   o => { o.PermitLimit = 10; o.Window = TimeSpan.FromDays(1); });
    options.AddPolicy("likes-per-user", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anon",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = AppConstants.MaxLikesPerDay, Window = TimeSpan.FromDays(1) }));
    options.AddPolicy("photo-upload", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anon",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromHours(1) }));

Apply attributes:
- AuthController.Login          → [EnableRateLimiting("login")]
- AuthController.Register       → [EnableRateLimiting("register")]
- AuthController.ResendVerification → [EnableRateLimiting("resend")]
- VerificationController attempt endpoint → [EnableRateLimiting("verify")]
- SafetyController.Report       → [EnableRateLimiting("report")]
- MatchController like endpoint → [EnableRateLimiting("likes-per-user")]
- ProfileController photo upload → [EnableRateLimiting("photo-upload")]
```
