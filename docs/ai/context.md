# AI Context

Current as of 2026-04-24. This file is a compact current-state map for future AI agents; prefer it over re-scanning the whole repo.

## What Exists Today

- ASP.NET Core 10 backend API in `backend/ThirdWheel.API`.
- Native SwiftUI iOS app in `IOSNative/ThirdWheelNative`.
- Native Android app in `android/` (Kotlin + Jetpack Compose). Full feature parity with iOS — see `docs/android/ios-parity-map.md`.
- Consumer Next.js web app in `web/triad-web`.
- Public marketing Next.js website in `web/triad-site`.
- Business partner Next.js portal in `web/triad-business`.
- Admin dashboard in `admin/nextjs-admin` with `admin/Admin.Host` for static hosting and API proxying.
- Backend unit/integration tests in `tests/`.
- Docker, local setup, iOS, Android, seed, and deployment scripts in `scripts/` plus `seed.ps1`. Mobile entrypoints: `scripts/mobile/run-ios.sh`, `scripts/mobile/run-android.sh`. Android cloud build: `scripts/deploy/android-app.sh`.

## What Works

- Email/password auth with JWT sessions.
- Profile create/read/update/delete, profile photos, audio bio, legacy video bio, ordered video highlights, interests, red flags, location/radius, and dating/lifestyle fields.
- Couple create/join/delete.
- Discovery by user type and distance, with blocking/action exclusions.
- Saved profiles, likes, matches, unmatch, REST messaging, and SignalR chat hub.
- In-app notifications.
- Safety block/unblock/report and anti-spam checks.
- Events and event interest toggling.
- Impress Me send, inbox, response, review, accept, and decline flows.
- Verification framework with attempt tracking and configured methods.
- Business partner profile, event, offer, challenge, reward, approval, audit, and analytics flows.
- Admin-safe user, online user, moderation, geography, and business review views.

## Incomplete Or Partial

- Consumer web intentionally has TODO banners for native-only media workflows, audio/video playback/upload, couple-specific surfaces, and web SignalR realtime.
- Verification provider integrations are mock/manual in config; client exposure is narrower than backend capability.
- Admin root static files are older; `admin/nextjs-admin` plus `Admin.Host` look like the current deployment path.
- Business portal is an MVP surface; production polish, auth/role edge cases, and complete analytics should be validated.
- There is no visible mobile test suite in the repo.

## Decisions Already Made

- Backend is canonical for contracts and behavior.
- Product branding is Triad, while code namespaces and app IDs may remain `ThirdWheel`.
- PostgreSQL is the runtime database; SQLite is used for backend tests.
- Development API startup auto-applies EF migrations.
- Uploaded media is stored locally under `uploads/` and served from `/uploads`.
- User coordinates use reduced precision in EF for privacy.
- Admin endpoints return admin-safe summaries rather than raw private profile data.
- Business category seed data lives in `AppDbContext`.

## Feature Map

- Consumer: auth, discover, profile, saved, matches/chat, Impress Me, events, notifications, safety, verification.
- Couple-aware: couple records, invite codes, couple discovery/matching/messaging behavior.
- Admin: users, online users, moderation analytics, geography analytics, business partner/content review, audit.
- Business: partner registration/onboarding, profile/logo, event CRUD/submission/images, offers, challenges, response review, winner selection, analytics.
- Operations: health check, OpenAPI/Swagger in development, Docker local stack, Vercel web/admin deployment helpers, backend container deployment helper.

## Data Model Summary

- Core users: `User`, `UserPhoto`, `UserVideo`, `UserInterest`, `UserRedFlag`, `Couple`.
- Social graph: `Like`, `SavedProfile`, `Match`, `Message`, `Block`, `Report`, `SpamWarning`.
- Events: `Event`, `EventInterest`.
- Impress Me: `ImpressMeSignal`, `ImpressMePrompt`, `ImpressMeResponse`.
- Notifications: `Notification`.
- Verification: `UserVerification`, `VerificationAttempt`, `VerificationEvent`.
- Business: `BusinessCategory`, `BusinessPartner`, `BusinessProfile`, `BusinessEvent`, `BusinessEventImage`, `BusinessOffer`, `EventChallenge`, `ChallengeResponse`, `EventLike`, `EventSave`, `EventRegistration`, `CouponClaim`, `RewardClaim`, `BusinessAuditLog`.

