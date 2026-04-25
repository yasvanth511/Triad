# PERF-007: GetNotificationsAsync Issues Two Separate DB Queries

## Problem
`NotificationService.GetNotificationsAsync` runs two sequential queries:
1. Paginated list of notifications for the user.
2. Separate `CountAsync` for unread notifications.

Both queries hit the same `Notifications` table with the same `RecipientId` filter. The unread count could be derived from the already-loaded set or combined into a single query using a window function or subquery.

## Impact
- Two DB round-trips on every notification poll.
- The frontend polls notifications regularly (or on mount); each poll doubles query overhead.
- The unread `CountAsync` is a full index scan over `(RecipientId, IsRead)` even when most are already read.

## Evidence
- [NotificationService.cs:140-154](backend/ThirdWheel.API/Services/NotificationService.cs#L140-L154) — `ToListAsync()` then `CountAsync()` sequentially.
- The composite index `(RecipientId, IsRead)` exists but is still traversed twice per request.

## Recommended Fix
Combine into a single query using a SQL subquery approach:
```csharp
var notifications = await _db.Notifications
    .AsNoTracking()
    .Where(n => n.RecipientId == userId)
    .OrderByDescending(n => n.CreatedAt)
    .Skip(skip).Take(take)
    .ToListAsync();

var unreadCount = await _db.Notifications
    .Where(n => n.RecipientId == userId && !n.IsRead)
    .CountAsync();
```
Or run both in parallel using `Task.WhenAll`:
```csharp
var listTask = _db.Notifications...ToListAsync();
var countTask = _db.Notifications...CountAsync();
await Task.WhenAll(listTask, countTask);
```
This halves round-trip latency by running both concurrently on separate DbContext instances, or via two concurrent commands on the pooled context.

Note: EF Core DbContext is not thread-safe; parallel queries require two separate scoped context instances. The simpler first win is to run the count only if `take` items were returned (i.e., there might be more) — otherwise, derive the unread count from the current page.

## Scope
**Change:**
- `NotificationService.cs` — parallelise or consolidate the two queries.

**Do not change:**
- `NotificationListResponse` DTO, `NotificationController`, any frontend code.

## Validation
- Unit test: assert `GetNotificationsAsync` returns correct list and unread count.
- Trace check: verify the number of DB queries drops from 2 sequential to either 2 parallel or 1.
- Manual: notification badge count matches DB state.

## Risk
Low. Parallel query approach requires care with DbContext threading — use injected factory or two scopes. Simpler approach (derive count from page) may slightly miscount when total unread > take; validate that edge case.

## Priority
P2 medium

## Effort
Small

## Suggested Agent Prompt
```
Task: Parallelise the two DB queries in NotificationService.GetNotificationsAsync (NotificationService.cs).
Option A (parallel using IDbContextFactory — preferred if registered):
  Inject IDbContextFactory<AppDbContext> and create a second context for the count query, then Task.WhenAll.
Option B (simpler — sequential but avoid extra query when page is not full):
  Run the list query first. If results.Count < take, derive unreadCount from results.Count(n => !n.IsRead).
  Only run the count query if results.Count == take (more pages may exist).
Do not change the NotificationListResponse shape or any controller.
Run: cd backend/ThirdWheel.API && dotnet build && ./scripts/run/test-backend.sh unit
```
