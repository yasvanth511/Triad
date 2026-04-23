# Microservice Migration Plan — Third Wheel / Triad

## Current State

Single ASP.NET 10 monolith at `backend/ThirdWheel.API` with:
- 1 shared `AppDbContext` (PostgreSQL via Npgsql)
- 13 controllers, 14 services, 25 entity types
- SignalR hub (`ChatHub`) for real-time messaging
- JWT auth (HS256), OpenTelemetry, rate limiting, CORS
- Docker Compose: `api` + `admin` containers, no message bus

### Existing Domain Boundaries (already cleanly separated as services)

| Service File | Controller(s) | Models Owned |
|---|---|---|
| `AuthService` | `AuthController` | `User` (auth fields) |
| `ProfileService` | `ProfileController` | `User`, `UserPhoto`, `UserVideo`, `UserInterest`, `UserRedFlag` |
| `CoupleService` | `CoupleController` | `Couple` |
| `DiscoveryService` | `DiscoveryController` | reads User |
| `MatchingService` | `MatchController` | `Like`, `Match` |
| `MessagingService` | `MessageController` | `Message` |
| `SafetyService` + `AntiSpamService` | `SafetyController` | `Block`, `Report`, `SpamWarning` |
| `EventService` | `EventController` | `Event`, `EventInterest` |
| `ImpressMeService` + `PromptGeneratorService` | `ImpressMeController` | `ImpressMeSignal`, `ImpressMePrompt`, `ImpressMeResponse` |
| `NotificationService` | `NotificationController` | `Notification` |
| `SavedProfileService` | `SavedController` | `SavedProfile` |
| `VerificationService` (+ 9 method classes) | `VerificationController` | `UserVerification`, `VerificationAttempt`, `VerificationEvent` |
| `AdminController` | `AdminController` | cross-cutting reads only |
| `ImageService` | (used by Profile) | file I/O, no DB entity |
| `OnlineUserPresenceTracker` | (singleton in Chat) | in-memory ConcurrentDictionary |

---

## Target Architecture

```
Clients (iOS, Web, Admin)
        │
        ▼
  ┌─────────────┐
  │ API Gateway │  (YARP reverse proxy — routes by path prefix)
  └──────┬──────┘
         │
  ┌──────┴──────────────────────────────────────────────────────┐
  │                     Internal Network                         │
  │                                                              │
  │  identity-svc   discovery-svc   matching-svc   chat-svc     │
  │  couple-svc     safety-svc      events-svc     impress-svc  │
  │  notify-svc     verification-svc  saved-svc    admin-svc    │
  └──────┬──────────────────────────────────────────────────────┘
         │
  ┌──────┴─────────────────┐
  │   Message Bus          │  (RabbitMQ — async domain events)
  │   Events published:    │
  │   - UserMatched        │
  │   - ImpressMeAccepted  │
  │   - UserReported       │
  │   - UserBlocked        │
  └────────────────────────┘
         │
  ┌──────┴──────────────────────────────────────┐
  │  Per-service PostgreSQL schemas (same PG    │
  │  instance, separate schemas or databases)   │
  │  identity | couples | matching | messaging  │
  │  safety   | events  | impress  | notify     │
  │  saved    | verify  | admin                 │
  └─────────────────────────────────────────────┘
```

### Service → Port Map (local dev)

| Service | Path Prefix | Internal Port |
|---|---|---|
| gateway | all | 5127 (existing client-facing port) |
| identity-svc | `/api/auth`, `/api/profile` | 5201 |
| couple-svc | `/api/couple` | 5202 |
| discovery-svc | `/api/discovery` | 5203 |
| matching-svc | `/api/match` | 5204 |
| chat-svc | `/api/message`, `/hubs/chat` | 5205 |
| safety-svc | `/api/safety` | 5206 |
| events-svc | `/api/event` | 5207 |
| impress-svc | `/api/impress-me` | 5208 |
| notify-svc | `/api/notifications` | 5209 |
| saved-svc | `/api/saved` | 5210 |
| verification-svc | `/api/verifications` | 5211 |
| admin-svc | `/api/admin` | 5212 |

### Shared Infrastructure

