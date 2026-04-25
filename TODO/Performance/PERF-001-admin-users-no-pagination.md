# PERF-001: Admin Users List Has No Pagination

## Problem
`GET /api/admin/users` fetches every user row in a single query with no page or limit parameter. Three follow-up queries (block counts, report counts, verification counts) then run `WHERE UserId IN (…all IDs…)`. The full result set is held in memory and serialised in one response body.

## Impact
- Response latency and memory usage grow linearly with total user count.
- At 10 k users the IN clause across three follow-up queries becomes a very large array parameter, and the network payload could exceed several MB.
- Admin dashboard becomes unusable at scale; slow queries block the shared DB connection pool.

## Evidence
- [AdminController.cs:31-108](backend/ThirdWheel.API/Controllers/AdminController.cs#L31-L108) — no `skip`/`take` on `_db.Users`, three bulk IN queries over all user IDs.
- `ListUsers()` returns `users.Select(…)` — the entire collection projected in C# memory.

## Recommended Fix
Add `skip` and `take` (or `page` and `pageSize`) query parameters to `ListUsers`. Perform the block/report/verification aggregate queries only over the current page's user IDs. Return a paginated envelope `{ items, total, page, pageSize }`.

## Scope
**Change:**
- `AdminController.cs` — add pagination parameters, limit IN clause to current page IDs.

**Do not change:**
- Auth middleware, admin policy, any other endpoint, frontend admin pages (those can be updated as a follow-up).

## Validation
- Integration test: request page 1 (take=20) with 30 seeded users and assert exactly 20 items returned.
- Integration test: request page 2 and assert 10 items.
- Manual: open admin dashboard and verify paged navigation.
- Network check: confirm response body is smaller and latency is lower with a large seed.

## Risk
Breaking change to `GET /api/admin/users` response shape if the admin Next.js client expects a flat array. Check `admin/nextjs-admin` consumer before shipping.

## Priority
P1 high

## Effort
Small

## Suggested Agent Prompt
```
Task: Add cursor/offset pagination to GET /api/admin/users in AdminController.cs.
- Add [FromQuery] int skip = 0 and [FromQuery] int take = 50 (max 200) parameters.
- Apply .Skip(skip).Take(take) to the Users query before fetching block/report/verification counts.
- Run the three follow-up IN queries only over the current page user IDs.
- Wrap the response in { items: [...], total: <count>, skip, take }.
- Do not change any other endpoint or production code.
- After editing, run: cd admin/nextjs-admin && npm run build to verify admin client still compiles.
Constraints: no migration, no lock file edits, no frontend changes beyond build check.
```
