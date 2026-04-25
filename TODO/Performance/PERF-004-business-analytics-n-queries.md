# PERF-004: BusinessAnalyticsService Runs 7+ Separate DB Queries

## Problem
`BusinessAnalyticsService.GetAnalyticsAsync` fires seven or more sequential DB queries to assemble a single analytics response:

1. Fetch events for partner
2. COUNT likes per event
3. COUNT saves per event
4. COUNT registrations per event
5. Fetch offer IDs
6. COUNT coupon claims per offer
7. Fetch offer→event mapping (again, separate from step 5)
8. Fetch challenge data with sub-selects

Steps 5 and 7 both query `BusinessOffers` for the same partner's events. The `Offers` navigation is queried independently even though EF Core could resolve it as an include.

## Impact
- 7–8 DB round-trips per analytics page load.
- Each query has a WHERE clause with `eventIds.Contains(…)` — a large IN list when a partner has many events.
- Business users experience noticeable loading delay on the analytics dashboard.

## Evidence
- [BusinessAnalyticsService.cs:28-86](backend/ThirdWheel.API/Services/BusinessAnalyticsService.cs#L28-L86) — sequential await calls on separate DbSet queries.
- Steps 5 (`offerIds`) and 7 (`offerEventMap`) both query `BusinessOffers` over the same `eventIds`.

## Recommended Fix
1. Replace the separate aggregate queries with a single consolidated query using `.Include()` on events with their offers, challenges, likes, saves, and registrations. Use `AsSplitQuery()` to avoid cartesian explosion.
2. Alternatively, use raw SQL with CTEs or a single GROUP BY projection that returns all counts in one result set.
3. At minimum, merge the two redundant `BusinessOffers` queries (steps 5 and 7) into one.

## Scope
**Change:**
- `BusinessAnalyticsService.cs` only.

**Do not change:**
- `BusinessAnalyticsResponse` / `EventAnalyticsItem` DTOs (the response shape stays the same), migrations, controllers.

## Validation
- Unit test: assert `GetAnalyticsAsync` returns correct totals with seeded data.
- Integration test: call `/api/business/analytics` and assert response structure.
- Trace check: DB round-trip count drops from 7+ to ≤3.
- Manual: analytics page loads without visible delay.

## Risk
Low — purely internal query restructuring, no contract change. Risk of incorrect aggregates if Include navigation counts differ from explicit GROUP BY — validate with integration test.

## Priority
P2 medium

## Effort
Medium

## Suggested Agent Prompt
```
Task: Consolidate BusinessAnalyticsService.GetAnalyticsAsync (BusinessAnalyticsService.cs) from 7+ queries to ≤3.
Approach:
1. Load events with includes: _db.BusinessEvents.AsNoTracking().AsSplitQuery()
   .Include(e => e.Likes).Include(e => e.Saves).Include(e => e.Registrations)
   .Include(e => e.Offers).ThenInclude(o => o.Claims)
   .Include(e => e.Challenge).ThenInclude(c => c.Responses)
   .Where(e => e.BusinessPartnerId == partnerId)
   .ToListAsync()
2. Compute all aggregates in-memory from the loaded graph.
3. Keep the BusinessAnalyticsResponse / EventAnalyticsItem shape identical.
4. Remove all the separate aggregate queries (likeCounts, saveCounts, regCounts, offerIds, claimCounts, offersByEvent, challengeData, offerEventMap).
5. Do not change DTOs, migrations, or the controller.
6. Run: cd backend/ThirdWheel.API && dotnet build && ./scripts/run/test-backend.sh unit
```
