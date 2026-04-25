# AGENTS.md

Tool-neutral instructions for AI coding agents working in this repository. `AGENTS.md` is the source of truth; tool-specific files should link here instead of duplicating content.

## Product Summary

- Triad is a dating and social discovery product for singles, couples, and group-aware interactions.
- The backend still uses older `ThirdWheel` names; treat `Triad` and `ThirdWheel` as the same product.
- Core user flows include auth, rich profiles, couple linking, discovery, saved profiles, likes, matches, chat, notifications, events, safety, verification, and Impress Me.
- Operational flows include admin moderation/geography/business review and business partner onboarding, events, offers, challenges, rewards, and analytics.
- The backend is the source of truth for behavior, business rules, persistence, and API contracts.

## Architecture Summary

- `backend/ThirdWheel.API` is an ASP.NET Core 10 API using EF Core 10, PostgreSQL, JWT auth, SignalR, rate limiting, local uploads, OpenTelemetry, and Swagger/OpenAPI in development.
- `IOSNative/ThirdWheelNative` is the native SwiftUI iOS client.
- `android/` is the native Android client (Kotlin + Jetpack Compose) at full feature parity with the iOS client. See `docs/android/ios-parity-map.md`.
- `web/triad-web` is a responsive Next.js 16/React 19 consumer web client with route parity but some native-only media/realtime flows still incomplete.
- `web/triad-business` is a Next.js 16/React 19 business partner portal for onboarding, events, offers, challenges, analytics, and settings.
- `admin/nextjs-admin` plus `admin/Admin.Host` provide the active admin surface; root-level `admin/index.html`, `app.js`, and `styles.css` are older static admin files and need verification before use.

## Main Apps And Services

- API: `backend/ThirdWheel.API`, canonical contracts in `DTOs/`, entities in `Models/`, business logic in `Services/`, persistence in `Data/AppDbContext.cs`.
- iOS app: `IOSNative/ThirdWheelNative`, SwiftUI screens, `APIClient`, `SessionStore`, Keychain token storage, location permissions, app styling.
- Android app: `android/`, Kotlin + Jetpack Compose, `core/network/ApiClient`, `session/SessionStore`, EncryptedSharedPreferences token storage, accompanist-permissions location flow, `ui/theme/BrandStyle`. The iOS → Android parity table lives in `docs/android/ios-parity-map.md`.
- Consumer web: `web/triad-web`, App Router pages, feature screens, shared UI primitives, API client wrappers, PWA metadata.
- Business portal: `web/triad-business`, App Router auth/portal routes, React Query, API service wrappers.
- Admin: `admin/nextjs-admin` static export and `admin/Admin.Host` proxy/static host for `/api/*`.

## Important Folders And Files

- `README.md`: current setup, commands, architecture, endpoints, deployment notes.
- `Product.md`: product intent and feature descriptions.
- `backend/ThirdWheel.API/Program.cs`: service registration, auth, CORS, rate limit, OpenTelemetry, migrations, uploads, endpoints.
- `backend/ThirdWheel.API/AppConstants.cs`: business limits and roles.
- `backend/ThirdWheel.API/DTOs/*.cs`: API request/response contracts.
- `backend/ThirdWheel.API/Data/AppDbContext.cs`: EF DbSets, relationships, indexes, seeded business categories.
- `backend/ThirdWheel.API/Migrations/`: EF schema history. Edit only with deliberate schema work.
- `tests/`: backend unit and integration tests.
- `scripts/`: setup, Docker, test, iOS, and deploy automation.
- `docs/ai/`: compact AI context, file map, workflows, prompt library, hooks, and maintenance guidance.

## Commands

