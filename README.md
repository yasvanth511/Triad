# Triad

Triad is a dating and social discovery product built around singles, couples, and group-aware interactions. This repo currently contains the backend API, native iOS and Android clients, a public marketing website, a lightweight admin dashboard for moderation and analytics, and a business partner portal.

The product name is `Triad`, while parts of the codebase still use the older `ThirdWheel` namespace and app names. When you see `ThirdWheel.API` or `ThirdWheelNative`, they are part of the same product.

## Current Repo State

The active surfaces in this repository are:

- `backend/ThirdWheel.API`: ASP.NET Core 10 API with PostgreSQL, JWT auth, SignalR chat, local media storage, rate limiting, and OpenTelemetry
- `IOSNative/ThirdWheelNative`: native SwiftUI iOS app
- `android/`: native Android app (Kotlin + Jetpack Compose) at full feature parity with the iOS client; see [`docs/android/ios-parity-map.md`](docs/android/ios-parity-map.md)
- `admin/`: Next.js admin dashboard shell for user, moderation, geography, and business review views backed by `/api/admin/*`
- `web/triad-site`: public marketing website for brand, feature, safety, download, and partner CTAs
- `web/triad-web`: consumer-facing Next.js web app that mirrors the native product flows for desktop, tablet, and mobile web
- `web/triad-business`: business partner portal for onboarding, event/offer/challenge management, analytics, and settings

The backend is the source of truth for product behavior. iOS and Android are the production end-user clients.

## Repo Layout

```text
Triad/
├── admin/                         # Static admin dashboard shell
├── android/                       # Native Android app (Kotlin + Compose)
├── backend/ThirdWheel.API/        # ASP.NET Core API
├── IOSNative/                     # Native SwiftUI app + Xcode project
├── web/triad-business/            # Business partner Next.js portal
├── web/triad-site/                # Public marketing website
├── web/triad-web/                 # Consumer Next.js web app
├── scripts/
│   ├── common/                    # Shared shell helpers
│   ├── docker/docker.sh           # Docker helper commands
│   ├── mobile/run-ios.sh          # Build API + iOS simulator app
│   ├── mobile/run-android.sh      # Build API + Android emulator app
│   ├── deploy/                    # Container, Vercel, and Android deploys
│   ├── run/test-backend.sh        # Backend test runner
│   └── setup/check-system.sh      # Local prerequisite check
├── tests/                         # Unit + integration tests
├── docker-compose.yml             # Local API container
├── docs/android/                  # Android parity + deploy notes
├── Product.md                     # Product overview and positioning
└── seed.ps1                       # Demo data seeding
```

## What Exists Today

Triad currently supports:

- email/password registration and login with JWT sessions
- rich single-user profiles with photos, audio bio, legacy video bio, ordered video highlights, interests, red flags, and lifestyle fields
- couple creation and join flows with invite codes
- discovery filtering for singles, couples, and distance-aware browsing
- saving profiles for later
- likes, matches, unmatch, and chat
- group-aware chat behavior when a couple is involved in a match
- in-app notifications for likes, matches, messages, and Impress Me activity
- safety tools including block, unblock, report, and anti-spam checks
- event browsing and interest toggling
- Impress Me prompt-response flows before or after a match
- a verification framework with attempt tracking, status history, expiry handling, and trust badges
- admin-safe user, moderation, geography, and business review views via `/api/admin/*`
- business partner onboarding, approval, events, offers, private challenge responses, reward issuance, and aggregate analytics

## Quick Start

### 1. Create Local Docker Env

```bash
cp .env.docker.example .env.docker
```

Update `.env.docker` with a working PostgreSQL connection string and a JWT key that is at least 32 characters long.

### 2. Check Local Prerequisites

```bash
./scripts/setup/check-system.sh
```

This checks for `curl`, `docker`, `open`, `xcodebuild`, `xcrun`, `dotnet`, and the presence of `.env.docker`.

### 3. Start The API

```bash
docker compose up -d --build api
```

Useful local URLs:

- `http://localhost:5127/health`
- `http://localhost:5127/swagger`
- `http://localhost:5127/openapi/v1.json`

Swagger and OpenAPI are only enabled in development.

### 4. Start The Admin Dashboard

```bash
docker compose up -d --build admin
```

Useful local URL:

- `http://localhost:5173`

