# PERF-013: React Query Has No staleTime on Heavy Read Queries

## Problem
The consumer web app (`web/triad-web`) uses React Query (`@tanstack/react-query`) for data fetching but does not configure `staleTime` on any query. The default `staleTime` is `0`, which means every time a component unmounts and remounts (e.g., navigating away and back), React Query immediately refetches the data — even if it was fetched seconds ago.

Heavy endpoints affected:
- `["discover", audience, token]` — refetches all discovery cards.
- `["matches"]` — refetches all matches.
- `["saved"]` — refetches all saved profiles.
- `["notifications"]` — refetches all notifications.

## Impact
- Navigating from Discover → Profile → back to Discover triggers a full discovery API call each time.
- On a slow mobile connection, users see a loading skeleton on every return visit.
- Redundant API calls increase DB load and exhaust the 120 req/min rate limit faster for power users.

## Evidence
- [discover-screen.tsx:33-37](web/triad-web/src/features/discover/discover-screen.tsx#L33-L37) — `useQuery` with no `staleTime`.
- [web/triad-web/src/lib/api/services.ts](web/triad-web/src/lib/api/services.ts) — no default query config.
- No `QueryClient` default `staleTime` configured in the app providers.

## Recommended Fix
Set a global default `staleTime` in the `QueryClient` configuration (e.g., 30 seconds) so navigating back to a recently-loaded screen reuses cached data:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
    },
  },
});
```

For the discovery feed, a shorter `staleTime` (5–10 s) may be more appropriate since new cards should appear after a period. For notifications, 15–30 s is reasonable.

## Scope
**Change:**
- The file that instantiates `QueryClient` in `web/triad-web` (likely `src/components/providers/` or `src/app/layout.tsx`).

**Do not change:**
- Individual query hooks, API services, backend code, `web/triad-business`.

## Validation
- Manual: navigate Discover → Profile → Discover; confirm no loading skeleton on return if < 30 s elapsed.
- Network tab: confirm no duplicate API request fires within the stale window.
- `npm run typecheck` and `npm run build` in `web/triad-web`.

## Risk
Minimal. Users may see data that is up to `staleTime` ms old. React Query still refetches in the background (stale-while-revalidate); the user sees fresh data within one refetch cycle. For the discovery feed, stale data means a user might see someone they already liked — acceptable since the like action removes them from the visible list client-side.

## Priority
P3 low

## Effort
Small

## Suggested Agent Prompt
```
Task: Set a global staleTime on the React Query QueryClient in web/triad-web.
1. Find where QueryClient is instantiated (likely src/components/providers/ or src/app/layout.tsx).
2. Add defaultOptions: { queries: { staleTime: 30_000 } } to the QueryClient constructor.
3. Optionally override staleTime per-query for discovery (staleTime: 10_000) and notifications (staleTime: 15_000).
4. Do not change API services, backend code, or web/triad-business.
5. Run: cd web/triad-web && npm run typecheck && npm run build
```
