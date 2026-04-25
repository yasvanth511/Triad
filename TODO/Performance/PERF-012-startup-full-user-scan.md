# PERF-012: Development Startup Scans All Users to Fix Photo/Video Sort Orders

## Problem
`Program.cs` contains a startup routine that runs at every development server start (inside `if (app.Environment.IsDevelopment())`). It loads ALL users with their Photos and Videos collections, iterates every user in C# memory, and rewrites `SortOrder` fields and `VideoBioUrl` if they are out of sync. As the seed user count grows, this adds measurable startup latency in development and could block the application from accepting requests.

## Impact
- On a seed of 50 users, this runs 50 individual in-memory loops per startup.
- If a developer re-seeds frequently (e.g., 200 seed users), startup could take 5–30 seconds before the API is ready.
- The cleanup logic runs even if no data is out of sync — it never short-circuits.
- If this code is accidentally left active in production (the `IsDevelopment()` guard is the only barrier), it would be catastrophic at scale.

## Evidence
- [Program.cs:248-361](backend/ThirdWheel.API/Program.cs#L248-L361) — inside the `if (app.Environment.IsDevelopment())` block, loads all users with `.Include(u => u.Photos).Include(u => u.Videos).ToListAsync()`.
- No check whether any user actually needs fixup before loading all users.

## Recommended Fix
1. Replace the in-memory C# loop with a single SQL UPDATE that fixes SortOrders only for affected rows:
   ```sql
   UPDATE "UserPhotos" SET "SortOrder" = subq.row_num - 1 FROM (
     SELECT "Id", ROW_NUMBER() OVER (PARTITION BY "UserId" ORDER BY "SortOrder", "CreatedAt") AS row_num
     FROM "UserPhotos"
   ) subq WHERE "UserPhotos"."Id" = subq."Id" AND "UserPhotos"."SortOrder" != subq.row_num - 1;
   ```
2. Alternatively, add a guard: query a COUNT of users with out-of-sync SortOrders first — if 0, skip the entire loop.
3. Convert the entire block into a one-time migration or a separate admin command rather than a startup side-effect.

## Scope
**Change:**
- `Program.cs` — replace the startup loop with a SQL-based fix or remove it after confirming data is consistent.

**Do not change:**
- Any service, DTO, migration, or production code path.

## Validation
- Measure API startup time before and after.
- Verify profile photo order is still correct after the change.
- Manual: seed 100 users, restart the API, confirm startup completes in < 2 seconds.

## Risk
Low risk if replaced with SQL equivalent; the fix is idempotent. If removed entirely without a data check, any existing out-of-sync rows will remain — verify dev seed data is consistent before removal.

## Priority
P3 low

## Effort
Small

## Suggested Agent Prompt
```
Task: Replace the startup user photo/video SortOrder fixup loop in Program.cs with SQL.
1. In the if (app.Environment.IsDevelopment()) block in Program.cs, remove the foreach (var user in users) loop (lines ~255-360).
2. Replace it with ExecuteSqlRawAsync calls that perform the same fix directly in SQL:
   - Renumber UserPhotos SortOrder using ROW_NUMBER() OVER (PARTITION BY UserId ORDER BY SortOrder, CreatedAt).
   - Renumber UserVideos SortOrder similarly.
   - Sync User.VideoBioUrl to the first video URL.
3. Keep the db.Database.MigrateAsync() call.
4. Keep the try/catch wrapper.
5. Do not change any service, controller, DTO, migration, or client code.
6. Run: cd backend/ThirdWheel.API && dotnet build
7. Start the API locally and confirm startup time is < 3 seconds.
```