### 5. Start The Consumer Web App

```bash
docker compose up -d --build web
```

Useful local URL:

- `http://localhost:3000`

The web container reads `WEB_PUBLIC_API_ORIGIN` at build time so browser traffic points at the correct API origin.

### 6. Start The Business Partner Portal

```bash
docker compose up -d --build triad-business
```

Useful local URL:

- `http://localhost:3002`

The business container reads `BUSINESS_PUBLIC_API_ORIGIN` at build time so browser traffic points at the correct API origin.

For local npm development instead of Docker:

```bash
cd web/triad-business
npm install
npm run dev
```

### 7. Start The Marketing Website

```bash
docker compose up -d --build triad-site
```

Useful local URL:

- `http://localhost:3003`

The marketing container reads `SITE_PUBLIC_*` values at build time for web app, business portal, store, and contact links.

For local npm development instead of Docker:

```bash
cd web/triad-site
npm install
npm run dev
```

### 8. Run The Native iOS App

```bash
./scripts/mobile/run-ios.sh
```

That script:

1. rebuilds and redeploys the Docker API
2. waits for `http://localhost:5127/health`
3. boots or reuses an iOS simulator
4. builds `ThirdWheelNative`
5. installs and launches the app

Useful overrides:

```bash
SIMULATOR_NAME="iPhone 16 Pro" ./scripts/mobile/run-ios.sh
SIMULATOR_UDID="YOUR-SIM-UDID" ./scripts/mobile/run-ios.sh
API_PORT=5127 ./scripts/mobile/run-ios.sh
```

### 9. Run The Native Android App

```bash
./scripts/mobile/run-android.sh
```

That script:

1. resolves `ANDROID_HOME` and `JAVA_HOME` (defaulting to the JDK that ships with Android Studio)
2. rebuilds and redeploys the Docker API
3. waits for `http://localhost:5127/health`
4. picks up the first online emulator/device or boots the named AVD (default `Pixel_7`)
5. runs `:app:installDebug` with `-Ptriad.apiBaseUrl=$TRIAD_API_BASE_URL`
6. launches `com.triad.app/.MainActivity`

Useful overrides:

```bash
ANDROID_AVD="Pixel_8_Pro" ./scripts/mobile/run-android.sh
ANDROID_SERIAL="emulator-5554" ./scripts/mobile/run-android.sh
TRIAD_API_BASE_URL="http://192.168.1.50:5127" ./scripts/mobile/run-android.sh
SKIP_API_DEPLOY=1 ./scripts/mobile/run-android.sh
```

The default API base URL is `http://10.0.2.2:5127` (the emulator's alias for the
host machine). Use `TRIAD_API_BASE_URL` for physical devices on the same LAN.

First-time setup: open `android/` in Android Studio Koala+ once so it generates
the Gradle wrapper, or run `gradle wrapper --gradle-version 8.10.2` from inside
`android/`. After that the wrapper is checked in and `./gradlew` works on its
own. Detailed Android docs live in [`android/README.md`](android/README.md).

## Day-To-Day Workflows

### Backend Tests

```bash
./scripts/run/test-backend.sh unit
./scripts/run/test-backend.sh integration
./scripts/run/test-backend.sh all
```

The test runner uses local `dotnet` when available and falls back to Docker with the .NET 10 SDK image.

### API-Only Development

```bash
./scripts/docker/docker.sh up
./scripts/docker/docker.sh up admin
./scripts/docker/docker.sh up web
./scripts/docker/docker.sh up triad-business
./scripts/docker/docker.sh up triad-site
./scripts/docker/docker.sh logs
./scripts/docker/docker.sh logs web
./scripts/docker/docker.sh logs triad-business
./scripts/docker/docker.sh logs triad-site
./scripts/docker/docker.sh rebuild
./scripts/docker/docker.sh rebuild web
./scripts/docker/docker.sh rebuild triad-business
./scripts/docker/docker.sh rebuild triad-site
./scripts/docker/docker.sh down
```

### Quick Deploy Helpers

```bash
./scripts/run/quick-build-deploy.sh --backend --site --admin --web --business
./scripts/run/quick-build-deploy.sh --site
./scripts/run/quick-build-deploy.sh --web
./scripts/run/quick-build-deploy.sh --business
./scripts/run/quick-build-deploy.sh --android
./redeploy.sh
```

