# Triad

Triad is a dating and social discovery platform built around singles, couples, and group-aware matching. The repo currently contains:

- an ASP.NET Core 10 backend API in `backend/ThirdWheel.API`
- a native SwiftUI iOS client in `IOSNative/ThirdWheelNative`
- an Expo / React Native client in `mobile/` that still lives in the repo as a parallel client

The backend is the shared source of truth. The native iOS app is where most recent product work has landed.

---

## Table of Contents

- [Repo Layout](#repo-layout)
- [Current Product Scope](#current-product-scope)
  - [Backend API](#backend-api)
  - [Native iOS App](#native-ios-app)
  - [Expo App](#expo-app)
- [Backend Overview](#backend-overview)
  - [Core Stack](#core-stack)
  - [Main Backend Folders](#main-backend-folders)
  - [Key Backend Features](#key-backend-features)
- [Data Model Highlights](#data-model-highlights)
  - [Profile Model Includes](#profile-model-includes)
- [Current Feature Set](#current-feature-set)
  - [Discovery](#discovery)
  - [Saved Profiles](#saved-profiles)
  - [Matching and Chat](#matching-and-chat)
  - [Profile and Media](#profile-and-media)
  - [Safety](#safety)
  - [Events](#events)
  - [Impress Me](#impress-me)
- [Media Rules](#media-rules)
- [API Surface](#api-surface)
  - [Auth](#auth)
  - [Profile](#profile)
  - [Couple](#couple)
  - [Discovery](#discovery-1)
  - [Saved Profiles](#saved-profiles-1)
  - [Matches](#matches)
  - [Messaging](#messaging)
  - [Safety](#safety-1)
  - [Events](#events-1)
  - [Impress Me](#impress-me-1)
  - [Admin / Seed Support](#admin--seed-support)
  - [Health / Docs / Realtime](#health--docs--realtime)
- [Native iOS App Overview](#native-ios-app-overview)
  - [App Structure](#app-structure)
  - [Current Navigation Shape](#current-navigation-shape)
  - [Current Profile Editing UX](#current-profile-editing-ux)
- [Local Development](#local-development)
  - [Fastest Workflow](#fastest-workflow)
  - [API Only](#api-only)
  - [Native iOS App Only](#native-ios-app-only)
  - [Expo App](#expo-app-1)
- [Seed Data](#seed-data)
- [Configuration](#configuration)
- [Business Rules and Limits](#business-rules-and-limits)
- [Observability](#observability)
- [Notes](#notes)
- [License](#license)

---

## Repo Layout

```text
Triad/
├── backend/ThirdWheel.API/        # ASP.NET Core 10 API + SignalR + EF Core
├── IOSNative/                     # Native SwiftUI iOS app
│   ├── ThirdWheelNative/          # App source
│   └── ThirdWheelNative.xcodeproj
├── mobile/                        # Expo / React Native client
├── docker-compose.yml             # Local API container
├── seed.ps1                       # Demo data + events seeding
└── redeploy.sh                    # Rebuild API + iOS simulator app
```

---

## Current Product Scope

### Backend API

The API currently provides:

- JWT auth with registration and login
- profile read/update/delete
- multi-photo profile media
- audio bio and video/highlight uploads
- discovery feed for singles and couples
- saved profiles
- likes, matches, and unmatch
- REST messaging plus SignalR chat
- safety actions: block and report
- local events and interest toggling
- admin seed endpoints
- Impress Me prompt / response flow
- Swagger / OpenAPI in development

### Native iOS App

The SwiftUI app currently includes:

- login and registration
- Discover, Saved, Matches, Impress Me, and Events tabs
- profile access from the top-right account button
- dedicated profile edit screen pushed in navigation
- Instagram-style profile media editing:
  - photo grid management
  - story-style highlight bubbles for videos
- profile detail pages from discovery, saved profiles, and matches/chat
- saved profiles revisit flow
- chat screens
- event browsing
- native location permission handling
- session persistence

### Expo App

The Expo app is still present in `mobile/` and talks to the same backend, but the most up-to-date feature work in this repo is reflected in the native iOS app.

---

## Backend Overview

### Core Stack

| Area | Tech |
|---|---|
| API | ASP.NET Core 10 |
| ORM | Entity Framework Core 10 + Npgsql |
| Database | PostgreSQL |
| Auth | JWT bearer tokens |
| Realtime | SignalR |
| Media processing | SixLabors.ImageSharp |
| Observability | OpenTelemetry |
| API docs | OpenAPI + Swagger UI |

### Main Backend Folders

| Path | Purpose |
|---|---|
| `Controllers/` | HTTP endpoints |
| `Services/` | business logic |
| `Models/` | EF Core entities |
| `DTOs/` | request / response models |
| `Data/` | `AppDbContext` |
| `Helpers/` | mapping, geo helpers, default media helpers |
| `Hubs/` | SignalR hub |
| `Migrations/` | schema history |

### Key Backend Features

- `AuthService` handles registration, login, password hashing, and JWT generation.
- `ProfileService` manages profile data, media, dating preferences, red flags, and account deletion.
- `DiscoveryService` filters hidden / blocked / already-liked / already-saved users and returns discovery cards.
- `SavedProfileService` stores revisit-able profiles.
- `MatchingService` creates matches and supports group-aware chat when couple accounts are involved.
- `MessagingService` powers match chat over REST.
- `SafetyService` handles block and report workflows.
- `ImpressMeService` supports prompt-based pre-match and post-match interaction.
- `EventService` handles local event listing and interest toggling.

---

## Data Model Highlights

The data model now includes more than the original core dating entities. Important current entities include:

- `User`
- `UserPhoto`
- `UserVideo`
- `UserInterest`
- `UserRedFlag`
- `Couple`
- `SavedProfile`
- `Like`
- `Match`
- `Message`
- `Block`
- `Report`
- `SpamWarning`
- `Event`
- `EventInterest`
- `ImpressMePrompt`
- `ImpressMeSignal`
- `ImpressMeResponse`

### Profile Model Includes

User profiles currently include:

- bio
- age range
- intent
- looking-for preference
- interests
- red flags
- city / state / zip
- radius
- couple linkage and partner name
- audio bio URL
- legacy `videoBioUrl`
- ordered `videos` list for story/highlight-style media
- dating preference fields such as:
  - interested in
  - neighborhood
  - ethnicity
  - religion
  - relationship type
  - height
  - children / family plans
  - drugs / smoking / marijuana / drinking
  - politics
  - education level
  - weight
  - physique
  - sexual preference
  - comfort with intimacy

---

## Current Feature Set

### Discovery

- audience filter: all / singles / couples
- discovery excludes blocked users, already liked users, and already saved users
- public profile detail screen from discovery cards
- save, skip, and like actions

### Saved Profiles

- save profiles for later
- revisit saved profiles from the `Saved` tab
- remove saved profiles

### Matching and Chat

- mutual likes create matches
- matches list in the app
- chat thread per match
- SignalR hub at `/hubs/chat`
- REST message fallback endpoints
- profile detail navigation from chat context

### Profile and Media

- default profile image fallback for new users
- custom profile photo uploads enabled again
- ordered multi-photo support
- story-style video highlights
- audio bio upload
- dating preferences and red flags
- dedicated native edit screen instead of a modal sheet

### Safety

- block user
- unblock user
- report user with reason and optional detail
- anti-spam validation for profile and message content

### Events

- list events near the user
- toggle event interest
- create and clean up demo events through the API

### Impress Me

Impress Me is a prompt-based interaction system currently built into both backend and iOS native app.

It supports:

- sending a signal to another user
- inbox view for sent and received signals
- prompt response submission
- sender review flow
- accept / decline flow
- pre-match and post-match usage

---

## Media Rules

Current backend-enforced media rules:

| Rule | Value |
|---|---|
| Max profile photos | 5 |
| Max profile videos | 3 |
| Max image width | 1200 px |
| Max audio bio size | 10 MB |
| Max video size | 50 MB |
| Allowed audio types | mp3, mp4, m4a, aac, wav |
| Allowed video types | mp4, mov, m4v, mpeg, webm |

Notes:

- Photos are normalized through the API.
- A shared default image is used as fallback when a user has no custom photos.
- The profile API currently still carries both `videoBioUrl` and the newer ordered `videos` list.

---

## API Surface

Base API route prefix: `/api`

### Auth

| Method | Endpoint |
|---|---|
| `POST` | `/api/auth/register` |
| `POST` | `/api/auth/login` |

### Profile

| Method | Endpoint |
|---|---|
| `GET` | `/api/profile` |
| `GET` | `/api/profile/{userId}` |
| `PUT` | `/api/profile` |
| `DELETE` | `/api/profile` |
| `POST` | `/api/profile/photos` |
| `DELETE` | `/api/profile/photos/{photoId}` |
| `POST` | `/api/profile/audio-bio` |
| `DELETE` | `/api/profile/audio-bio` |
| `POST` | `/api/profile/video-bio` |
| `DELETE` | `/api/profile/video-bio` |
| `POST` | `/api/profile/videos` |
| `DELETE` | `/api/profile/videos/{videoId}` |

### Couple

| Method | Endpoint |
|---|---|
| `POST` | `/api/couple` |
| `POST` | `/api/couple/join` |
| `DELETE` | `/api/couple` |

### Discovery

| Method | Endpoint |
|---|---|
| `GET` | `/api/discovery` |

Query params:

- `userType`
- `maxDistanceKm`
- `skip`
- `take`

### Saved Profiles

| Method | Endpoint |
|---|---|
| `POST` | `/api/saved` |
| `GET` | `/api/saved` |
| `DELETE` | `/api/saved/{targetUserId}` |

### Matches

| Method | Endpoint |
|---|---|
| `POST` | `/api/match/like` |
| `GET` | `/api/match` |
| `DELETE` | `/api/match/{matchId}` |

### Messaging

| Method | Endpoint |
|---|---|
| `POST` | `/api/message/{matchId}` |
| `GET` | `/api/message/{matchId}` |

### Safety

| Method | Endpoint |
|---|---|
| `POST` | `/api/safety/block` |
| `DELETE` | `/api/safety/block/{userId}` |
| `POST` | `/api/safety/report` |

### Events

| Method | Endpoint |
|---|---|
| `GET` | `/api/event` |
| `POST` | `/api/event/{eventId}/interest` |
| `POST` | `/api/event` |
| `DELETE` | `/api/event/cleanup` |
| `DELETE` | `/api/event/{id}` |

### Impress Me

| Method | Endpoint |
|---|---|
| `POST` | `/api/impress-me` |
| `GET` | `/api/impress-me/inbox` |
| `GET` | `/api/impress-me/{id}` |
| `POST` | `/api/impress-me/{id}/respond` |
| `POST` | `/api/impress-me/{id}/review` |
| `POST` | `/api/impress-me/{id}/accept` |
| `POST` | `/api/impress-me/{id}/decline` |

### Admin / Seed Support

| Method | Endpoint |
|---|---|
| `DELETE` | `/api/admin/seed-users` |
| `DELETE` | `/api/admin/seed-events` |
| `POST` | `/api/admin/seed-user` |

### Health / Docs / Realtime

| Endpoint | Purpose |
|---|---|
| `/health` | health check |
| `/swagger` | Swagger UI in development |
| `/openapi/v1.json` | OpenAPI document in development |
| `/hubs/chat` | SignalR hub |

---

## Native iOS App Overview

### App Structure

The main SwiftUI app lives in `IOSNative/ThirdWheelNative`.

Important files:

| Path | Purpose |
|---|---|
| `ThirdWheelNativeApp.swift` | app entry |
| `RootView.swift` | session gate + tab shell |
| `SessionStore.swift` | auth/session/API coordination |
| `AuthView.swift` | sign in / register |
| `DiscoverView.swift` | discovery feed |
| `SavedProfilesView.swift` | saved profiles |
| `MatchesView.swift` | matches + chat |
| `ImpressMeView.swift` | Impress Me inbox |
| `EventsView.swift` | events |
| `ProfileView.swift` | profile + edit flow |
| `ProfileDetailView.swift` | public profile detail |
| `UIComponents.swift` | shared native UI components |

### Current Navigation Shape

- `Discover`
- `Saved`
- `Matches`
- `Impress`
- `Events`
- `Profile` via top-right account button

### Current Profile Editing UX

The profile edit flow is now a dedicated screen pushed from `ProfileView`, not a popup sheet. It currently includes:

- media editing cards
- photo grid management
- highlight/video management
- bio and basic preferences
- location
- interests
- red flags
- dating preference menus
- audio bio upload

---

## Local Development

### Fastest Workflow

Use the repo script:

```bash
./redeploy.sh
```

This script:

1. rebuilds and redeploys the Docker API
2. waits for `http://localhost:5127/health`
3. builds the native iOS app
4. reinstalls and relaunches the app in the simulator

Optional overrides:

```bash
SIMULATOR_NAME="iPhone 16 Pro" ./redeploy.sh
SIMULATOR_UDID="YOUR-SIM-UDID" ./redeploy.sh
API_PORT=5127 ./redeploy.sh
```

### API Only

```bash
docker compose up -d --build api
```

The API is exposed on:

- `http://localhost:5127`

Useful URLs:

- `http://localhost:5127/health`
- `http://localhost:5127/swagger`
- `http://localhost:5127/openapi/v1.json`

### Native iOS App Only

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

### Expo App

If you want to run the Expo client:

```bash
cd mobile
npm install
npm run ios
```

---

## Seed Data

Run the seed script from the repo root:

```powershell
.\seed.ps1
```

The current seed flow:

- preserves `yasvanth@live.in`
- deletes other users and old seeded events
- creates `15` single users
- creates `5` couple pairs (`10` users)
- total seeded profiles: `25`
- uses Washington State locations only
- creates `6` Washington-based events
- seeds a set of likes/matches for the preserved demo user

Current seeded cities include places such as:

- Seattle
- Bellevue
- Tacoma
- Spokane
- Olympia
- Everett
- Bellingham
- Vancouver, WA
- Redmond
- Kirkland
- Renton
- Issaquah
- Yakima
- Wenatchee
- Kennewick

---

## Configuration

Important environment/config values:

| Setting | Purpose |
|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `Jwt__Key` | JWT signing key |
| `Jwt__Issuer` | token issuer |
| `Jwt__Audience` | token audience |
| `Cors__AllowedOrigins` | non-dev CORS allowlist |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry exporter endpoint |
| `APIBaseURL` in iOS `Info.plist` | physical-device backend URL override |

Current local defaults:

- API port: `5127`
- iOS bundle id: `com.thirdwheel.iosnative`
- default simulator target used by repo workflow: `iPhone 17`

---

## Business Rules and Limits

| Rule | Current Value |
|---|---|
| JWT expiry | 7 days |
| Global API limiter | 120 requests / 60 seconds per IP |
| Max likes per day | 50 |
| Max profile photos | 5 |
| Max profile videos | 3 |
| Bio max length | 500 chars |
| Message max length | 2000 chars |
| Spam strikes before ban | 3 |
| Repeated message trigger | 3 identical messages in 5 minutes |

---

## Observability

The backend is wired for OpenTelemetry traces, metrics, and logs.

Instrumentation includes:

- ASP.NET Core
- HTTP client
- EF Core
- runtime metrics

Development mode also enables:

- console exporters
- Swagger UI
- automatic migrations on startup

---

## Notes

- Swagger only appears in development.
- The SignalR hub does not appear as a full REST endpoint in Swagger.
- The native iOS app is ahead of the Expo client in terms of current product features.
- `IOSNative/README.md` still describes an earlier scope; this root README is the current project-level source of truth.

---

## License

Private repository. All rights reserved.
