# Third Wheel

A privacy-first, consent-driven mobile platform where singles connect with couples and couples connect with singles or other couples. Built with ASP.NET Core 10, React Native (Expo), PostgreSQL, SignalR real-time chat, and full OpenTelemetry observability.

---

## Vision

Modern dating apps focus exclusively on 1:1 connections. **Third Wheel** breaks that mold by treating *couples as first-class participants* — singles can match with couples, couples can match with singles or other couples, and group chats form naturally when a couple matches. The platform prioritizes:

- **Privacy by design** — location rounded to ~1 km, EXIF data stripped from photos, alias-only identities
- **Consent-driven matching** — mutual likes required; one-way blocks are invisible to the blocked party
- **Safety at scale** — progressive anti-spam system, link/keyword blocking, automated account suspension
- **Observability from day one** — OpenTelemetry traces, metrics, and logs across backend and mobile

---

## Architecture

```
ThirdWheel/
├── backend/ThirdWheel.API/        # ASP.NET Core 10 Web API
│   ├── Controllers/               # 10 REST controllers
│   ├── Data/                      # EF Core DbContext + PostgreSQL
│   ├── DTOs/                      # Request / Response models
│   ├── Helpers/                   # GeoUtils (Haversine), UserMapper
│   ├── Hubs/                      # SignalR ChatHub (real-time messaging)
│   ├── Migrations/                # EF Core code-first migrations
│   ├── Models/                    # 12 database entities
│   └── Services/                  # 10 business-logic services
├── mobile/                        # React Native (Expo SDK 52)
│   ├── app/                       # Expo Router file-based screens
│   │   ├── auth/                  # Login / Register
│   │   ├── tabs/                  # Discover / Matches / Events / Profile
│   │   └── chat/                  # Real-time chat ([matchId])
│   └── src/
│       ├── contexts/              # AuthContext (JWT + SecureStore)
│       ├── services/              # API client, SignalR client, OpenTelemetry
│       ├── utils/                 # Photo URL builder
│       ├── constants.ts           # API URLs, color palette
│       ├── styles.ts              # Shared style system
│       └── types.ts               # TypeScript interfaces
├── docker-compose.yml             # PostgreSQL + API (Docker)
├── seed.ps1                       # PowerShell seed script (100 users)
└── NuGet.Config                   # Package source config
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | .NET 10 / ASP.NET Core | REST API, authentication, business logic |
| Database | PostgreSQL (Supabase) | Relational data, EF Core ORM |
| Real-time | SignalR | WebSocket chat with automatic fallback |
| Auth | JWT (HS256) | Stateless tokens, 7-day expiry |
| Mobile | React Native + Expo (SDK 52) | Cross-platform iOS/Android app |
| Navigation | Expo Router v4 | File-based routing |
| Observability | OpenTelemetry 1.12 | Distributed traces, metrics, structured logs |
| Image Processing | SixLabors.ImageSharp | EXIF stripping, resize, format conversion |
| Location | Haversine formula | Distance calculation without external services |

---

## Features

### Discovery & Matching

- **Swipeable card interface** with glassmorphism design
- **Filter by type**: All / Singles / Couples
- **Mutual-like matching** — both parties must like to create a match
- **50 likes/day** rolling limit to prevent spam swiping
- **Distance-aware** — Haversine calculation with user-configurable radius (5–50 miles)
- **Smart exclusions** — hides blocked users, already-liked users, banned accounts, incomplete profiles

### Couple System

- **Create a couple** — generates a unique 8-character invite code (cryptographically random, excludes ambiguous chars O/I/L/1/0)
- **Join via code** — partner enters the invite code to link accounts
- **Couple discovery** — couples appear as a unit in the discovery feed
- **Group chat** — when a couple matches with a user, all 3 (or 4) participants share one chat thread
- **Leave couple** — either member can leave; couple is deleted if only one remains

### Real-time Chat

- **SignalR WebSocket** with automatic reconnection
- **Group architecture** — per-match groups (`match_{matchId}`) for broadcast
- **Read receipts** — `MarkRead` broadcasts to all participants
- **REST fallback** — if SignalR connection drops, messages send via HTTP POST
- **Anti-spam integration** — messages checked for keywords, links, and repetition before delivery

### Events

- **Upcoming events** filtered by user location and radius
- **Interest toggle** — express interest with a tap; see who else is interested
- **Event details** — title, description, venue, date, banner image
- **Pull-to-refresh** and share functionality

### Profile Management

- **Photo gallery** — up to 3 photos per user (JPEG/PNG/WebP, max 5 MB)
- **EXIF/IPTC/XMP metadata auto-stripped** on upload
- **Auto-resize** — images wider than 1200 px are scaled down
- **Bio, age range, intent** (casual / serious / friendship / exploring)
- **Interest tags** — free-form tags for matching affinity
- **Location** — city, state, zip, coordinates (rounded for privacy)

### Safety & Privacy

| Feature | Implementation |
|---------|---------------|
| Location privacy | Coordinates stored with 2 decimal places (~1 km grid) |
| Photo privacy | All EXIF, IPTC, XMP metadata stripped; auto-resized to JPEG |
| Identity privacy | Alias-only usernames; real names never collected |
| Link prevention | Regex blocks URLs in bios and messages (http, www, TLDs, t.me, bit.ly) |
| Keyword filtering | Blocks spam terms: OnlyFans, Venmo, CashApp, Telegram, etc. |
| Blocking | One-way block; unmatches existing matches; hides both users from each other |
| Reporting | Reason + details submitted for moderation review |
| Anti-spam escalation | Strike 1 → warn, Strike 2 → throttle, Strike 3 → account ban |
| Repeated message detection | Same content 3+ times in 5 minutes triggers spam pipeline |

### Observability (OpenTelemetry)

**Backend** — traces, metrics, and logs with console + OTLP exporters:

| Custom Metric | Type | Tags |
|---------------|------|------|
| `triad.auth.operations` | Counter | operation, outcome |
| `triad.couple.operations` | Counter | operation, outcome |
| `triad.discovery.requests` | Counter | outcome, user_type |
| `triad.discovery.cards_returned` | Histogram | — |
| `triad.match.operations` | Counter | operation, outcome |
| `triad.messaging.sent` | Counter | channel |
| `triad.messaging.fetched` | Histogram | — |
| `triad.safety.operations` | Counter | operation |
| `triad.profile.operations` | Counter | operation |
| `triad.events.operations` | Counter | operation |
| `triad.realtime.operations` | Counter | operation |

Automatic instrumentation: ASP.NET Core, HTTP client, EF Core, .NET runtime.

**Mobile** — W3C Trace Context propagation on all API calls and SignalR operations; console + OTLP HTTP trace export.

---

## Database Schema

```
┌─────────────┐       ┌──────────────┐       ┌────────────┐
│    User      │──────▶│  UserPhoto   │       │   Couple   │
│              │──────▶│  UserInterest│       │            │
│  (CoupleId?) │◀─────│              │       │ InviteCode │
└──────┬───────┘       └──────────────┘       └─────┬──────┘
       │                                            │
       │  ┌──────┐    ┌───────┐    ┌────────┐      │
       ├─▶│ Like │    │ Match │───▶│ Message│      │
       │  └──────┘    └───────┘    └────────┘      │
       │  ┌──────┐    ┌────────┐   ┌────────────┐  │
       ├─▶│Block │    │ Report │   │ SpamWarning│  │
       │  └──────┘    └────────┘   └────────────┘  │
       │                                            │
       │  ┌──────┐    ┌──────────────┐              │
       └─▶│Event │───▶│EventInterest │              │
          └──────┘    └──────────────┘              │