`redeploy.sh` defaults to the Docker-backed backend + marketing site + admin + web + business stack plus the iOS simulator and Android emulator flows. On Windows, `redeploy.ps1 android` invokes `./gradlew :app:installDebug` against the connected emulator/device — Docker is not used.

## Cloud Deployment

This repo now includes deploy scripts for the active deployable surfaces:

- `./scripts/deploy/backend-api.sh`: builds the ASP.NET API container, pushes it to your OCI registry, and can run a release hook
- `./scripts/deploy/site-app.sh`: builds the public marketing site container, pushes it to your OCI registry, and can run a release hook
- `./scripts/deploy/web-app.sh`: deploys `web/triad-web` to Vercel
- `./scripts/deploy/admin-app.sh`: deploys `admin/nextjs-admin` to Vercel and generates the `/api/*` rewrite needed by the static export
- `./scripts/deploy/business-app.sh`: deploys `web/triad-business` to Vercel
- `./scripts/deploy/android-app.sh`: builds the signed Android APK and Play AAB, drops them under `dist/android/`, and can run a release hook (Play upload, Firebase App Distribution, etc.)
- `./scripts/deploy/deploy.sh`: runs the full sequence for backend + marketing site + web + admin + business; pass `--android` (or `--all`) to also build the Android artifacts

Start from the example env file:

```bash
cp scripts/deploy/deploy.env.example .env.deploy
```

Then export the values you need, for example:

```bash
set -a
source .env.deploy
set +a
```

Production deploy (everything including a signed Android release build):

```bash
./scripts/deploy/deploy.sh --all --prod
```

Preview deploy for the Vercel apps and marketing site image:

```bash
./scripts/deploy/deploy.sh --site --web --admin --business --preview
```

Just the Android artifacts:

```bash
./scripts/deploy/deploy.sh --android --prod   # signed release APK + AAB
./scripts/deploy/deploy.sh --android --preview # debug build for sideloading / QA
```

Or call the script directly with finer control:

```bash
./scripts/deploy/android-app.sh --release --bundle-only --api-base https://api.example.com
```

Notes:

- The backend API and public marketing site are deployed as containers in this setup. The consumer web, admin, and business apps still use the Vercel scripts unless you explicitly change them.
- The Android script produces local artifacts in `dist/android/` and never pushes anywhere on its own. Wire `ANDROID_RELEASE_COMMAND` (e.g. `fastlane supply --aab "$TRIAD_ANDROID_AAB" --track internal`) to actually publish.
- For a signed release Android build set `ANDROID_KEYSTORE`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, and (optionally) `ANDROID_KEY_PASSWORD` in `.env.deploy`. Without those, the script will warn and Gradle may produce only an unsigned `app-release-unsigned.apk`.
- If `web/triad-web`, `admin/nextjs-admin`, or `web/triad-business` are not linked to Vercel yet, set `TRIAD_WEB_VERCEL_PROJECT`, `TRIAD_ADMIN_VERCEL_PROJECT`, `TRIAD_BUSINESS_VERCEL_PROJECT`, and optionally `TRIAD_VERCEL_SCOPE`. The scripts will run `vercel link --yes` for you.
- `BACKEND_RELEASE_COMMAND` is intentionally provider-agnostic. Use it to trigger your host-specific rollout after the image push succeeds. `ANDROID_RELEASE_COMMAND` follows the same pattern.

### Native iOS Build Only

```bash
xcodebuild \
  -project IOSNative/ThirdWheelNative.xcodeproj \
  -scheme ThirdWheelNative \
  -destination 'platform=iOS Simulator,id=YOUR-UDID' \
  -derivedDataPath /tmp/Triad/ios-build \
  CODE_SIGNING_ALLOWED=NO \
  build
```

Then install and launch:

```bash
xcrun simctl install booted /tmp/Triad/ios-build/Build/Products/Debug-iphonesimulator/ThirdWheelNative.app
xcrun simctl launch booted com.thirdwheel.iosnative
```

### Native Android Build Only

```bash
cd android
./gradlew :app:assembleDebug -Ptriad.apiBaseUrl=http://10.0.2.2:5127
```

Install on a running emulator/device:

```bash
./gradlew :app:installDebug
adb shell am start -n com.triad.app/.MainActivity
```

Release build (signed) and Play AAB:

