# SEC_006 — Replace MD5 with SHA-256 in AntiSpamService

**Severity:** MEDIUM  
**SOC 2 Criteria:** CC6.6  
**Status:** Open  
**Effort:** Small (< 2 hours)

---

## Problem

`AntiSpamService.cs` uses `System.Security.Cryptography.MD5.HashData()` to fingerprint repeated messages for spam detection.

```csharp
// AntiSpamService.cs
var hash = Convert.ToBase64String(MD5.HashData(Encoding.UTF8.GetBytes(content)));
```

MD5 is cryptographically broken (collision attacks are practical). While this specific use is non-cryptographic (not a security hash), using MD5 in a security-reviewed codebase:

1. Sets a bad precedent for future engineers who may copy the pattern.
2. Will be flagged by SAST tools and SOC 2 auditors reviewing cryptographic practices.
3. MD5 produces 128-bit output; SHA-256 produces 256-bit output with no practical collision risk.

## Fix

Replace `MD5.HashData()` with `SHA256.HashData()`:

```csharp
// Before
using System.Security.Cryptography;
var hash = Convert.ToBase64String(MD5.HashData(Encoding.UTF8.GetBytes(content)));

// After
using System.Security.Cryptography;
var hash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(content)));
```

No other changes required — the rest of the logic (cache key, comparison) is identical.

## Additional AntiSpam Hardening (Lower Priority)

While in this file, consider:

1. **Durable cache**: Replace `IMemoryCache` with `IDistributedCache` (Redis) so spam state survives process restarts and scales horizontally.
2. **Stronger keyword matching**: Case-fold + strip Unicode look-alikes before matching (e.g., `0nlyf4ns` bypasses current check).
3. **Near-duplicate detection**: Levenshtein distance or Jaccard similarity for messages that are slightly varied to avoid the MD5/SHA check.
4. **Ban review queue**: Currently 3 spam strikes auto-bans the user. Route to a manual review queue instead.

## Files To Edit

- `backend/ThirdWheel.API/Services/AntiSpamService.cs`
- `tests/ThirdWheel.API.UnitTests/AntiSpamServiceTests.cs` — add/update tests (hash output changes)

## Verification

```bash
cd tests
dotnet test --filter "AntiSpam"
```

## Fix Prompt

```
In backend/ThirdWheel.API/Services/AntiSpamService.cs:
- Replace MD5.HashData( with SHA256.HashData( — one character-level substitution.
- The using System.Security.Cryptography directive already covers SHA256; no import change needed.

In tests/ThirdWheel.API.UnitTests/AntiSpamServiceTests.cs:
- If any test asserts on the exact hash string value, update the expected value to the SHA-256 output.
- Run: dotnet test --filter "AntiSpam" to confirm green.

Do not change any other logic in AntiSpamService.cs.
```