```

### Entity Summary

| Entity | Key Fields | Constraints |
|--------|-----------|-------------|
| **User** | Username (unique), Email (unique, CI), PasswordHash (BCrypt), Bio, AgeMin/Max, Intent, LookingFor, Lat/Lon, RadiusMiles, IsBanned | Max 3 photos |
| **Couple** | InviteCode (unique, 8 chars), IsComplete, CreatedByUserId | Members via User.CoupleId FK |
| **Like** | FromUserId, ToUserId, FromCoupleId?, ToCoupleId? | Unique (From, To) |
| **Match** | User1Id, User2Id (ordered), Couple1Id?, Couple2Id?, IsActive | Unique (User1, User2); cascade delete messages |
| **Message** | MatchId, SenderId, Content (≤2000), IsRead, IsFlagged | Indexed on MatchId |
| **Block** | BlockerUserId, BlockedUserId | Unique pair |
| **Report** | ReporterUserId, ReportedUserId, Reason (≤50), Details?, IsResolved | — |
| **SpamWarning** | UserId, Reason, Level (1/2/3) | Level 3 → ban |
| **UserPhoto** | UserId, Url, SortOrder | Max 3 per user |
| **UserInterest** | UserId, Tag (≤50) | — |
| **Event** | Title, Description, BannerUrl, EventDate, Lat/Lon, City, Venue | — |
| **EventInterest** | UserId, EventId | Unique (User, Event) |

---

## API Reference

### Authentication (No Auth Required)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/api/auth/register` | `{username, email, password}` | `{token, user}` |
| `POST` | `/api/auth/login` | `{email, password}` | `{token, user}` |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profile` | Get authenticated user's profile |
| `PUT` | `/api/profile` | Update bio, age range, intent, location, interests, radius |
| `POST` | `/api/profile/photos` | Upload photo (max 5 MB; JPEG, PNG, WebP) |
| `DELETE` | `/api/profile/photos/{photoId}` | Delete a photo |

### Couple

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/couple` | Create couple → `{coupleId, inviteCode}` |
| `POST` | `/api/couple/join` | Join couple with `{inviteCode}` |
| `DELETE` | `/api/couple` | Leave couple |