```bash
./gradlew :app:assembleRelease :app:bundleRelease \
  -Ptriad.apiBaseUrl=https://api.example.com \
  -Ptriad.signing.storeFile="$HOME/keys/triad.jks" \
  -Ptriad.signing.storePassword="$ANDROID_KEYSTORE_PASSWORD" \
  -Ptriad.signing.keyAlias="$ANDROID_KEY_ALIAS" \
  -Ptriad.signing.keyPassword="$ANDROID_KEY_PASSWORD"
```

### Demo Data

Run from the repo root:

```powershell
.\seed.ps1
```

The current seed flow:

- preserves `yasvanth@live.in`
- deletes other users and old seeded events
- creates demo singles and couples
- creates events
- seeds likes and matches for the preserved demo user

## Current Architecture

### Backend

| Area | Tech |
|---|---|
| API | ASP.NET Core 10 |
| ORM | Entity Framework Core 10 |
| Database | PostgreSQL via Npgsql |
| Auth | JWT bearer tokens |
| Realtime | SignalR |
| Media processing | SixLabors.ImageSharp |
| API docs | OpenAPI + Swagger UI in development |
| Observability | OpenTelemetry logs, traces, and metrics |

Important backend areas:

| Path | Purpose |
|---|---|
| `Controllers/` | HTTP endpoints |
| `Services/` | business logic |
| `Models/` | EF Core entities |
| `DTOs/` | request and response contracts |
| `Data/` | `AppDbContext` and persistence |
| `Hubs/` | SignalR chat hub |
| `Helpers/` | mapping, geo, and media helpers |
| `Migrations/` | schema history |

### Native iOS

The SwiftUI app currently includes:

- auth and session persistence through Keychain
- Discover, Saved, Matches, Impress Me, and Events destinations
- top-right notifications and profile access
- dedicated profile viewing and editing flows
- media upload flows for photos, audio bio, and ordered profile videos
- public profile detail views from multiple entry points
- verification badge loading and start flows for the currently surfaced methods

Key app files:

| Path | Purpose |
|---|---|
| `ThirdWheelNativeApp.swift` | app entry |
| `RootView.swift` | session gate, nav shell, badges |
| `SessionStore.swift` | auth, session, and API coordination |
| `AuthView.swift` | sign in and registration |
| `DiscoverView.swift` | discovery feed |
| `SavedProfilesView.swift` | saved profiles |
| `MatchesView.swift` | matches and chat |
| `ImpressMeView.swift` | inbox and action flow |
| `EventsView.swift` | event browsing |
| `ProfileView.swift` | profile display and editing |

### Native Android

The Kotlin + Jetpack Compose app at `android/` ships at full feature parity
with the iOS client (auth, discover, saved, matches, chat, Impress Me,
events, profile / detail / edit, couple link, verifications, safety, and the
brand styling). The full iOS → Android mapping lives in
[`docs/android/ios-parity-map.md`](docs/android/ios-parity-map.md).

| Path | Purpose |
|---|---|
| `android/app/build.gradle.kts` | module config — `BuildConfig.API_BASE_URL` is sourced from `-Ptriad.apiBaseUrl` |
| `app/src/main/java/com/triad/app/TriadApplication.kt` | DI graph (AppConfig, ApiClient, SessionStore, TokenStore) |
| `app/src/main/java/com/triad/app/core/network/ApiClient.kt` | OkHttp + kotlinx.serialization HTTP client |
| `app/src/main/java/com/triad/app/session/SessionStore.kt` | mirror of iOS `SessionStore` — every session API call lives here |
| `app/src/main/java/com/triad/app/ui/` | Compose screens grouped by feature |
| `app/src/main/java/com/triad/app/ui/theme/BrandStyle.kt` | brand palette, gradients, `Modifier.triadCard()` |
| `android/README.md` | Android setup, configuration, run, and release notes |

### Admin Surface

`admin/` is a lightweight Next.js dashboard shell. It reads from admin-safe endpoints and currently focuses on:

- user list summaries
- online user summaries
- geography analytics
- moderation analytics
- pending business partner approvals
- pending business event, offer, and challenge approvals
- business audit history

It is useful for internal demos and operations, but it is not a full production admin product yet.
When started through Docker, the admin container serves the static dashboard and proxies `/api/*` requests to the `api` service.
For the business review pages, paste an admin JWT into the header token field. The dashboard stores it in `localStorage` under `triad.admin.token` and sends it as a bearer token on `/api/admin/business/*` requests.

