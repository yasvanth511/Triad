# PERF-010: No HTTP Caching Headers on Read-Heavy Endpoints

## Problem
The API returns no `Cache-Control`, `ETag`, or `Last-Modified` headers on read-heavy endpoints that serve relatively stable data (events list, business categories, public profile reads). Every client request — including repeated fetches from the same user on reconnect or page reload — hits the database.

There is also no server-side `IMemoryCache` or `IDistributedCache` usage anywhere. Business categories (seeded, rarely changing) are re-fetched from the DB on every request that needs them.

## Impact
- Repeated event list loads by many users hit the DB on every request.
- Browser/CDN cannot cache API responses; no conditional GET support.
- Business category data (9 static rows) is loaded from DB on every business onboarding request.
- On mobile, cached responses would reduce perceived latency and data usage significantly.

## Evidence
- [Program.cs](backend/ThirdWheel.API/Program.cs) — no `AddResponseCaching()`, no `UseResponseCaching()`, no `IMemoryCache` registration.
- [EventController.cs](backend/ThirdWheel.API/Controllers/EventController.cs) — no `[ResponseCache]` attribute.
- `AppDbContext.cs:291-301` — `BusinessCategory` is seeded static data queried on every business partner page load.

## Recommended Fix
1. **Lowest effort**: Register `IMemoryCache` (`builder.Services.AddMemoryCache()`) and inject it into `EventService` and the business categories query path. Cache events for 60 seconds; cache business categories for 10 minutes.
2. **HTTP caching**: Add `Cache-Control: public, max-age=60` to the public events endpoint via `[ResponseCache(Duration=60)]`. Add `ETag` support for profile reads using `IOutputCacheStore` (ASP.NET 7+ output cache) or manual ETag generation.
3. For private, user-specific endpoints (discovery, notifications): do not add public cache headers; only server-side caching is appropriate.

## Scope
**Change:**
- `Program.cs` — add `AddMemoryCache()` or `AddOutputCache()`.
- `EventService.cs` — inject `IMemoryCache`, wrap events list in a short TTL cache entry.
- Optionally `BusinessPartnerService.cs` — cache business categories.

**Do not change:**
- Auth-protected user-specific endpoints (discovery, matches, messages), migrations, client code.

## Validation
- Manual: load events endpoint twice; second request should not hit DB (trace confirms cache hit).
- Network check: response includes `Cache-Control` header with expected max-age.
- Unit test: assert `IMemoryCache` is called with the right key and TTL.

## Risk
Stale events visible to users for up to the TTL. Acceptable for a 60-second cache; tune TTL based on event update frequency. Admin cache-busting (on event create/update) should clear the cache key.

## Priority
P2 medium

## Effort
Small

## Suggested Agent Prompt
```
Task: Add IMemoryCache to cache the public events list in EventService.cs.
1. In Program.cs, add builder.Services.AddMemoryCache(); (if not already present).
2. In EventService.cs constructor, inject IMemoryCache _cache.
3. In GetEventsAsync, wrap the DB query with:
   const string cacheKey = "events:upcoming";
   if (!_cache.TryGetValue(cacheKey, out List<Event>? events))
   {
       events = await _db.Events...ToListAsync();
       _cache.Set(cacheKey, events, TimeSpan.FromSeconds(60));
   }
4. In CreateEventAsync and DeleteEventAsync, call _cache.Remove("events:upcoming").
5. Do not add caching to user-specific endpoints (discovery, matches, etc.).
6. Do not change DTOs, migrations, or client code.
7. Run: cd backend/ThirdWheel.API && dotnet build && ./scripts/run/test-backend.sh unit
```
