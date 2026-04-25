# PERF-002: Discovery Runs Two Queries Per Request (COUNT + Fetch)

## Problem
`DiscoveryService.GetDiscoveryCardsAsync` issues a `CountAsync` against the full filtered user set to compute a random offset, then issues a second `ToListAsync` over the same filters. This doubles DB round-trips for every swipe session refresh. The filters include correlated NOT-EXISTS subqueries for blocks, likes, and saved profiles, all of which must be re-evaluated twice.

## Impact
- Two expensive correlated-subquery plans per discovery request.
- At 1 k+ active users the COUNT alone can take 50–200 ms on unindexed paths.
- Users experience slow initial card load, particularly after audience filter changes.

## Evidence
- [DiscoveryService.cs:95-104](backend/ThirdWheel.API/Services/DiscoveryService.cs#L95-L104) — `CountAsync` followed immediately by `ToListAsync` on the same `query` chain.
- [DiscoveryService.cs:44-48](backend/ThirdWheel.API/Services/DiscoveryService.cs#L44-L48) — three correlated NOT-EXISTS subqueries: blocks, likes, saved profiles.

## Recommended Fix
Replace the two-query pattern with a single keyset-based approach:
1. Remove `CountAsync`.
2. Use `OrderBy(u => u.Id)` (or a stable random seed per user, e.g. `u.Id XOR userId` computed in SQL) and apply `Skip(filter.Skip).Take(filter.Take)` directly.
3. If controlled randomness is still required, pre-materialise eligible user IDs into a small temporary result using a projection (ID-only), then shuffle in memory and take the page. This trades one full-column projection for two full-row loads.

## Scope
**Change:**
- `DiscoveryService.cs` only.

**Do not change:**
- `DiscoveryController.cs`, DTOs, migrations, any client code.

## Validation
- Unit test: stub a DbContext with 100 users and assert `GetDiscoveryCardsAsync` produces exactly `take` results.
- Integration test: seed 50 users, call discovery, assert response time and result count.
- Log / trace check: verify exactly one DB round-trip in OpenTelemetry traces (EF Core instrumentation).

## Risk
Removing the COUNT changes card ordering non-determinism. Confirm the product intent allows any stable ordering rather than a true random shuffle.

## Priority
P1 high

## Effort
Small

## Suggested Agent Prompt
```
Task: Eliminate the double DB round-trip in DiscoveryService.GetDiscoveryCardsAsync (DiscoveryService.cs).
- Remove the CountAsync call and the randomOffset calculation.
- Replace with a single ToListAsync using the existing filter chain, ordered by u.CreatedAt, with Skip(filter.Skip).Take(filter.Take).
- Keep all existing filters (banned, blocks NOT-EXISTS, likes NOT-EXISTS, saved NOT-EXISTS, userType, bounding-box geo).
- Keep the Haversine in-memory pass and the telemetry calls.
- Do not touch DiscoveryController, DTOs, migrations, or any client code.
- Run: cd backend/ThirdWheel.API && dotnet build to verify it compiles.
- Then run: ./scripts/run/test-backend.sh unit
Constraints: no migration, no lock file edits, no behavior change beyond ordering.
```