### Consumer Web Surface

`web/triad-web/` is the responsive consumer-facing web app. It uses:

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Docker multi-stage builds with Next standalone output

When started through Docker, it serves the consumer product on port `3000` by default.

### Marketing Web Surface

`web/triad-site/` is the public marketing website. It uses:

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Docker multi-stage builds with Next standalone output

When started through Docker, it serves the marketing site on port `3003` by default.

### Business Partner Web Surface

`web/triad-business/` is the business partner portal. It uses:

- Next.js App Router
- React + TypeScript
- React Query
- the same API origin contract exposed through `NEXT_PUBLIC_API_ORIGIN`
- Docker multi-stage builds with Next standalone output

When started through Docker, it serves the business portal on port `3002` by default.

The current MVP routes cover:

- login and business registration
- onboarding and profile management
- event creation, editing, submission, and image uploads
- event-level offers
- optional event challenges, response review, and winner selection
- aggregate analytics and business settings

## API And Realtime Surface

Base REST prefix: `/api`

### Core Endpoints

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Profile | `GET /api/profile`, `GET /api/profile/{userId}`, `PUT /api/profile`, `DELETE /api/profile` |
| Profile media | `POST /api/profile/photos`, `DELETE /api/profile/photos/{photoId}`, `POST /api/profile/audio-bio`, `DELETE /api/profile/audio-bio`, `POST /api/profile/video-bio`, `DELETE /api/profile/video-bio`, `POST /api/profile/videos`, `DELETE /api/profile/videos/{videoId}` |
| Couple | `POST /api/couple`, `POST /api/couple/join`, `DELETE /api/couple` |
| Discovery | `GET /api/discovery` |
| Saved | `POST /api/saved`, `GET /api/saved`, `DELETE /api/saved/{targetUserId}` |
| Match | `POST /api/match/like`, `GET /api/match`, `DELETE /api/match/{matchId}` |
| Message | `POST /api/message/{matchId}`, `GET /api/message/{matchId}` |
| Notifications | `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all` |
| Verifications | `GET /api/verifications`, `POST /api/verifications/{methodKey}/attempts`, `POST /api/verifications/{methodKey}/attempts/{attemptId}/complete` |
| Safety | `POST /api/safety/block`, `DELETE /api/safety/block/{userId}`, `POST /api/safety/report` |
| Events | `GET /api/event`, `POST /api/event/{eventId}/interest`, `POST /api/event`, `DELETE /api/event/cleanup`, `DELETE /api/event/{id}` |
| Impress Me | `POST /api/impress-me`, `GET /api/impress-me/inbox`, `GET /api/impress-me/summary`, `GET /api/impress-me/{id}`, `POST /api/impress-me/{id}/respond`, `POST /api/impress-me/{id}/review`, `POST /api/impress-me/{id}/accept`, `POST /api/impress-me/{id}/decline` |
| Admin | `GET /api/admin/users`, `GET /api/admin/users/{userId}`, `GET /api/admin/online-users`, `GET /api/admin/moderation-analytics`, `DELETE /api/admin/seed-users`, `DELETE /api/admin/seed-events`, `POST /api/admin/seed-user` |
| Business partner auth | `POST /api/auth/business/register`, `POST /api/auth/login` |
| Business partner portal | `GET /api/business/categories`, `GET /api/business/me`, `PUT /api/business/profile`, `POST /api/business/profile/logo`, `GET /api/business/events`, `POST /api/business/events`, `PUT /api/business/events/{id}`, `POST /api/business/events/{id}/submit`, `POST /api/business/events/{id}/offers`, `POST /api/business/events/{id}/challenge`, `GET /api/business/challenges/{id}/responses`, `POST /api/business/challenges/{id}/responses/{responseId}/win`, `GET /api/business/analytics` |
| Public business content | `GET /api/business-events`, `GET /api/business-events/{id}`, `POST /api/business-events/{id}/like`, `POST /api/business-events/{id}/save`, `POST /api/business-events/{id}/register`, `GET /api/business-events/{id}/offers`, `POST /api/business-events/{id}/offers/{offerId}/claim`, `GET /api/business-events/{id}/challenge`, `POST /api/business-events/{id}/challenge/respond` |
| Business admin | `GET /api/admin/business/partners`, `POST /api/admin/business/partners/{id}/approve`, `POST /api/admin/business/partners/{id}/reject`, `POST /api/admin/business/partners/{id}/suspend`, `GET /api/admin/business/events`, `GET /api/admin/business/offers`, `GET /api/admin/business/challenges`, `GET /api/admin/business/audit` |