- **JWT**: each service validates the same symmetric key — no auth-server needed. Pass `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience` to every service via env.
- **Contracts**: create `ThirdWheel.Contracts` class library containing shared DTOs and event message types. Referenced by all services via ProjectReference (later publishable as NuGet).
- **Message bus**: RabbitMQ with `MassTransit` as the client abstraction. Each service publishes/consumes only its own events.
- **Cross-service user reads**: Discovery, Matching, Safety, Admin need User data. Implement as lightweight HTTP calls to `identity-svc` via `HttpClient` + `IMemoryCache` (short TTL). Do NOT share the DB.
- **Uploads / static files**: `ImageService` stays in `identity-svc`. Other services reference photo URLs as strings.

---

## Migration Strategy: Strangler Fig

Migrate one service at a time without breaking clients. The API Gateway (YARP) acts as the routing seam.

### Phase 0 — Gateway (no service changes yet)
Extract YARP gateway container. Route all traffic to existing monolith. Zero behaviour change.

### Phase 1 — Identity (Auth + Profile)
First extraction because every other service depends on User data. Establishes the cross-service HTTP client pattern.

### Phase 2 — Safety + Matching
High value for isolation. Matching emits `UserMatched` event consumed by notify-svc.

### Phase 3 — Chat (Messaging + SignalR)
Most stateful service. Requires careful `OnlineUserPresenceTracker` handling (move to Redis for multi-instance support).

### Phase 4 — Couples, Discovery, Saved, Events
Largely read-heavy; straightforward extractions.

### Phase 5 — ImpressMe, Verification, Notifications
ImpressMe depends on matching events; extract after Phase 2. Verification is self-contained.

### Phase 6 — Admin
Reads across all services via their HTTP APIs. Extract last.

### Phase 7 — DB Schema Separation
After all services are running independently, split `AppDbContext` per service into separate PostgreSQL schemas. Run with `--connection-string` overrides per service.

---

## Agent Implementation Prompts

Each section below is a self-contained prompt for an agent to implement that phase.
Copy-paste the relevant block as the agent's task.

---

### AGENT PROMPT — Phase 0: API Gateway

```
TASK: Add a YARP API Gateway to the Third Wheel / Triad project.

REPO ROOT: /Users/yasvanthudayakumar/Documents/Triad

CONTEXT:
- Monolith is at backend/ThirdWheel.API, runs on port 5127 locally.
- All clients (iOS, web, admin) call http://localhost:5127/api/*.
- Goal: insert a YARP gateway between clients and the monolith with zero behaviour change.
- The gateway will later route individual path prefixes to extracted microservices.

WHAT TO DO:

1. Create backend/ThirdWheel.Gateway/ThirdWheel.Gateway.csproj
   - net10.0, ASP.NET Core, add package Yarp.ReverseProxy (latest stable).

2. Create backend/ThirdWheel.Gateway/Program.cs:
   - Load YARP config from appsettings.json.
   - Add CORS policy mirroring the monolith (AllowAnyOrigin in development).
   - No auth, no rate limiting — the downstream services handle it.
   - Map YARP endpoints.

3. Create backend/ThirdWheel.Gateway/appsettings.json with a single cluster:
   {
     "ReverseProxy": {
       "Routes": {
         "monolith": {
           "ClusterId": "monolith",
           "Match": { "Path": "{**catch-all}" }
         }
       },
       "Clusters": {
         "monolith": {
           "Destinations": {
             "monolith/d1": { "Address": "http://api:5000/" }
           }
         }
       }
     }
   }

4. Create backend/ThirdWheel.Gateway/appsettings.Development.json:
   - Override monolith address to http://localhost:5127/.

5. Create backend/ThirdWheel.Gateway/Dockerfile:
   - Multi-stage build mirroring backend/ThirdWheel.API/Dockerfile.
   - Expose port 5000, ASPNETCORE_URLS=http://+:5000.

6. Update docker-compose.yml:
   - Add gateway service on host port 5127 (move api service to internal port 5128:5000).
   - Update api service port to 5128:5000 and remove the host-facing 5127 mapping.
   - gateway depends_on: api.
   - Both on ipv6net.

7. Update backend/ThirdWheel.API/appsettings.Development.json:
   - Change listen port to 5128 in launchSettings if present; do not break dotnet run for local dev.

VERIFY (do not run, just check): docker-compose config produces no errors and gateway routes to api.

OUTPUT: List files created/modified. Do not explain each line.
```

---

### AGENT PROMPT — Phase 1: Identity Service (Auth + Profile)