### Discovery

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| `GET` | `/api/discovery` | `userType`, `maxDistanceKm`, `skip`, `take` | Get discovery cards |

### Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/match/like` | Like a user → `{matched, match?}` |
| `GET` | `/api/match` | List active matches |
| `DELETE` | `/api/match/{matchId}` | Unmatch |

### Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/message/{matchId}` | Send message (anti-spam checked) |
| `GET` | `/api/message/{matchId}` | Get messages (`skip`, `take`) |

### Safety

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/safety/block` | Block user `{userId}` |
| `DELETE` | `/api/safety/block/{userId}` | Unblock user |
| `POST` | `/api/safety/report` | Report user `{userId, reason, details?}` |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/event` | Upcoming events in user's radius |
| `POST` | `/api/event/{eventId}/interest` | Toggle interest |
| `POST` | `/api/event` | Create event (admin/seed) |
| `DELETE` | `/api/event/{id}` | Delete event (admin/seed) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `DELETE` | `/api/admin/seed-users` | Purge all `@triad.dev` seed users |
| `DELETE` | `/api/admin/seed-events` | Purge all events |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (PostgreSQL + EF Core) |

---

## SignalR Hub

Connect to `/hubs/chat` with JWT token: `?access_token={token}`

### Client → Server

| Method | Parameters | Description |
|--------|-----------|-------------|
| `JoinMatch` | `matchId` | Join match chat group (validates participant) |
| `LeaveMatch` | `matchId` | Leave match chat group |
| `SendMessage` | `matchId, content` | Send message (anti-spam applied) |
| `MarkRead` | `matchId` | Mark messages as read |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `ReceiveMessage` | `MessageResponse` | New message received |
| `MessageError` | `string` | Error (spam detected, validation failure) |
| `MessagesRead` | `matchId` | Read receipt broadcast |