### Realtime And Utility Endpoints

| Endpoint | Purpose |
|---|---|
| `/health` | health check |
| `/hubs/chat` | SignalR chat hub |
| `/uploads/*` | locally served uploaded media |
| `/swagger` | Swagger UI in development |
| `/openapi/v1.json` | OpenAPI document in development |

### Discovery Query Params

`GET /api/discovery` currently supports:

- `userType`
- `maxDistanceKm`
- `skip`
- `take`

### Configured Verification Methods

The verification registry currently includes:

- `live_verified`
- `age_verified`
- `phone_verified`
- `couple_verified`
- `partner_consent_verified`
- `intent_verified`
- `in_person_verified`
- `social_verified`

## Configuration

Important environment values:

| Setting | Purpose |
|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `Jwt__Key` | JWT signing key, minimum 32 chars |
| `Jwt__Issuer` | token issuer |
| `Jwt__Audience` | token audience |
| `Cors__AllowedOrigins` | non-development CORS allowlist |
| `Verification__Methods__<key>__Enabled` | toggle individual verification methods |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP exporter endpoint |
| `APIBaseURL` in iOS `Info.plist` | physical-device backend URL override |
| `triad.apiBaseUrl` Gradle property | Android backend URL (baked into `BuildConfig.API_BASE_URL`) |
| `ANDROID_KEYSTORE` (+ `ANDROID_KEY_ALIAS`, passwords) | signing inputs for `android-app.sh` release builds |

Local defaults used by the repo workflow:

- API port: `5127`
- iOS bundle id: `com.thirdwheel.iosnative`
- iOS default simulator target: `iPhone 17`
- Android application id: `com.triad.app`
- Android default emulator target: `Pixel_7`
- Android default API base URL: `http://10.0.2.2:5127` (the emulator host alias)

## Runtime Behavior And Limits

### Runtime Notes

- the API validates `Jwt:Key` and `DefaultConnection` at startup
- development startup runs automatic EF Core migrations
- uploads are stored on local disk under `uploads/` and served from `/uploads`
- non-development builds redirect HTTP to HTTPS
- the global API rate limiter is `120` requests per `60` seconds per IP

### Current Limits

| Rule | Current Value |
|---|---|
| JWT expiry | 7 days |
| Max likes per day | 50 |
| Max profile photos | 5 |
| Max profile videos | 3 |
| Max image width | 1200 px |
| Max audio bio size | 10 MB |
| Max video size | 50 MB |
| Max video duration | 60 seconds |
| Bio max length | 500 chars |
| Message max length | 2000 chars |
| Spam strikes before ban | 3 |
| Repeated message trigger | 3 identical messages in 5 minutes |
| Impress Me daily quota | 5 |
| Impress Me max active outbound | 10 |
| Impress Me response max length | 1000 chars |
| Impress Me expiry | 48 hours |
| Live verification expiry | 365 days |
| Age verification expiry | 365 days |

## Observability

The backend is instrumented with OpenTelemetry for:

- ASP.NET Core requests
- outbound HTTP calls
- EF Core operations
- runtime metrics
- structured application logs

Console exporters are enabled in development, and OTLP exporters activate when OTLP endpoint variables are present.

## Architecture Roadmap

`plan.md` in the repo root contains a full microservice migration plan using a strangler-fig approach. It defines a YARP API gateway, per-domain ASP.NET services, RabbitMQ event bus, Redis-backed presence tracking, and a final PostgreSQL schema separation phase. All phases are currently unstarted — the backend remains a single monolith today.

## Notes

- `Product.md` is the product-facing companion to this README. It includes user flow diagrams for every feature.
- `plan.md` contains the microservice migration roadmap; it is a forward-looking plan and not current architecture.
- Swagger does not list the SignalR hub because `/hubs/chat` is not a REST endpoint.
- The admin endpoints intentionally return admin-safe summaries, not raw private profile artifacts.

## License

Private repository. All rights reserved.
