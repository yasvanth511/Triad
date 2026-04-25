# Performance Review — Triad

**Reviewed:** 2026-04-24  
**Scope:** backend API, consumer web, business portal, admin, data access, caching, uploads.  
**Author:** Claude Code performance analysis pass.

---

## Summary

The codebase is well-structured and has solid foundational indexes (added in `20260423000100_AddPerformanceIndexes`). OpenTelemetry tracing is in place. The main risk areas are:

1. **No pagination on high-volume admin and event endpoints** — full-table reads returned as a single response.
2. **Chatty DB access on write-hot paths** (like flow, notifications) — 8–13 sequential round-trips per action.
3. **Over-fetching on profile reads** — full relation graph loaded even for lightweight writes.
4. **No server-side caching** — every request hits the DB regardless of data volatility.
5. **Missing indexes** on `SpamWarnings.UserId` and `Block.BlockedUserId`.
6. **Local file serving** for all media — no CDN layer, no cache headers.
7. **Frontend staleTime = 0** — React Query refetches on every mount.

---

## Task Index

| ID | Title | Priority | Effort |
|----|-------|----------|--------|
| [PERF-001](PERF-001-admin-users-no-pagination.md) | Admin users list has no pagination | P1 high | Small |
| [PERF-002](PERF-002-discovery-double-db-hit.md) | Discovery runs two DB queries per request | P1 high | Small |
| [PERF-003](PERF-003-like-flow-chatty-db.md) | Like flow makes 8+ sequential DB round-trips | P1 high | Medium |
| [PERF-004](PERF-004-business-analytics-n-queries.md) | Business analytics runs 7+ separate queries | P2 medium | Medium |
| [PERF-005](PERF-005-events-no-pagination.md) | Events endpoint has no pagination or server-side geo filter | P2 medium | Small |
| [PERF-006](PERF-006-profile-over-fetching.md) | Profile service over-fetches relations on every read/write | P2 medium | Small |
| [PERF-007](PERF-007-notifications-two-queries.md) | GetNotificationsAsync issues two sequential queries | P2 medium | Small |
| [PERF-008](PERF-008-missing-spamwarnings-index.md) | SpamWarnings table has no index on UserId | P2 medium | Small |
| [PERF-009](PERF-009-missing-block-blockeduserid-index.md) | Block table lacks standalone index on BlockedUserId | P2 medium | Small |
| [PERF-010](PERF-010-no-response-caching.md) | No HTTP caching headers on read-heavy endpoints | P2 medium | Small |
| [PERF-011](PERF-011-uploads-no-cdn.md) | Profile media served from local disk through the API process | P2 medium | Large |
| [PERF-012](PERF-012-startup-full-user-scan.md) | Startup scans all users to fix photo/video sort orders | P3 low | Small |
| [PERF-013](PERF-013-frontend-query-staletime.md) | React Query has no staleTime on heavy read queries | P3 low | Small |
| [PERF-014](PERF-014-message-spam-content-scan.md) | Anti-spam repeated message check performs content string scan | P3 low | Small |

---

## Priority Table

### P1 — Critical path, highest user impact
| Task | Why it is P1 |
|------|-------------|
| PERF-001 | Admin list becomes unusable at scale; blocks DB connection pool |
| PERF-002 | Every discovery session fires 2 expensive correlated-subquery plans |
| PERF-003 | Like/match action has 10+ DB round-trips; slows the most-used social action |

### P2 — Meaningful scalability or latency improvement
| Task | Why it is P2 |
|------|-------------|
| PERF-004 | Analytics page slowness directly affects business partner experience |
| PERF-005 | Event list grows unbounded; in-memory geo filter is wasteful |
| PERF-006 | Profile over-fetching multiplies DB work on every profile view |
| PERF-007 | Notification poll is double the necessary DB work |
| PERF-008 | SpamWarning table scan on every message send |
| PERF-009 | Block OR query may fall back to seq scan for blocked-side |
| PERF-010 | No caching means static data re-fetched from DB constantly |
| PERF-011 | All media through API process; no CDN edge; risk of media loss on restart |

### P3 — Developer experience and low-traffic optimisation
| Task | Why it is P3 |
|------|-------------|
| PERF-012 | Startup slowness only in development; no production impact |
| PERF-013 | Redundant refetches add latency on client navigation |
| PERF-014 | Content string scan bounded by SenderId index; lower severity |

---

## Recommended Implementation Order

1. **PERF-008** — Index migration (SpamWarnings). Tiny, zero risk, immediate DB gain.
2. **PERF-009** — Index migration (Block). Same as above.
3. **PERF-001** — Admin pagination. Prevents admin becoming unusable; low risk.
4. **PERF-002** — Discovery single query. High-frequency path, small change.
5. **PERF-007** — Notifications parallel queries. Small, safe.
6. **PERF-005** — Events pagination. Small change to service + controller.
7. **PERF-010** — Add IMemoryCache for events. Small, no schema change.
8. **PERF-006** — Profile over-fetching. Reduces load on most-read endpoint.
9. **PERF-012** — Replace startup loop with SQL. Low risk, improves dev experience.
10. **PERF-013** — React Query staleTime. Tiny frontend change.
11. **PERF-014** — Anti-spam hash cache. Small; no schema change.
12. **PERF-003** — Like flow batching. Medium; test carefully.
13. **PERF-004** — Analytics query consolidation. Medium; validate aggregates.
14. **PERF-011** — CDN/blob storage migration. Large; plan separately.

---

## Cross-Cutting Risks

- **EF Core DbContext is not thread-safe.** Any parallel query approach (PERF-007) must use separate scoped contexts or `IDbContextFactory`.
- **Cache invalidation.** PERF-010 and PERF-014 introduce caches; ensure write paths bust the relevant cache keys.
- **Migration safety.** PERF-008 and PERF-009 add indexes. Always test on a staging DB first. Indexes on large tables can lock briefly during creation (use `CONCURRENTLY` in raw SQL if needed).
- **Admin client compatibility.** PERF-001 changes the admin list response shape from a flat array to a paginated envelope — verify `admin/nextjs-admin` before shipping.
- **Rate limit interaction.** PERF-013 reduces frontend API calls; ensure the rate limiter doesn't penalise legitimate background refetches.

---

## Areas Not Analysed

- **iOS native client** (`IOSNative/ThirdWheelNative`) — Swift network calls and caching are out of scope for this pass.
- **SignalR/ChatHub** — realtime performance was not profiled; ChatHub connection scaling may need separate review.
- **`admin/nextjs-admin`** — static export admin pages were not deeply inspected for rendering performance.
- **`web/triad-site`** — marketing site is Next.js SSG/SSR; no performance concerns identified at current scale.
- **DB query plan analysis** — `EXPLAIN ANALYZE` output was not available; recommendations are based on schema and query patterns.

---

## How to Use These Tasks

Each file in this folder is a self-contained task. To implement a task:

1. Read the **Evidence** section — it links to specific files and lines.
2. Run the **Suggested Agent Prompt** as a new Claude/Codex prompt to implement only that task.
3. Follow the **Validation** steps to confirm the change worked.
4. Check the **Risk** section before merging.

Do not implement multiple tasks in one prompt — each is designed to be applied independently in isolation.
