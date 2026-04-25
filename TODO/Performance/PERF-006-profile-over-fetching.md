# PERF-006: ProfileService Loads All Relations on Every Read and Write

## Problem
Every profile operation in `ProfileService` — including lightweight write-only methods like `SetAudioBioUrlAsync` and `SetVideoBioUrlAsync` — loads the full graph: `Photos`, `Videos`, `Interests`, `RedFlags`, `Couple`, and `Couple.Members`. This is done even when only a single field needs to be updated.

`GetPublicProfileAsync` makes two separate DB queries: one for the block check and one for the full profile include, when both could be combined.

## Impact
- Every audio/video bio update triggers a JOIN across 5 navigation tables unnecessarily.
- `GetPublicProfileAsync` incurs an extra round-trip per public profile view.
- At scale (thousands of simultaneous profile views) this multiplies the query load significantly.

## Evidence
- [ProfileService.cs:195-215](backend/ThirdWheel.API/Services/ProfileService.cs#L195-L215) — `SetAudioBioUrlAsync` includes Photos, Videos, Interests, RedFlags, Couple+Members to update one field.
- [ProfileService.cs:50-89](backend/ThirdWheel.API/Services/ProfileService.cs#L50-L89) — `GetPublicProfileAsync` issues `AnyAsync` for blocks then a full `FirstOrDefaultAsync` with all includes.
- Same pattern repeated in `UpdateProfileAsync` (line 99), `SetVideoBioUrlAsync` (line 221).

## Recommended Fix
1. **Write-only paths** (`SetAudioBioUrlAsync`, `SetVideoBioUrlAsync`): load only the specific navigation needed (`Include(u => u.Videos)` or no includes — just update the scalar field directly via `ExecuteUpdateAsync`).
2. **`GetPublicProfileAsync`**: combine the block check into the profile query using a left-join or `.Select` projection that includes an `IsBlocked` flag, eliminating one round-trip.
3. For read operations that need to return the full `UserProfileResponse`, keep the full include.

## Scope
**Change:**
- `ProfileService.cs` — reduce includes on write-only methods, combine block check in public profile.

**Do not change:**
- `UserMapper.cs`, DTOs, `UserProfileResponse`, any controller, migrations.

## Validation
- Unit tests for `SetAudioBioUrlAsync` and `SetVideoBioUrlAsync`: verify the URL is saved correctly.
- Integration test for `GetPublicProfileAsync`: verify blocked users return 404-equivalent.
- Trace check: DB round-trip count drops for audio/video bio update and public profile view.

## Risk
Low — the return type and observable data are unchanged. Slight risk if `UserMapper.ToProfileResponse` depends on navigation properties being loaded; ensure all required nav props are still included for read paths.

## Priority
P2 medium

## Effort
Small

## Suggested Agent Prompt
```
Task: Reduce unnecessary includes in ProfileService.cs write-only methods.
1. In SetAudioBioUrlAsync: replace the full Include chain with:
   var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId) ?? throw ...;
   user.AudioBioUrl = url;
   user.UpdatedAt = DateTime.UtcNow;
   await _db.SaveChangesAsync();
   Then call GetProfileAsync(userId) to get the full response (or keep a lightweight projection).
2. In GetPublicProfileAsync: merge the block AnyAsync into the profile query:
   var result = await _db.Users.Where(u => u.Id == userId && !u.IsBanned)
     .Select(u => new { Profile = u, IsBlocked = _db.Blocks.Any(b => ...) })
     .FirstOrDefaultAsync();
   if (result == null || result.IsBlocked) throw new KeyNotFoundException("User not found.");
3. For SetVideoBioUrlAsync: keep Include(u => u.Videos) but remove Photos, Interests, RedFlags, Couple includes.
4. Do not change return types, DTOs, migrations, or controllers.
5. Run: cd backend/ThirdWheel.API && dotnet build && ./scripts/run/test-backend.sh unit
```