```
TASK: Extract the Identity microservice from the Third Wheel monolith.

REPO ROOT: /Users/yasvanthudayakumar/Documents/Triad
MONOLITH: backend/ThirdWheel.API/

WHAT TO EXTRACT:
- Controllers: AuthController, ProfileController
- Services: AuthService, ProfileService, ImageService
- Models: User, UserPhoto, UserVideo, UserInterest, UserRedFlag
- Helpers: UserMapper, DefaultProfilePhoto, GeoUtils (subset used by profile)
- DTOs: all in Dtos.cs relevant to auth and profile (AuthResponse, RegisterRequest, LoginRequest,
        UserProfileResponse, UpdateProfileRequest, PhotoResponse, UploadAudioBioResponse,
        UploadVideoBioResponse)
- Verification read: VerificationService is NOT extracted here, but identity-svc must expose
        GET /api/internal/users/{userId} returning a slim UserSummary DTO
        (id, username, photos[0].url, latitude, longitude, interests, coupleId, lookingFor, ageMin, ageMax, radiusMiles, isOnline)
        secured with a shared internal API key header (X-Internal-Key).

STEPS:

1. Create backend/ThirdWheel.Identity/ project (net10.0, SDK Web).
   Copy only the files listed above. Adjust namespaces to ThirdWheel.Identity.*.

2. Create a new AppDbContext in ThirdWheel.Identity/Data/IdentityDbContext.cs
   containing only: Users, UserPhotos, UserVideos, UserInterests, UserRedFlags.
   Keep all the same model configuration (indexes, precision, cascade rules).

3. Add internal endpoint GET /api/internal/users/{userId}:
   - Validate X-Internal-Key header matches config value InternalApi:Key.
   - Return UserSummary DTO. Used by discovery-svc, matching-svc, safety-svc.

4. Add internal endpoint GET /api/internal/users?ids=id1,id2,...:
   - Bulk fetch up to 50 user summaries by ID list.
   - Same auth as above.

5. Program.cs: wire DbContext, AuthService, ProfileService, ImageService, JWT, CORS,
   rate limiting, OpenTelemetry — same config keys as the monolith.
   Listen on port 5000 (ASPNETCORE_URLS=http://+:5000).

6. Create backend/ThirdWheel.Identity/Dockerfile (multi-stage, net10.0).

7. Add identity service to docker-compose.yml:
   - Internal port 5201:5000.
   - Reads from same PostgreSQL (same connection string, same schema for now).
   - Env vars: Jwt__Key, Jwt__Issuer, Jwt__Audience, ConnectionStrings__DefaultConnection,
               InternalApi__Key.

8. Update YARP gateway appsettings.json:
   - Route /api/auth/** and /api/profile/** to cluster identity (http://identity:5000/).
   - All other routes still go to monolith cluster.

9. In the monolith (ThirdWheel.API), do NOT delete AuthController or ProfileController yet.
   Add [Obsolete] comments on them and add a TODO comment: "Remove after identity-svc verified in prod."

ASSUMPTIONS:
- Shared PostgreSQL instance. identity-svc and monolith both read/write the same tables.
  This is acceptable during the strangler phase. DB schema split is Phase 7.
- Migrations remain in the monolith until Phase 7.

OUTPUT: List files created/modified. Flag any DTO or model that was ambiguous to assign.
```

---

### AGENT PROMPT — Phase 2: Safety + Matching Services

