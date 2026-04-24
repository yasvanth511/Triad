# CLAUDE.md

## Project Overview

- `Triad` is a dating and social discovery product with support for singles, couples, and group-aware interactions.
- Product branding is `Triad`, but core code still uses older `ThirdWheel` names. Treat them as the same product.
- The backend is the source of truth for product behavior and data contracts.
- Main active surfaces in this repo:
  - consumer API
  - native iOS app
  - consumer web app
  - admin dashboards

## Subprojects

- `backend/ThirdWheel.API`
  - Canonical business logic and API surface.
  - Owns auth, profiles, couples, discovery, saved profiles, matches, messaging, events, safety, notifications, Impress Me, verification, and admin endpoints.
- `web/triad-web`
  - Consumer-facing responsive web app.
  - Mirrors the iOS product flows against the existing API.
- `IOSNative/ThirdWheelNative`
  - SwiftUI iOS client.
  - Uses Keychain-backed auth and native location permission flow.
- `admin/nextjs-admin`
  - Next.js admin UI.
  - Static-export oriented and used by deploy scripts for Vercel/admin hosting.
- `admin/Admin.Host`
  - ASP.NET Core host that serves admin static files and proxies `/api/*` to the backend.
- `admin/index.html`, `admin/app.js`, `admin/styles.css`
  - Older static admin shell. Verify before use.
- `tests/`
  - Backend unit and integration tests only.
- `scripts/`
  - Docker, test, iOS, and deploy automation.
- `seed.ps1`
  - Seeds demo data via admin/API endpoints.

## Stack

- Backend
  - ASP.NET Core 10
  - EF Core 10 + Npgsql/PostgreSQL
  - JWT bearer auth
  - SignalR
  - OpenTelemetry
  - ImageSharp
  - Swagger/OpenAPI in development
- Web
  - Next.js 16 App Router
  - React 19
  - TypeScript
  - Tailwind CSS 4
  - TanStack Query
  - react-hook-form + zod
  - sonner
- iOS
  - SwiftUI
  - URLSession
  - Security/Keychain
  - CoreLocation
- Admin
  - Next.js 14 + React 18 + Tailwind 3 in `admin/nextjs-admin`
  - ASP.NET Core 10 host in `admin/Admin.Host`
- Tests
  - xUnit
  - ASP.NET Core `WebApplicationFactory`
  - SQLite test databases

## Repo Structure

- `backend/ThirdWheel.API/`
  - `Controllers/` thin HTTP layer
  - `Services/` business logic
  - `DTOs/Dtos.cs` canonical API request/response shapes
  - `Models/` EF entities
  - `Data/AppDbContext.cs` schema relationships and indexes
  - `Helpers/` mappers and utilities
  - `Migrations/` EF schema history
- `web/triad-web/src/`
  - `app/` routes and app shell
  - `features/` screen-level feature modules
  - `components/ui/` reusable primitives
  - `components/domain/` product-specific display components
  - `lib/api/` HTTP client and endpoint wrappers
  - `lib/types.ts` web-side API mirrors
- `IOSNative/ThirdWheelNative/`
  - native screens, models, session storage, API client, brand styles
- `admin/nextjs-admin/src/`
  - admin pages, components, and simple API wrappers
- `tests/`
  - `ThirdWheel.API.UnitTests`
  - `ThirdWheel.API.IntegrationTests`
  - shared test helpers in `ThirdWheel.API.TestCommon`

## Common Commands

- Setup
  - `cp .env.docker.example .env.docker`
  - `./scripts/setup/check-system.sh`
- Local Docker stack
  - `docker compose up -d --build api`
  - `docker compose up -d --build admin`
  - `docker compose up -d --build web`
  - `./scripts/docker.sh up`
  - `./scripts/docker.sh up admin`
  - `./scripts/docker.sh up web`
  - `./scripts/docker.sh logs`
  - `./scripts/docker.sh down`
- Backend tests
  - `./scripts/run/test-backend.sh unit`
  - `./scripts/run/test-backend.sh integration`
  - `./scripts/run/test-backend.sh all`
- iOS
  - `./scripts/mobile/run-ios.sh`
  - `xcodebuild ...` manual simulator build from repo README, verify before use
- Web app
  - `cd web/triad-web && npm install`
  - `cd web/triad-web && npm run dev`
  - `cd web/triad-web && npm run build`
  - `cd web/triad-web && npm run lint`
  - `cd web/triad-web && npm run typecheck`
- Admin Next.js app
  - `cd admin/nextjs-admin && npm install`
  - `cd admin/nextjs-admin && npm run dev`
  - `cd admin/nextjs-admin && npm run build`
  - `cd admin/nextjs-admin && npm run deploy`
