# PERF-003: LikeUserAsync Makes 8+ Sequential DB Round-Trips

## Problem
`MatchingService.LikeUserAsync` performs at least eight separate database queries in sequence before returning. Each awaited call is a new round-trip to PostgreSQL over the same open connection. If a match is created, an additional 3–4 notification queries follow immediately after.

Round-trip inventory:
1. `Blocks.AnyAsync` — block check
2. `Likes.AnyAsync` — duplicate like check
3. `Likes.CountAsync` — daily like quota
4. `Users.FindAsync(fromUserId)` — load sender
5. `Users.FindAsync(toUserId)` — load target
6. `SavedProfiles.FirstOrDefaultAsync` — existing save check
7. `SaveChangesAsync` — write the like
8. `Likes.AnyAsync` — mutual like check
9. (if match) `SaveChangesAsync` — write the match
10. (notification) `GetActorAsync` → 1 query
11. (notification) `ResolveParticipantIdsAsync` → 1–2 queries

## Impact
- A like action that results in a match incurs 10–13 DB round-trips at ~2–5 ms each = 20–65 ms of pure query latency before app logic.
- Under burst load (many users liking simultaneously) this serialises DB work and exhausts the connection pool faster.
- Notification queries also fire on the request path, adding latency the user perceives.

## Evidence
- [MatchingService.cs:30-95](backend/ThirdWheel.API/Services/MatchingService.cs#L30-L95) — sequential awaited DB calls.
- [NotificationService.cs:21-41](backend/ThirdWheel.API/Services/NotificationService.cs#L21-L41) — `GetActorAsync` then `PushAsync` on the same request path.

## Recommended Fix
1. **Combine user loads**: Replace two `FindAsync` calls with a single `Where(u => u.Id == fromUserId || u.Id == toUserId).ToListAsync()`.
2. **Batch validation queries**: Combine the block check, duplicate like check, and daily-count check into one query using a `Select` projection.
3. **Fire notifications off the critical path**: Move `NotifyLikeAsync` / `NotifyMatchAsync` to a background task (`Task.Run` with a try/catch) so the HTTP response returns immediately after the like/match is persisted.

## Scope
**Change:**
- `MatchingService.cs` — query batching and user load consolidation.
- Optionally `NotificationService.cs` — fire-and-forget wrapper.

**Do not change:**
- Business rules (block/quota/duplicate checks must still occur), contracts, migrations, tests that test the observable outcome.

## Validation
- Unit test: verify the like operation still enforces block/quota/duplicate guards.
- Integration test: like flow produces correct Like record and Match record.
- OpenTelemetry trace check: confirm DB round-trip count drops from 8+ to ≤4 for the non-match path.
- Load test: 50 concurrent likes; compare p95 latency before and after.

## Risk
Batching validation queries changes the exact error message ordering if multiple guards trigger at once. Confirm guard precedence is preserved. Background notifications may arrive slightly later but users are already used to async push delivery.

## Priority
P1 high

## Effort
Medium

## Suggested Agent Prompt
```
Task: Reduce DB round-trips in MatchingService.LikeUserAsync (MatchingService.cs).
Step 1 — Consolidate the two FindAsync calls for fromUser and toUser into one:
  var users = await _db.Users.Where(u => u.Id == fromUserId || u.Id == toUserId).ToDictionaryAsync(u => u.Id);
  var fromUser = users.GetValueOrDefault(fromUserId) ?? throw ...;
  var toUser = users.GetValueOrDefault(toUserId) ?? throw ...;
Step 2 — Combine block check and duplicate like check into a single SELECT that returns both flags:
  var guard = await _db.Users.Where(u => u.Id == fromUserId).Select(u => new {
      IsBlocked = _db.Blocks.Any(b => (b.BlockerUserId==fromUserId&&b.BlockedUserId==toUserId)||(b.BlockerUserId==toUserId&&b.BlockedUserId==fromUserId)),
      AlreadyLiked = _db.Likes.Any(l => l.FromUserId==fromUserId && l.ToUserId==toUserId)
  }).FirstOrDefaultAsync();
Step 3 — Wrap notification calls in Task.Run(() => ...) so they don't block the response:
  _ = Task.Run(async () => { try { await _notifications.NotifyLikeAsync(...); } catch { } });
- Preserve all existing business rules and telemetry.
- Do not change migrations, contracts, or any other service.
- Run ./scripts/run/test-backend.sh unit after editing.
```