```
TASK: Extract Safety and Matching microservices from the Third Wheel monolith.
Extract both in one pass because Matching emits a domain event consumed by Notifications.

REPO ROOT: /Users/yasvanthudayakumar/Documents/Triad
MONOLITH: backend/ThirdWheel.API/

PRE-REQUISITES:
- Phase 0 (gateway) and Phase 1 (identity-svc) are complete.
- identity-svc exposes GET /api/internal/users/{userId} with X-Internal-Key auth.

--- SAFETY SERVICE ---

EXTRACT to backend/ThirdWheel.Safety/:
- Controllers: SafetyController (block, unblock, report)
- Services: SafetyService, AntiSpamService
- Models: Block, Report, SpamWarning
- DTOs: BlockRequest, ReportRequest (from Dtos.cs)

Cross-service reads needed:
- SafetyService needs User existence checks. Call identity-svc GET /api/internal/users/{id}
  via typed HttpClient IIdentityClient registered in DI.
- Register IIdentityClient with BaseAddress from config IdentityService:BaseUrl.

New in SafetyService:
- After a Report is saved, publish domain event UserReported { ReportId, ReportedUserId, ReporterId, Reason }
  to RabbitMQ exchange "safety" using MassTransit.

Wire DbContext SafetyDbContext with: Blocks, Reports, SpamWarnings.
Port: 5206. Dockerfile + docker-compose entry.
Gateway: route /api/safety/** → safety cluster.

--- MATCHING SERVICE ---

EXTRACT to backend/ThirdWheel.Matching/:
- Controllers: MatchController (like, getMatches, unmatch)
- Services: MatchingService
- Models: Like, Match
- DTOs: LikeRequest, MatchResponse (from Dtos.cs)

Cross-service reads:
- MatchingService.LikeUser needs User data (blocks check, couple info, age/intent filters).
  Call identity-svc GET /api/internal/users/{id} via IIdentityClient.
- MatchingService.LikeUser must check blocks: call safety-svc GET /api/internal/blocks/check?userId={a}&targetId={b}
  Add that internal endpoint to safety-svc.

After a mutual match is created, publish domain event UserMatched { MatchId, User1Id, User2Id }
to RabbitMQ exchange "matching" using MassTransit.

Wire DbContext MatchingDbContext with: Likes, Matches.
Port: 5204. Dockerfile + docker-compose entry.
Gateway: route /api/match/** → matching cluster.

--- SHARED CONTRACTS ---

Create backend/ThirdWheel.Contracts/ThirdWheel.Contracts.csproj:
- Class library (not SDK Web).
- Define message types:
  - UserMatched { Guid MatchId, Guid User1Id, Guid User2Id, DateTimeOffset MatchedAt }
  - UserReported { Guid ReportId, Guid ReportedUserId, Guid ReporterId, string Reason }
  - UserBlocked { Guid BlockerId, Guid BlockedUserId }
- Add MassTransit (latest stable) as PackageReference.
- Reference ThirdWheel.Contracts from matching-svc and safety-svc csproj.

--- RABBITMQ ---

Add rabbitmq service to docker-compose.yml:
  image: rabbitmq:3-management
  ports: 5672:5672, 15672:15672 (management UI)
  healthcheck: rabbitmq-diagnostics ping

Add RABBITMQ_HOST env var to matching-svc and safety-svc.
Configure MassTransit in both services' Program.cs to use RabbitMQ transport.

OUTPUT: List all new files. Note any DTO that is shared between matching and safety and
        explain how you resolved it (duplicate or move to Contracts).
```

---

### AGENT PROMPT — Phase 3: Chat Service (Messaging + SignalR)

```
TASK: Extract the Chat microservice from the Third Wheel monolith.

REPO ROOT: /Users/yasvanthudayakumar/Documents/Triad
MONOLITH: backend/ThirdWheel.API/

PRE-REQUISITES: Phases 0-2 complete.

EXTRACT to backend/ThirdWheel.Chat/:
- Controllers: MessageController
- Services: MessagingService, NotificationService (SignalR push only — see note below)
- Hubs: ChatHub
- Services: OnlineUserPresenceTracker (see note)
- Models: Message
- DTOs: SendMessageRequest, MessageResponse

IMPORTANT NOTES:

1. OnlineUserPresenceTracker is currently an in-memory static ConcurrentDictionary.
   For multi-instance safety, replace it with a Redis-backed implementation.
   - Add StackExchange.Redis and Microsoft.Extensions.Caching.StackExchangeRedis packages.
   - Store online users in Redis SET "online_users" with 90-second TTL per entry (heartbeat-extended).
   - Expose GET /api/internal/online-users returning List<Guid> of currently online user IDs.
     Secured with X-Internal-Key. Admin-svc will call this.
   - Keep the same IOnlineUserPresenceTracker interface so ChatHub is unchanged.

2. NotificationService depends on IHubContext<ChatHub>. Keep it inside chat-svc.
   Other services that want to send push notifications (matching-svc) should do so by
   consuming a MassTransit message SendPushNotification { Guid RecipientId, string Type, string Payload }
   which chat-svc consumes and forwards to SignalR. Add this consumer to chat-svc.

3. JWT for SignalR: the query-string token extraction (OnMessageReceived) must be reproduced
   exactly in chat-svc's JwtBearer options.

4. Wire DbContext ChatDbContext with: Messages. Matches table is read-only here
   (needed to validate that sender is a participant). Read Matches from matching-svc via
   GET /api/internal/matches/{matchId}/participants returning { User1Id, User2Id }.
   Add that internal endpoint to matching-svc.

Port: 5205.
Add Redis service to docker-compose.yml: image redis:7-alpine, port 6379:6379.
Add REDIS_CONNECTION env var to chat-svc.
Dockerfile + docker-compose entry.
Gateway: route /api/message/** and /hubs/chat/** → chat cluster.
   For /hubs/chat/**, YARP must forward WebSocket upgrades. Set transforms: []
   and ensure the route has no path rewrite.

OUTPUT: List new files. Flag the Redis key schema you used for presence tracking.
```

