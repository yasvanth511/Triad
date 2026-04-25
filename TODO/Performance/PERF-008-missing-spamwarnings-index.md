# PERF-008: SpamWarnings Table Has No Index on UserId

## Problem
`AntiSpamService.HandleSpamDetection` queries `SpamWarnings` filtered by `UserId` and ordered by `CreatedAt` descending to determine the current warning level. The `SpamWarnings` table has no index on `UserId`, meaning every spam check performs a sequential scan of the entire table.

## Impact
- Every message send triggers `CheckMessageAsync`, which may trigger `HandleSpamDetection`.
- Spam checks on a growing `SpamWarnings` table become progressively slower.
- A user sending the first spam message in a large deployment could hit a slow full-table scan before being warned.

## Evidence
- [AntiSpamService.cs:111-113](backend/ThirdWheel.API/Services/AntiSpamService.cs#L111-L113) — `_db.SpamWarnings.Where(s => s.UserId == userId).OrderByDescending(s => s.CreatedAt).ToListAsync()` — no index support.
- [AppDbContext.cs:186-195](backend/ThirdWheel.API/Data/AppDbContext.cs#L186-L195) — `SpamWarning` entity has only a `UserId` FK relationship, no explicit index defined.

## Recommended Fix
Add a composite index on `(UserId, CreatedAt DESC)` to `SpamWarning` in `AppDbContext.OnModelCreating` and create the corresponding EF migration:

```csharp
modelBuilder.Entity<SpamWarning>(e =>
{
    e.HasIndex(s => new { s.UserId, s.CreatedAt });
});
```

## Scope
**Change:**
- `AppDbContext.cs` — add `HasIndex` configuration for SpamWarning.
- New EF migration file generated via `dotnet ef migrations add AddSpamWarningUserIdIndex`.

**Do not change:**
- `AntiSpamService.cs`, any controllers, DTOs, other models.

## Validation
- Run `dotnet ef migrations add AddSpamWarningUserIdIndex` and verify migration SQL contains `CREATE INDEX`.
- Integration test: seed 1000 spam warnings for various users, call `CheckMessageAsync`, assert correct level is returned.
- Check `EXPLAIN ANALYZE` in PostgreSQL confirms index scan instead of seq scan after migration.

## Risk
Migration adds an index — safe, non-destructive, no data changes. In-flight transactions are unaffected. Slight index write overhead on new `SpamWarning` inserts.

## Priority
P2 medium

## Effort
Small

## Suggested Agent Prompt
```
Task: Add a database index on SpamWarnings(UserId, CreatedAt) for performance.
1. In AppDbContext.cs, inside OnModelCreating, find the SpamWarning entity configuration and add:
   e.HasIndex(s => new { s.UserId, s.CreatedAt });
2. Generate the EF migration:
   cd backend/ThirdWheel.API && dotnet ef migrations add AddSpamWarningUserIdIndex
3. Verify the migration file was created in Migrations/ with CREATE INDEX.
4. Do not edit AppDbContextModelSnapshot.cs manually — EF tooling updates it automatically.
5. Do not change AntiSpamService.cs or any other file.
6. Run: ./scripts/run/test-backend.sh unit
```