- Prereq check: `./scripts/setup/check-system.sh`
- API via Docker: `docker compose up -d --build api`
- Marketing site via Docker: `docker compose up -d --build triad-site`
- Admin via Docker: `docker compose up -d --build admin`
- Consumer web via Docker: `docker compose up -d --build web`
- Business portal via Docker: `docker compose up -d --build triad-business`
- Docker helper: `./scripts/docker.sh up`, `./scripts/docker.sh up triad-site`, `./scripts/docker.sh up admin`, `./scripts/docker.sh up web`, `./scripts/docker.sh up triad-business`, `./scripts/docker.sh logs`, `./scripts/docker.sh down`
- Marketing site local: `cd web/triad-site && npm install && npm run dev`
- Marketing site checks: `cd web/triad-site && npm run lint && npm run typecheck && npm run build`
- Backend tests: `./scripts/run/test-backend.sh unit`, `./scripts/run/test-backend.sh integration`, `./scripts/run/test-backend.sh all`
- Consumer web local: `cd web/triad-web && npm install && npm run dev`
- Consumer web checks: `cd web/triad-web && npm run lint && npm run typecheck && npm run build`
- Business portal local: `cd web/triad-business && npm install && npm run dev`
- Business portal checks: `cd web/triad-business && npm run lint && npm run typecheck && npm run build`
- Admin Next.js local: `cd admin/nextjs-admin && npm install && npm run dev`
- Admin build/export: `cd admin/nextjs-admin && npm run build`
- iOS simulator flow: `./scripts/mobile/run-ios.sh`
- Android emulator flow: `./scripts/mobile/run-android.sh`
- Android debug build (no install): `cd android && ./gradlew :app:assembleDebug -Ptriad.apiBaseUrl=http://10.0.2.2:5127`
- Android release artifacts: `./scripts/deploy/android-app.sh --release` (needs `ANDROID_KEYSTORE`, `ANDROID_KEY_ALIAS`, passwords)
- Deploy helpers: `./scripts/deploy/deploy.sh --all --prod`, `./scripts/deploy/deploy.sh --web --admin --business --preview`, `./scripts/deploy/deploy.sh --android --prod`
- Seed demo data: `pwsh -File seed.ps1` after confirming target API and destructive seed behavior.

## Coding Standards

- Prefer small, localized changes that follow existing patterns and subproject boundaries.
- Backend controllers should stay thin; business logic belongs in services and shared limits in `AppConstants.cs`.
- Preserve API contracts unless the task explicitly asks for a contract change; update all clients and tests when contracts change.
- Keep web API calls in `src/lib/api/client.ts` and `src/lib/api/services.ts`; keep mirrored types in `src/lib/types.ts`.
- Reuse existing UI primitives, providers, feature folders, `BrandStyle.swift`, `APIClient`, and `SessionStore`. The Android equivalents are `BrandStyle.kt`, `ApiClient.kt`, and `SessionStore.kt` under `android/app/src/main/java/com/triad/app/`.
- The Android app keeps the same package id (`com.triad.app`) and the same JSON contracts as iOS. Do not change one client's contract without mirroring it on the other and updating `docs/android/ios-parity-map.md`.
- Do not rename `ThirdWheel` namespaces, app IDs, routes, or EF migration history just to match Triad branding. The Android app intentionally uses `com.triad.app` instead.

## Triad Marketing Website Rules

- `web/triad-site` is the public marketing website only.
- Do not build product workflows in the marketing site.
- Do not expose admin links publicly.
- Use 21st.dev only for UI inspiration and component patterns.
- Use UI/UX Pro Max guidance for visual polish and UX consistency.
- Use Framer Motion only for subtle, meaningful animations.
- Keep copy App Store-safe and brand-safe.
- Keep mobile-first responsiveness.
- Preserve existing Triad theme if available.
- Do not change backend APIs unless explicitly asked.
- Marketing site Docker support lives in `web/triad-site/Dockerfile`, `docker-compose.yml`, `scripts/docker/docker.sh`, and `scripts/deploy/site-app.sh`.
- Keep marketing site deployment changes scoped to `triad-site` unless explicitly asked.

## Testing Expectations

- Run the narrowest relevant check first, then broaden when touching shared behavior.
- Backend logic changes usually need unit tests in `tests/ThirdWheel.API.UnitTests`.
- API workflow or contract changes usually need integration tests in `tests/ThirdWheel.API.IntegrationTests`.
- Web changes should run `npm run lint`, `npm run typecheck`, and, for route/build changes, `npm run build` in the touched app.
- iOS changes should use `./scripts/mobile/run-ios.sh` or the README `xcodebuild` command when practical.
- Android changes should run at minimum `cd android && ./gradlew :app:assembleDebug` and ideally `./scripts/mobile/run-android.sh` against an emulator. The Android module has no test suite yet — say so explicitly when leaving an Android change unverified.
- If a check cannot be run, report why and name the residual risk.