---

### AGENT PROMPT — Phase 4: Couples, Discovery, Saved, Events

```
TASK: Extract four microservices from the Third Wheel monolith in one pass.
These are largely independent and read-heavy.

REPO ROOT: /Users/yasvanthudayakumar/Documents/Triad

--- COUPLE SERVICE (backend/ThirdWheel.Couple/) ---
Extract: CoupleController, CoupleService, Models: Couple, DTOs: CreateCoupleResponse, JoinCoupleRequest.
Cross-service: After a couple is created/joined, publish CoupleFormed { CoupleId, MemberIds[] } to RabbitMQ.
Update User.CoupleId is a problem: Couple service needs to write to the User table.
Solution: Add PATCH /api/internal/users/{id}/couple { coupleId } internal endpoint to identity-svc.
CoupleService calls identity-svc to set/unset CoupleId on join/leave.
DbContext: CoupleDbContext with Couples only. Port: 5202. Gateway: /api/couple/** → couple cluster.

--- DISCOVERY SERVICE (backend/ThirdWheel.Discovery/) ---
Extract: DiscoveryController, DiscoveryService, Helpers: GeoUtils.
DiscoveryService currently queries User, UserInterest, Block, Like, Couple directly.
Replace with:
  - Call GET /api/internal/users/discoverable?lat=&lon=&radiusMiles=&excludeIds=
    Add this endpoint to identity-svc returning slim candidate list.
  - Call GET /api/internal/blocks/by-user/{userId} to safety-svc (add this endpoint).
  - Call GET /api/internal/likes/sent-by/{userId} to matching-svc (add this endpoint).
  DiscoveryService assembles the filtered card list from these three sources.
DbContext: none (all data from HTTP calls + local caching via IMemoryCache, 30s TTL).
Port: 5203. Gateway: /api/discovery/** → discovery cluster.

--- SAVED PROFILES SERVICE (backend/ThirdWheel.Saved/) ---
Extract: SavedController, SavedProfileService, Models: SavedProfile, DTOs: SaveProfileRequest, SavedProfileResponse.
Cross-service: needs User summary for response — call identity-svc GET /api/internal/users/{id}.
DbContext: SavedDbContext with SavedProfiles. Port: 5210. Gateway: /api/saved/** → saved cluster.

--- EVENTS SERVICE (backend/ThirdWheel.Events/) ---
Extract: EventController, EventService, Models: Event, EventInterest, DTOs: CreateEventRequest, EventResponse.
No cross-service reads required.
DbContext: EventsDbContext with Events, EventInterests. Port: 5207. Gateway: /api/event/** → events cluster.

All four services:
- Dockerfile (multi-stage, net10.0)
- docker-compose entry (postgres + rabbitmq same instances)
- Same JWT config via env vars
- OpenTelemetry config (copy from monolith)

OUTPUT: List files created. Note which internal endpoints were added to identity-svc,
        safety-svc, and matching-svc as part of this phase.
```

---

### AGENT PROMPT — Phase 5: ImpressMe, Verification, Notifications

