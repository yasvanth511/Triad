# PERF-009: Block Table Lacks Standalone Index on BlockedUserId

## Problem
The `Blocks` table has a composite unique index on `(BlockerUserId, BlockedUserId)`. Several queries filter with an OR condition — `WHERE BlockerUserId = @userId OR BlockedUserId = @userId` — notably in `SavedProfileService.GetSavedProfilesAsync`. PostgreSQL cannot use a single composite B-tree index to satisfy both sides of an OR efficiently; it must either use a bitmap OR scan or fall back to a sequential scan for the `BlockedUserId` side.

## Impact
- `GetSavedProfilesAsync` loads all blocked IDs into memory using an OR filter that cannot use the existing index for the `BlockedUserId` side.
- Users who have been blocked by many others (e.g., popular accounts) trigger slow scans.
- Safety-sensitive paths (`GetPublicProfileAsync`) also run block checks that may be slower than necessary.

## Evidence
- [SavedProfileService.cs:55-58](backend/ThirdWheel.API/Services/SavedProfileService.cs#L55-L58) — `Where(b => b.BlockerUserId == userId || b.BlockedUserId == userId)`.
- [AppDbContext.cs:162-176](backend/ThirdWheel.API/Data/AppDbContext.cs#L162-L176) — only `HasIndex(b => new { b.BlockerUserId, b.BlockedUserId })` defined; no standalone `BlockedUserId` index.

## Recommended Fix
Add a standalone index on `BlockedUserId`:

```csharp
modelBuilder.Entity<Block>(e =>
{
    e.HasIndex(b => b.BlockedUserId);
});
```

This allows PostgreSQL to use an index scan on each side of the OR independently (bitmap OR) or allows a query rewrite to `UNION`.

## Scope
**Change:**
- `AppDbContext.cs` — add `HasIndex(b => b.BlockedUserId)` inside the Block entity config.
- New EF migration via `dotnet ef migrations add AddBlockBlockedUserIdIndex`.

**Do not change:**
- `SafetyService.cs`, `SavedProfileService.cs`, any other file.

## Validation
- Generate and inspect migration for `CREATE INDEX ON "Blocks" ("BlockedUserId")`.
- Integration test: block-sensitive endpoints (saved profiles, public profile) return correct results after index addition.
- `EXPLAIN ANALYZE` in PostgreSQL to confirm bitmap index scan is used.

## Risk
Safe index-only change. Write overhead on Block inserts/deletes is negligible (Blocks are infrequent writes). No data changes.

## Priority
P2 medium

## Effort
Small

## Suggested Agent Prompt
```
Task: Add a standalone index on Block.BlockedUserId in AppDbContext.cs.
1. In AppDbContext.OnModelCreating, find the Block entity config (around line 162).
2. Add after the existing HasIndex: e.HasIndex(b => b.BlockedUserId);
3. Generate migration: cd backend/ThirdWheel.API && dotnet ef migrations add AddBlockBlockedUserIdIndex
4. Verify the migration SQL contains CREATE INDEX on BlockedUserId.
5. Do not change SafetyService.cs, SavedProfileService.cs, or any other source file.
6. Run: ./scripts/run/test-backend.sh integration
```
