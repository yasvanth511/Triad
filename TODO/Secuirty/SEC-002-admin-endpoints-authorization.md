# SEC-002: Lock Down Admin Endpoints With Admin Authorization

## Risk Level
Critical

## Security Area
API Security

## Problem
Several admin read endpoints explicitly allow anonymous access, and seed/admin mutation endpoints rely on a hardcoded email check rather than the admin policy.

## Why This Matters
Unauthenticated admin endpoints can expose user, moderation, geography, report, block, and verification summary data. Seed endpoints guarded only by an email claim increase the blast radius of forged or misissued tokens.

## Evidence From Code
- `backend/ThirdWheel.API/Controllers/AdminController.cs`
- Controller has `[Authorize]`, but these actions override it with `[AllowAnonymous]`:
  - `GET /api/admin/users`
  - `GET /api/admin/online-users`
  - `GET /api/admin/moderation-analytics`
  - `GET /api/admin/users/{userId}`
- Seed actions use class-level `[Authorize]` but no admin policy:
  - `DELETE /api/admin/seed-users`
  - `DELETE /api/admin/seed-events`
  - `POST /api/admin/seed-user`
- `EnsureSeedAdminAccess()` checks only `ClaimTypes.Email` against `yasvanth@live.in`.
- `backend/ThirdWheel.API/Controllers/BusinessAdminController.cs` shows the stricter expected pattern: `[Authorize(Policy = AppPolicies.Admin)]`.

## Recommended Fix
Require `AppPolicies.Admin` for all admin routes. Remove `[AllowAnonymous]` from admin read endpoints. Replace hardcoded seed email authorization with role/policy authorization and, if seed endpoints remain, additional environment gating.

## Implementation Steps
1. Change `AdminController` to use `[Authorize(Policy = AppPolicies.Admin)]`.
2. Remove `[AllowAnonymous]` from admin read actions.
3. Replace `EnsureSeedAdminAccess()` with policy-based authorization.
4. Ensure seed endpoints are unavailable outside explicit development or controlled maintenance mode.
5. Review admin frontend assumptions that currently fetch some routes without requiring a token.

## Acceptance Criteria
- Every `/api/admin/*` route requires a valid admin-authorized principal unless explicitly documented as a public health/status endpoint.
- No admin route relies on a hardcoded email address for authorization.
- Anonymous requests to admin data routes return `401` or `403`.
- Non-admin authenticated users cannot access admin data or seed operations.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
This is code-level authorization hardening, not admin feature design.
