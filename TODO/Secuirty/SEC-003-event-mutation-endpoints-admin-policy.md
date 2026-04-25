# SEC-003: Restrict Legacy Event Mutation Endpoints

## Risk Level
High

## Security Area
API Security

## Problem
Legacy event creation, deletion, and cleanup endpoints are available to any authenticated user because `EventController` uses only `[Authorize]`.

## Why This Matters
Authenticated non-admin users can potentially create, delete, or bulk-clean event records. These routes modify shared data and should not be protected only by basic authentication.

## Evidence From Code
- `backend/ThirdWheel.API/Controllers/EventController.cs`
- Controller-level `[Authorize]` applies to all actions.
- Mutating actions are labeled in comments as admin/seed/dev-only but do not require admin authorization:
  - `POST /api/event`
  - `DELETE /api/event/cleanup`
  - `DELETE /api/event/{id}`
- `backend/ThirdWheel.API/Services/EventService.cs`
  - `CreateEventAsync`
  - `CleanupDuplicateEventsAsync`
  - `DeleteEventAsync`

## Recommended Fix
Apply admin policy authorization to legacy event mutation endpoints or remove/disable them outside development if they are seed-only utilities.

## Implementation Steps
1. Decide whether these endpoints are production-supported admin routes or development-only utilities.
2. If retained, add `[Authorize(Policy = AppPolicies.Admin)]` to `POST /api/event`, `DELETE /api/event/cleanup`, and `DELETE /api/event/{id}`.
3. If development-only, gate them behind `IHostEnvironment.IsDevelopment()` or remove them from production routing.
4. Ensure user-facing event interest and listing routes remain under the existing authenticated user policy.

## Acceptance Criteria
- Normal authenticated users cannot create, delete, or clean up events.
- Event mutation endpoints require admin policy authorization or are unavailable outside development.
- Public/user event read and interest endpoints keep their intended access behavior.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
This task is about authorization on existing endpoints, not event feature design.