---

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) (or a [Supabase](https://supabase.com/) project)
- [Android Studio](https://developer.android.com/studio) (for Android emulator) or Xcode (for iOS simulator)
- Expo CLI: `npm install -g expo-cli`

---

## Running Locally

### 1. Start the API

#### Option A: Docker (recommended)

```bash
docker compose up -d
```

This starts the API on port **5000** with the configured PostgreSQL connection.

#### Option B: Manual

```bash
cd backend/ThirdWheel.API

# Apply migrations
dotnet ef database update

# Run the API (launches on http://localhost:5127)
dotnet run
```

> **Note:** In development mode, the API auto-migrates the database on startup.

#### Configuration

Edit `appsettings.json` or set environment variables:

| Setting | Description | Default |
|---------|-------------|---------|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string | Supabase instance |
| `Jwt:Key` | HMAC-SHA256 signing key (≥32 chars) | Placeholder — **change in production** |
| `Jwt:Issuer` | Token issuer | `ThirdWheel.API` |
| `Jwt:Audience` | Token audience | `ThirdWheel.Mobile` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector URL (optional) | — |

### 2. Seed Test Data

```powershell
# From the project root
.\seed.ps1
```

The seed script:
- Purges previous seed data (`@triad.dev` accounts)
- Creates **50 single users** with randomized profiles and photos (from randomuser.me)
- Creates **25 couple pairs** (50 users) with linked accounts
- Creates **6 events** across major world cities
- Generates **likes and matches** for the primary test account
- Spreads users across **15 cities**: New York, LA, London, Paris, Berlin, Tokyo, Sydney, San Francisco, Chicago, Dubai, Moscow, Mumbai, São Paulo, Singapore, Toronto

### 3. Start the Mobile App

```bash
cd mobile

# Install dependencies
npm install

# Start Expo dev server + open on Android emulator
npx expo start --android
```

Press `a` to open on Android, `i` for iOS, or scan the QR code with Expo Go.

#### Android Emulator Setup

1. Open Android Studio → Device Manager
2. Create a virtual device (e.g., Pixel 7, API 34+)
3. Launch the emulator
4. Run `npx expo start --android`

> **Important:** The mobile app connects to the API via `10.0.2.2` (Android emulator's host alias). If running on a physical device, update `API_URL` in `mobile/src/constants.ts` to your machine's LAN IP.

### 4. Verify Everything Works

| Check | Command / URL |
|-------|---------------|
| API is running | `curl http://localhost:5127/health` |
| Emulator connected | `adb devices` |
| Metro bundler | Open `http://localhost:8081` in browser |
| App loads | Should see login screen in emulator |

---

## Deployment

### Docker Compose

```yaml
services:
  api:
    build:
      context: ./backend/ThirdWheel.API
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=<your-connection-string>
      - Jwt__Key=<your-secret-key-at-least-32-chars>
      - Jwt__Issuer=ThirdWheel.API
      - Jwt__Audience=ThirdWheel.Mobile
```

### Production Considerations

| Concern | Recommendation |
|---------|---------------|
| **Secrets** | Use Azure Key Vault, AWS Secrets Manager, or Docker secrets — never commit keys to source |
| **JWT Key** | Generate a cryptographically random 256-bit key |
| **CORS** | Restrict `AllowAnyOrigin` to specific mobile app origins |
| **Photo Storage** | Migrate from local `/uploads/` to S3, Azure Blob, or CDN |
| **Database** | Use connection pooling (PgBouncer) and read replicas for scale |
| **HTTPS** | Terminate TLS at the load balancer; enforce HTTPS-only |
| **Rate Limiting** | Add ASP.NET Core rate limiting middleware beyond the 50-like/day cap |
| **Observability** | Point OTLP exporters at Jaeger, Grafana Tempo, or Honeycomb |
| **Health Checks** | Wire `/health` into Kubernetes liveness/readiness probes or load balancer checks |

### Environment Variables (OTLP)

| Variable | Purpose |
|----------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector base URL |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Traces-specific endpoint |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | Metrics-specific endpoint |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Logs-specific endpoint |
| `EXPO_PUBLIC_OTEL_TRACES_URL` | Mobile OTLP trace endpoint |

---

## Business Rules

| Rule | Value |
|------|-------|
| JWT token expiry | 7 days |
| Max photos per user | 3 |
| Max image width | 1200 px (auto-resize) |
| Max likes per day | 50 (rolling 24-hour window) |
| Spam strikes before ban | 3 |
| Repeated message threshold | 3 identical messages in 5 minutes |
| Message max length | 2000 characters |
| Bio max length | 500 characters |
| Couple invite code | 8 alphanumeric characters (excludes O, I, L, 1, 0) |
| Photo upload max size | 5 MB |
| Accepted image formats | JPEG, PNG, WebP |

---

## Mobile App Design

### Design System

The app uses a **Neon Dark** aesthetic with glassmorphism and clay-button styling:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0B0B0F` | Screen backgrounds |
| Surface | `#111116` | Cards, containers |
| Surface Light | `#1C1C24` | Elevated surfaces |
| Primary | `#8B5CF6` | Purple — main actions |
| Secondary | `#EC4899` | Pink — secondary CTAs |
| Text | `#FAFAFA` | Primary text |
| Text Secondary | `#71717A` | Captions, hints |
| Error | `#F87171` | Destructive actions |
| Success | `#34D399` | Confirmations |
| Warning | `#FBBF24` | Alerts |

**Clay Buttons**: Platform-specific shadows (iOS `shadowColor` / Android `elevation`) with neon glow on primary/secondary variants.

**Glass Overlays**: `BlurView` (intensity 12–40, tint dark) with semi-transparent borders for cards and discovery overlays.

### Screen Flow

```
App Launch
  │
  ├─ Not Authenticated ──▶ Login ──▶ Register
  │
  └─ Authenticated ──▶ Tab Navigator
                          ├── Discover   (swipeable cards, like/skip)
                          ├── Matches    (match list → chat)
                          ├── Events     (upcoming events, interest toggle)
                          └── Profile    (photos, bio, couple controls)
                               │
                               └── Chat/[matchId]  (real-time messaging)
```

---

## Project Structure Details

### Backend Services

| Service | Responsibility |
|---------|---------------|
| `AuthService` | Registration, login, JWT generation (BCrypt hashing) |
| `ProfileService` | Profile CRUD, photo upload/delete, interest management |
| `CoupleService` | Create/join/leave couple, invite code generation |
| `DiscoveryService` | Card feed with filtering, exclusions, distance calc |
| `MatchingService` | Like processing, mutual-match detection, unmatch |
| `MessagingService` | Send/fetch messages, read receipts |
| `SafetyService` | Block/unblock, report submission |
| `AntiSpamService` | Keyword filtering, link detection, repeated-message check, progressive bans |
| `EventService` | Event CRUD, interest toggle, location-based filtering |
| `ImageService` | EXIF stripping, resize, format conversion, file storage |

### Mobile Dependencies

| Package | Purpose |
|---------|---------|
| `expo-router` (~4.0) | File-based navigation |
| `@react-navigation/*` (7.0) | Tab and stack navigation |
| `@microsoft/signalr` (8.0) | WebSocket real-time chat |
| `expo-image-picker` (~16.0) | Camera/gallery photo selection |
| `expo-location` (~18.0) | GPS coordinate access |
| `expo-secure-store` (~14.0) | Encrypted JWT token storage |
| `expo-blur` (~14.0) | Glassmorphism blur effects |
| `expo-linear-gradient` (~14.0) | Gradient overlays |
| `@opentelemetry/*` (1.9–2.1) | Distributed tracing |

---

## License

Private — all rights reserved.
- Anti-spam: keyword detection, rate limiting, progressive warn→throttle→ban
- Fake profile detection: requires photo + bio + interests
