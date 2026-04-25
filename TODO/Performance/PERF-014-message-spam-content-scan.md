# PERF-014: Anti-Spam Repeated Message Check Performs Content String Scan

## Problem
`AntiSpamService.CheckMessageAsync` counts recent messages with the exact same `Content` string in the last N minutes to detect repeated spamming:

```csharp
var repeatedCount = await _db.Messages
    .CountAsync(m => m.SenderId == userId
                  && m.SentAt > cutoff
                  && m.Content == content);
```

There is no index on `Messages.Content`. PostgreSQL must scan all messages sent by the user in the time window and compare full text strings. There is also no index on `(SenderId, SentAt)` alone — the existing index is `(MatchId, SentAt)` and `(SenderId, SentAt)`, though the latter exists and will help filter by sender.

However, the content string equality check remains unindexed. For users who send many messages, the full-content scan within the window is still expensive.

## Impact
- Every message send invokes this check.
- String equality on a TEXT column without an index is a per-row comparison.
- The `(SenderId, SentAt)` index helps bound the rows, but content matching remains in-memory after index row retrieval.
- With active chat users sending 100+ messages in a session, this adds 5–20 ms per message send.

## Evidence
- [AntiSpamService.cs:60-67](backend/ThirdWheel.API/Services/AntiSpamService.cs#L60-L67) — `m.Content == content` in a `CountAsync` with no index support for content.
- [AppDbContext.cs:150-161](backend/ThirdWheel.API/Data/AppDbContext.cs#L150-L161) — `Messages` entity has no content index.

## Recommended Fix
Two options:
1. **Hash approach**: Store a `ContentHash` (MD5 or SHA-256 of the content, truncated to 32 chars) alongside each message. Index `(SenderId, SentAt, ContentHash)`. Compare on the hash instead of full content.
2. **Counter approach**: Track a per-user recent-message hash map in `IMemoryCache` rather than querying the DB. On each message send, compute a hash and check the in-memory dedup window (e.g., a `HashSet<string>` per user with sliding expiry).

Option 2 is lower risk (no migration) but loses persistence across restarts. Option 1 is more robust.

## Scope
**Change:**
- If option 2: `AntiSpamService.cs` — inject `IMemoryCache`, cache recent content hashes per user.
- If option 1: `Message` model, `AppDbContext.cs`, new EF migration, `AntiSpamService.cs`.

**Do not change:**
- `MessagingService.cs`, `MessageController.cs`, DTOs.

## Validation
- Unit test: send the same message twice within the window and assert the repeat is detected.
- Integration test: verify existing anti-spam behavior is unchanged.
- Performance: log query duration before and after; confirm reduction.

## Risk
Option 2: Restart clears the in-memory cache — a spammer can bypass the repeated-message check once per restart window. Acceptable given the short TTL. Option 1: Migration adds a column to a potentially large Messages table — test with a large seed.

## Priority
P3 low

## Effort
Small (option 2) / Medium (option 1)

## Suggested Agent Prompt
```
Task: Replace the DB content-scan spam check with an in-memory hash check in AntiSpamService.cs.
1. In Program.cs, confirm builder.Services.AddMemoryCache() is registered (add if missing).
2. In AntiSpamService constructor, inject IMemoryCache _cache.
3. In CheckMessageAsync, replace the CountAsync on Messages.Content with:
   var contentHash = Convert.ToHexString(System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes(content)));
   var cacheKey = $"antispam:recent:{userId}:{contentHash}";
   if (_cache.TryGetValue(cacheKey, out int repeatCount) && repeatCount >= AppConstants.RepeatedMessageThreshold)
   {
       await HandleSpamDetection(userId, "Repeated messages detected");
   }
   _cache.Set(cacheKey, (repeatCount) + 1, TimeSpan.FromMinutes(AppConstants.RepeatedMessageWindowMinutes));
4. Remove the _db.Messages.CountAsync call for content matching.
5. Do not change the DB schema, migrations, or any other service.
6. Run: cd backend/ThirdWheel.API && dotnet build && ./scripts/run/test-backend.sh unit
```