## API Summary

- Base REST prefix: `/api`.
- Core route families: `/auth`, `/profile`, `/couple`, `/discovery`, `/saved`, `/match`, `/message`, `/event`, `/safety`, `/notifications`, `/impress-me`, `/verifications`.
- Business route families: `/business`, `/business-events`, `/admin/business`.
- Admin route family: `/admin`.
- Realtime: `/hubs/chat`.
- Utility: `/health`, `/uploads/*`, `/swagger`, `/openapi/v1.json` in development.
- Canonical DTOs live in `backend/ThirdWheel.API/DTOs/`; clients mirror types in Swift models and web `src/lib/types.ts`.

## UI And Web Screens

- Consumer web routes: auth, discover, saved, matches, match chat, Impress Me, events, notifications, profile, profile edit, public profile detail.
- Consumer web structure: `src/app` for routes, `src/features` for screens, `src/components/ui` for primitives, `src/components/domain` for product widgets.
- Marketing site structure: `web/triad-site` is a standalone public Next.js app for brand-safe landing, features, business, safety, download, and contact/waitlist CTAs. It uses Framer Motion variants from `src/lib/animations.ts` and has Docker support through `web/triad-site/Dockerfile`, compose service `triad-site`, the Docker helper, and `scripts/deploy/site-app.sh`.
- Business portal routes: login/register, dashboard, onboarding, profile, events list/detail/new/edit/images/offers/challenge, offers, analytics, settings.
- Admin routes: dashboard, online users, moderation, geography, businesses, business events, offers, challenges, audit.

## Mobile Screens

- iOS app includes auth, root/session gate, discover, saved profiles, matches/chat, Impress Me inbox/respond/review, events, profile detail, and profile editing.
- Key iOS support files: `APIClient.swift`, `AppConfig.swift`, `SessionStore.swift`, `KeychainTokenStore.swift`, `LocationPermissionManager.swift`, `BrandStyle.swift`, `Models.swift`.
- Simulator defaults to `http://localhost:5127`; physical devices use `APIBaseURL` in `Info.plist`.
- Android app at `android/` ships the same screens (Auth, Root/MainScaffold, Discover, Saved, Matches, MatchChat, Impress Me inbox/respond/review, Events with nearby+all-events fallback, Notifications, Profile, ProfileDetail, ProfileEdit, CoupleLinkCard, ReportProfileSheet, VerificationVendorSheet).
- Key Android support files: `core/AppConfig.kt`, `core/network/ApiClient.kt`, `core/storage/TokenStore.kt`, `core/location/LocationPermissionState.kt`, `session/SessionStore.kt`, `ui/theme/BrandStyle.kt`, `data/Models.kt`, `data/Requests.kt`.
- Android emulator defaults to `http://10.0.2.2:5127` (host alias); override via `-Ptriad.apiBaseUrl=` Gradle property at build time. Backend URL is baked into `BuildConfig.API_BASE_URL` when the APK is built.

## Deployment Status

- Local Docker Compose runs API, marketing site, admin, consumer web, and business portal.
- API is containerized with `backend/ThirdWheel.API/Dockerfile`.
- Consumer web uses standalone Next output and Docker.
- Business portal uses standalone Next output and Docker through service `triad-business`.
- Admin Next.js static export is hosted by `Admin.Host` in Docker.
- Vercel scripts deploy `web/triad-web`, `web/triad-business`, and `admin/nextjs-admin`; backend and marketing site deploy scripts build/push OCI images and can run release hooks.
- Android artifacts are produced by `scripts/deploy/android-app.sh` (debug or release, APK and/or AAB, optional `ANDROID_RELEASE_COMMAND` for Play upload / Firebase App Distribution). The script does not push anywhere on its own.

## Known Gaps And Assumptions

- `README.md` is generally current and more detailed than this file.
- `plan.md` exists but should not be treated as durable architecture guidance without verification.
- `.claude/settings.local.json` is local permission config and is not the shared AI instruction source.
- Seed automation has destructive behavior and demo defaults; confirm environment before running.
- Do not assume production migrations, object storage, real verification vendors, or full mobile/web parity are complete.