```
TASK: Extract ImpressMe, Verification, and Notifications microservices.

REPO ROOT: /Users/yasvanthudayakumar/Documents/Triad

PRE-REQUISITES: Phases 0-4 complete. MassTransit + RabbitMQ operational.

--- IMPRESS ME SERVICE (backend/ThirdWheel.ImpressMe/) ---
Extract: ImpressMeController, ImpressMeService, PromptGeneratorService,
         Models: ImpressMeSignal, ImpressMePrompt, ImpressMeResponse,
         Config: ImpressMeConfig.cs,
         DTOs: ImpressMeDtos.cs.
Cross-service:
- Send: needs to verify sender/receiver exist — call identity-svc internal users endpoint.
- Accept: creates a Match. Do NOT call matching-svc directly.
  Instead publish ImpressMeAccepted { SignalId, SenderId, ReceiverId } to RabbitMQ.
  matching-svc consumes this and creates the Match, then emits UserMatched.
- Notifications after state transitions: publish SendPushNotification messages consumed by chat-svc.
DbContext: ImpressMeDbContext with ImpressMeSignals, ImpressMePrompts, ImpressMeResponses.
Port: 5208. Gateway: /api/impress-me/** → impress cluster.

--- VERIFICATION SERVICE (backend/ThirdWheel.Verification/) ---
Extract: VerificationController, VerificationService, all 9 verification method classes
         (AgeVerifiedMethod, CoupleVerifiedMethod, InPersonVerifiedMethod, IntentVerifiedMethod,
          LiveVerifiedMethod, PartnerConsentVerifiedMethod, PhoneVerifiedMethod,
          SessionVerificationMethod, SocialVerifiedMethod),
         VerificationAbstractions.cs, VerificationServiceCollectionExtensions.cs,
         Models: UserVerification, VerificationAttempt, VerificationEvent,
         DTOs: VerificationDtos.cs.
Cross-service: CoupleVerifiedMethod needs couple info — call couple-svc GET /api/internal/couples/by-member/{userId}.
               Add that endpoint to couple-svc.
DbContext: VerificationDbContext. Port: 5211. Gateway: /api/verifications/** → verification cluster.

--- NOTIFICATION SERVICE (backend/ThirdWheel.Notifications/) ---
Extract: NotificationController, the DB-persistence side of NotificationService (write Notification rows),
         Models: Notification, DTOs: NotificationDtos.cs.
The SignalR push side stays in chat-svc.
NotificationService in this service:
  - Consumes UserMatched, ImpressMeAccepted events from RabbitMQ.
  - Writes a Notification row.
  - Publishes SendPushNotification so chat-svc delivers it via SignalR.
DbContext: NotificationsDbContext with Notifications. Port: 5209.
Gateway: /api/notifications/** → notifications cluster.

OUTPUT: Describe the full event flow for "User A likes User B back → mutual match → push notification"
        across all services after this phase.
```

---

### AGENT PROMPT — Phase 6: Admin Service

```
TASK: Extract the Admin microservice from the Third Wheel monolith.

REPO ROOT: /Users/yasvanthudayakumar/Documents/Triad

PRE-REQUISITES: All Phase 1-5 services running.

EXTRACT to backend/ThirdWheel.Admin/:
- Controller: AdminController
- No models owned — admin is pure aggregation.
- DTOs: admin-specific response shapes (inline or in separate AdminDtos.cs).

AdminController endpoints and their new data sources:

GET /api/admin/users → call identity-svc GET /api/internal/users (paginated, with filters)
GET /api/admin/online-users → call chat-svc GET /api/internal/online-users
GET /api/admin/moderation-analytics → call safety-svc GET /api/internal/moderation/analytics
  Add that endpoint to safety-svc returning { totalReports, totalBlocks, reportsByReason[], recentReports[] }.
GET /api/admin/users/{userId} → fanout calls to:
  identity-svc for profile,
  safety-svc for moderation summary,
  verification-svc for verification status,
  matching-svc for match count.
  Aggregate into AdminUserDetailResponse.
DELETE /api/admin/seed-users → call each service's internal DELETE /api/internal/seed-data endpoint.
  Each service deletes its own seed data (all rows whose email ends in @triad.dev).
  Add DELETE /api/internal/seed-data to: identity, couple, matching, chat, safety, events, impress, notify, verification, saved.
DELETE /api/admin/seed-events → call events-svc DELETE /api/internal/seed-data.
POST /api/admin/seed-user → call identity-svc POST /api/internal/users/seed { username, email, password }.
  Add that endpoint to identity-svc.

Admin service has no DbContext.
Use Parallel.ForEachAsync or Task.WhenAll for fanout calls to keep latency low.
Implement a lightweight circuit-breaker (Polly v8 ResiliencePipeline) on each HTTP client:
  - 3 retries with exponential backoff (100ms base)
  - Circuit breaks after 5 consecutive failures

Port: 5212. Dockerfile + docker-compose entry.
Gateway: route /api/admin/** → admin cluster.

OUTPUT: List all new internal endpoints added to other services as part of this phase.
```