- Deploy helpers
  - `./scripts/deploy/deploy.sh --all --prod`
  - `./scripts/deploy/deploy.sh --web --admin --preview`
  - `./scripts/deploy/backend-api.sh`
  - `./scripts/deploy/web-app.sh`
  - `./scripts/deploy/admin-app.sh`
- Seed data
  - `pwsh -File seed.ps1`

## Architecture Rules

- Treat `backend/ThirdWheel.API` as the source of truth.
- Preserve the controller -> service -> mapper split already used in the backend.
- Keep business rules in services or `AppConstants.cs`, not scattered through controllers or clients.
- Treat `backend/ThirdWheel.API/DTOs/Dtos.cs` as the canonical contract definition.
- Keep web and iOS contract mirrors aligned with backend DTO changes.
- Keep admin functionality behind `/api/admin/*`.
- Do not mix consumer UI concerns into admin surfaces.
- `admin/nextjs-admin` and `admin/Admin.Host` are paired for deployment; root-level static admin files look secondary. Verify before use.
- Development backend startup auto-applies EF migrations.
- Schema changes should include real EF migrations and relevant tests.

## Coding Conventions

- C#
  - File-scoped namespaces, `record` DTOs, constructor injection, async service methods.
  - Controllers usually translate domain exceptions into HTTP responses with `{ error: ... }`.
  - `BaseController` owns authenticated user ID extraction.
- React/TypeScript
  - Centralize HTTP in `src/lib/api/client.ts` and `src/lib/api/services.ts`.
  - Use TanStack Query for server state and a provider for session state.
  - Reuse `components/ui/*` before adding one-off UI patterns.
  - Feature screens live under `src/features/*`.
- Swift
  - Reuse `APIClient`, `SessionStore`, `KeychainTokenStore`, and `BrandStyle`.
  - Keep native permission/device logic in dedicated managers instead of spreading it through views.

## UI/UX and Theme Conventions

- Consumer surfaces use the Triad brand language:
  - soft glass panels
  - large rounded corners
  - violet/pink accent palette
  - gradient/radial atmospheric backgrounds
- Web consumer app theme is defined through CSS variables in `web/triad-web/src/app/globals.css`.
- Web typography uses `Fraunces` for display and `Plus Jakarta Sans` for body.
- Reuse existing utility classes like `glass-panel`, `screen-wrap`, and shared button variants.
- Admin UI intentionally uses a separate utilitarian theme:
  - navy sidebar
  - lighter flat panels
  - analytics/dashboard styling
- Keep admin styling visually distinct from the consumer app.
- iOS brand styles live in `IOSNative/ThirdWheelNative/BrandStyle.swift`; preserve parity with consumer web where practical.

## API/Data Contract Rules

- Canonical backend contracts live in:
  - `backend/ThirdWheel.API/DTOs/Dtos.cs`
  - `backend/ThirdWheel.API/AppConstants.cs`
- Clients already depend on current route families:
  - `/api/auth/*`
  - `/api/profile*`
  - `/api/discovery`
  - `/api/saved*`
  - `/api/match*`
  - `/api/message*`
  - `/api/event*`
  - `/api/safety*`
  - `/api/notifications*`
  - `/api/impress-me*`
  - `/api/verifications`
  - `/api/admin/*`
- Keep changes additive and backward-compatible unless explicitly asked otherwise.
- Be careful with:
  - auth response shape: `{ token, user }`
  - GUID-based routes
  - media upload endpoints
  - notification payloads
  - verification method state
- User coordinates are intentionally rounded to 2 decimals for privacy. Do not silently change that behavior.
- Verification methods are config-driven; UI may expose only a subset of backend capability.

## Guardrails

- Do not casually rename `ThirdWheel` namespaces, app IDs, or routes even if product branding says `Triad`.
- Do not change public API contracts unless explicitly asked.
- Do not change iOS, admin, or web behavior as collateral when the task is scoped to one surface.
- Do not commit real secrets.
  - Prefer env vars over checked-in config.
  - Treat `appsettings.Development.json` values as local/dev only.
- Be cautious in these areas:
  - EF migrations and model snapshots
  - auth/token issuance
  - SignalR/chat behavior
  - media upload/delete flows
  - safety/report/block semantics
  - seed/admin-only endpoints
- Avoid rewriting stable UI shells when a localized change will do.
- Ignore `plan.md` for durable architecture guidance unless explicitly asked; verify before use.

## Working Style for Claude Code

- Reuse existing patterns first.
- Make minimal, targeted changes.
- Avoid unnecessary rewrites or large refactors.
- Preserve API contracts unless explicitly asked to change them.
- Update mirrored client types only when contract changes require it.
- Respect subproject boundaries and avoid touching unrelated apps.
- Prefer existing scripts over inventing new local workflows.
- Run the narrowest relevant verification for the files you changed.
- After edits, summarize:
  - changed files
  - user-visible impact
  - risks or follow-up checks
- If verification could not be run, say so clearly.
