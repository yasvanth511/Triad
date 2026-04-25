# PERF-005: Events Endpoint Fetches All Future Events with In-Memory Geo Filter

## Problem
`EventService.GetEventsAsync` loads every future event from the database (no LIMIT), including all their `Interests` navigation rows. Geo-distance filtering is then done in C# memory: events outside the user's radius return `null` and are discarded. As the event catalogue grows, this scales poorly.

## Impact
- Full table scan of `Events` on every request for every authenticated user.
- The `Include(e => e.Interests)` loads all interest rows for all events, not just those in radius.
- N events × M interests per event loaded into memory, then most discarded.
- Payload sent to the client can be large if many events match.

## Evidence
- [EventService.cs:29-61](backend/ThirdWheel.API/Services/EventService.cs#L29-L61) — `.ToListAsync()` with no TAKE, `.Select` returns `null` for out-of-radius events.
- The geo bounding box pre-filter used in `DiscoveryService` is absent here.
- No `skip`/`take` parameters on the `GetEventsAsync` method or `EventController`.

## Recommended Fix
1. Add `skip` and `take` parameters (default take=50, max 100).
2. Apply the same bounding-box pre-filter as `DiscoveryService` at the SQL level before pagination.
3. Move the `Interests.Count` and `Interests.Any(userId)` to projected SQL (`SELECT COUNT(*)`, `EXISTS`) rather than loading full Interests collections.
4. Return paginated envelope.

## Scope
**Change:**
- `EventService.cs` — add bounding-box filter, pagination, projected interest counts.
- `EventController.cs` — add skip/take query parameters.

**Do not change:**
- `EventResponse` DTO shape (add skip/take to query params only), migrations, client code (can send skip=0&take=50 by default).

## Validation
- Unit test: assert that events outside radius are excluded.
- Integration test: seed 100 events, call with take=10, assert exactly 10 returned.
- Build check: `cd web/triad-web && npm run typecheck` (consumer uses `getEvents` which passes no pagination currently — add defaults).

## Risk
The consumer web `getEvents` function hardcodes no pagination parameters. After this change it will still work (defaults to first page), but users may not see all events. A follow-up task should add client-side pagination.

## Priority
P2 medium

## Effort
Small

## Suggested Agent Prompt
```
Task: Add pagination and server-side geo pre-filter to EventService.GetEventsAsync (EventService.cs).
1. Add (int skip = 0, int take = 50) parameters to GetEventsAsync. Cap take at 100.
2. Before .ToListAsync(), apply bounding-box filter identical to DiscoveryService lines 74-89 (use user Latitude/Longitude/RadiusMiles).
3. Replace .Include(e => e.Interests) with projected counts:
   .Select(e => new { Event = e, InterestedCount = e.Interests.Count(), IsInterested = e.Interests.Any(i => i.UserId == userId) })
4. Apply .Skip(skip).Take(take) before materialising.
5. Update EventController to accept [FromQuery] int skip = 0, [FromQuery] int take = 50 and pass to service.
6. Keep EventResponse shape identical.
7. Do not change DTOs, migrations, or client code.
8. Run: cd backend/ThirdWheel.API && dotnet build && ./scripts/run/test-backend.sh unit
```