---

### AGENT PROMPT — Phase 7: DB Schema Separation

```
TASK: Split the shared PostgreSQL database into per-service schemas.
This is the final phase. All services must be independently deployable after this.

REPO ROOT: /Users/yasvanthudayakumar/Documents/Triad

CURRENT STATE:
- All DbContexts read from the same PostgreSQL database (same schema "public").
- Migrations are in the monolith project.
- Each service has its own DbContext pointing to a subset of tables.

WHAT TO DO:

1. For each service DbContext, add HasDefaultSchema("<service>") in OnModelCreating:
   - IdentityDbContext → schema "identity"
   - CoupleDbContext → schema "couple"
   - MatchingDbContext → schema "matching"
   - ChatDbContext → schema "chat"
   - SafetyDbContext → schema "safety"
   - EventsDbContext → schema "events"
   - ImpressMeDbContext → schema "impress"
   - NotificationsDbContext → schema "notify"
   - SavedDbContext → schema "saved"
   - VerificationDbContext → schema "verification"

2. For each service, run dotnet ef migrations add InitialSchema to generate the first
   service-owned migration. These migrations create tables in the correct schema.

3. Create a one-time data migration script (SQL, not code):
   /scripts/db-migrate-to-schemas.sql
   For each table, issue:
     CREATE TABLE <schema>.<table> AS SELECT * FROM public.<table>;
     ALTER TABLE <schema>.<table> ADD PRIMARY KEY (...);
     -- re-add FK constraints, indexes
   Then:
     ALTER TABLE public.<table> RENAME TO <table>_migrated_backup;
   Run in a transaction. Rollback if any step fails.

4. Update connection strings per service if using separate databases (optional):
   If keeping one PG instance with multiple schemas, all services share the same
   connection string. Just the schema differs.
   If moving to separate PG databases per service:
   - Add one postgres service per schema in docker-compose.yml (or use one PG with CREATE DATABASE).
   - Update ConnectionStrings__DefaultConnection per service container.

5. Remove all dead code from the monolith ThirdWheel.API:
   - Delete controllers, services, models that have been fully extracted.
   - If the monolith csproj is now empty of logic, delete it entirely and update docker-compose.yml
     to remove the api service and the gateway's monolith cluster.

6. Update all integration tests in tests/ to target individual service URLs or
   a gateway-aware test setup.

7. Update seed.ps1 $BaseUrl:
   - It still targets the gateway (http://localhost:5127/api) — no change needed.
   - The gateway routes internally.

OUTPUT: The SQL migration script and a list of which services now own which DB schemas.
        Flag any FK that crosses schema boundaries (these become the cross-service HTTP calls
        that replace DB-level joins).
```

---

## Checklist (track per phase)

- [ ] Phase 0 — Gateway (YARP)
- [ ] Phase 1 — Identity (Auth + Profile)
- [ ] Phase 2 — Safety + Matching
- [ ] Phase 3 — Chat (Messaging + SignalR + Redis)
- [ ] Phase 4 — Couples, Discovery, Saved, Events
- [ ] Phase 5 — ImpressMe, Verification, Notifications
- [ ] Phase 6 — Admin
- [ ] Phase 7 — DB Schema Separation

## Key Packages Per Service

| Package | Services |
|---|---|
| `Yarp.ReverseProxy` | gateway only |
| `MassTransit.RabbitMQ` | matching, safety, impress, notify, chat |
| `ThirdWheel.Contracts` (local project) | all event producers/consumers |
| `Microsoft.Extensions.Caching.StackExchangeRedis` | chat |
| `StackExchange.Redis` | chat |
| `Polly` (v8 via `Microsoft.Extensions.Http.Resilience`) | admin, discovery |
| `SixLabors.ImageSharp` | identity only |
| `BCrypt.Net-Next` | identity only |

## What Does NOT Change

- JWT signing key, issuer, audience — same across all services
- Client URLs — all traffic still enters via `localhost:5127`
- `seed.ps1` — targets gateway, no change needed
- iOS `AppConfig.swift` — base URL unchanged
- Admin Next.js `src/lib/api.ts` — base URL unchanged
- OpenTelemetry config — copy per service, same OTLP endpoint env var
- Rate limiting — keep per service (each enforces its own limit)