## Database And Seed Rules

- PostgreSQL is the production database; tests use in-memory SQLite helpers.
- Schema changes require EF migrations and `AppDbContextModelSnapshot` updates generated by EF tooling, plus relevant tests.
- Development startup auto-applies EF migrations; do not assume production does.
- `seed.ps1` is demo-data automation that deletes/recreates seed data and preserves one configured admin user; review env vars before running.
- Do not edit migrations, snapshots, or seed behavior as collateral for unrelated features.

## Security And Privacy Rules

- Required runtime secrets include `ConnectionStrings__DefaultConnection`, `Jwt__Key`, and deployment/Vercel/registry credentials.
- Keep CORS origin-locked outside development.
- User coordinates are intentionally rounded in EF precision for privacy; do not silently weaken that behavior.
- Treat auth, JWT, admin endpoints, safety/report/block behavior, media upload/delete, and verification flows as high-risk.
- Avoid logging tokens, passwords, media bytes, private profile details, precise coordinates, or admin bearer tokens.

## Git Workflow Rules

- Do not revert user changes or unrelated working tree changes.
- Do not edit generated files, lock files, deployment pipelines, package manager setup, env files, or migrations unless the task explicitly requires it.
- Keep commits/PRs scoped to one feature or fix.
- Summaries should include changed files, verification run, risks, and follow-up work.

## Token-Saving Rules

- Read `AGENTS.md`, then only the relevant `docs/ai/*` files for the task.
- Use `docs/ai/context.md` and `docs/ai/file-map.md` before scanning source.
- Prefer `rg` and targeted file reads over full tree dumps.
- Inspect only the app/service, contracts, tests, and scripts needed for the task.
- Avoid re-reading README/Product docs unless the task involves product or setup changes.
- Update `docs/ai/context.md` after major architecture, feature, or command changes so future agents do less scanning.

## Avoid Editing Unless Explicitly Requested

- `.env*`, `.env.docker`, `.env.deploy`, deployment credentials, signing profiles, certificates, and local machine config.
- `backend/ThirdWheel.API/Migrations/*` and `AppDbContextModelSnapshot.cs` outside schema tasks.
- `package-lock.json`, future lock files, package manager config, `NuGet.Config`, and project files outside dependency/tooling tasks.
- `android/gradle/libs.versions.toml`, `android/gradle/wrapper/gradle-wrapper.jar`, `android/gradlew`/`gradlew.bat`, and `android/gradle.properties` outside dependency/tooling tasks.
- Generated/build outputs: `.next/`, `bin/`, `obj/`, `DerivedData/`, `uploads/`, `.vercel/`, `.dotnet/` sentinel files, `android/.gradle/`, `android/app/build/`, `android/build/`, `dist/android/`.
- `docker-compose.yml`, Dockerfiles, deploy scripts, and CI/deployment config outside deployment tasks.
- `.claude/settings.local.json`; it is local Claude permissions, not shared project guidance.

## Before Coding Checklist

- Confirm the requested scope and affected surface.
- Read `docs/ai/context.md`, `docs/ai/file-map.md`, and any relevant source docs.
- Identify canonical contracts and mirrored client types before changing API behavior.
- Check existing tests and scripts for the narrowest useful verification.
- Check `git status --short` and preserve unrelated changes.

## Before PR Checklist

- Run relevant tests/builds/lint/type checks.
- Update mirrored client types and docs if contracts or workflows changed.
- Verify no secrets, generated files, env files, lock files, or unrelated refactors slipped in.
- Update `AGENTS.md` or `docs/ai/context.md` only when durable guidance/current state changed.
- Summarize changed files, verification, risk, and follow-up tasks.

## Known Risks And Open Questions

- Consumer web has TODOs for richer media management, audio/video playback/upload, couple-specific surfaces, and SignalR realtime chat.
- Verification backend is broader than currently surfaced in clients and uses mock/manual provider modes.
- Admin has both newer Next.js/Admin.Host and older static root files; verify active path before editing.
- Business portal appears MVP-level; production completeness for business auth, approval flows, analytics, and hosting configuration should be validated.
- `.env.docker` exists locally and is ignored; never inspect or document its real values.
- Some generated artifacts appear in the repository history; avoid touching them unless cleanup is explicitly requested.
