# SEC_001 — Remove AllowAnonymous from Admin Read Endpoints

**Severity:** CRITICAL  
**SOC 2 Criteria:** CC6.1, CC6.2  
**Status:** Open  
**Effort:** Small (< 1 day)

---

## Problem

`AdminController.cs` has `[Authorize]` at the class level but four read methods override it with `[AllowAnonymous]`, making them publicly accessible without any authentication:

| Endpoint | Data Exposed |
|---|---|
| `GET /api/admin/users` | Full user roster — username, couple status, verification count, ban status |
| `GET /api/admin/users/{userId}` | Individual user detail — report history, verification records |
| `GET /api/admin/online-users` | Real-time list of currently online user IDs |
| `GET /api/admin/moderation-analytics` | Aggregate block and report counts by reason |

Any actor with network access to the API can call these endpoints with no credentials.

## Root Cause

```csharp
// AdminController.cs
[Authorize]                            // class-level — correct
public class AdminController : BaseController
{
    [AllowAnonymous]                   // method-level override — WRONG
    [HttpGet("users")]
    public async Task<IActionResult> ListUsers(...)

    [AllowAnonymous]                   // method-level override — WRONG
    [HttpGet("online-users")]
    public async Task<IActionResult> ListOnlineUsers(...)

    [AllowAnonymous]                   // method-level override — WRONG
    [HttpGet("moderation-analytics")]
    public async Task<IActionResult> GetModerationAnalytics(...)

    [AllowAnonymous]                   // method-level override — WRONG
    [HttpGet("users/{userId:guid}")]
    public async Task<IActionResult> GetUserDetail(Guid userId)
```

## Fix

1. Remove the `[AllowAnonymous]` attribute from all four methods.
2. The class-level `[Authorize]` will then apply — but verify it is `[Authorize(Policy = "AdminOnly")]` to require the admin role, not just any valid JWT.
3. Update the admin dashboard `src/lib/api.ts` to always send the admin bearer token on these requests (it does this for business routes already, verify it is consistent for user/moderation routes).
4. Add an integration test that confirms `GET /api/admin/users` returns `401` when called without a bearer token.

## Verification

```bash
# Should return 401 with no token
curl -s -o /dev/null -w "%{http_code}" http://localhost:5127/api/admin/users
# Expected: 401

# Should return 200 with valid admin token
curl -s -H "Authorization: Bearer <admin_jwt>" http://localhost:5127/api/admin/users
# Expected: 200
```

## Files To Edit

- `backend/ThirdWheel.API/Controllers/AdminController.cs`
- `tests/ThirdWheel.API.IntegrationTests/` — add auth tests for admin endpoints

## Fix Prompt

```
In backend/ThirdWheel.API/Controllers/AdminController.cs:
1. Remove [AllowAnonymous] from ListUsers, GetUserDetail, ListOnlineUsers, and GetModerationAnalytics.
2. Confirm the class-level attribute is [Authorize(Policy = "AdminOnly")]; if it is plain [Authorize], change it.

In tests/ThirdWheel.API.IntegrationTests/, add tests asserting:
- GET /api/admin/users → 401 with no token
- GET /api/admin/users → 200 with a valid admin JWT
- Same for /api/admin/users/{id}, /api/admin/online-users, /api/admin/moderation-analytics

Do not modify any other files.
```
