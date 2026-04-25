# Data Security — SOC 2 Type II Reference

**Product:** Triad  
**Document owner:** Security Engineering  
**Last reviewed:** 2026-04-24  
**Applicable TSC:** CC6 (Logical Access), CC7 (System Operations), C1 (Confidentiality), PI1 (Processing Integrity)

---

## 1. Scope

This document covers the data security posture of the Triad platform across all active surfaces:

- `backend/ThirdWheel.API` — ASP.NET Core 10 API (PostgreSQL via Npgsql)
- `IOSNative/ThirdWheelNative` — native SwiftUI iOS client
- `web/triad-web` — consumer Next.js web app
- `web/triad-business` — business partner portal
- `admin/nextjs-admin` — internal admin dashboard
- Local and container-based media storage under `uploads/`

---

## 2. Data Classification

| Classification | Description | Examples in Triad |
|---|---|---|
| **Critical** | Credentials and signing keys | `Jwt__Key`, `ConnectionStrings__DefaultConnection`, BCrypt password hashes |
| **Restricted — PII** | Directly identifies a user | Email address, phone number, exact GPS coordinates |
| **Restricted — Sensitive** | Indirectly sensitive; harmful if exposed | Approximate location (lat/lon rounded to 2 dp), age, relationship type, sexual preference, political views, ethnicity, religion, intimate comfort level |
| **Internal** | Operational data not for public consumption | Match records, block/report history, verification status, spam warnings, admin analytics |
| **Public** | Intentionally visible to other users | Display name, bio, photos, interests, video highlights, audio bio URL, verification badges |

### 2.1 PII Inventory

| Field | Table / Location | Classification | Current Protection |
|---|---|---|---|
| Email | `Users.Email` | Restricted — PII | Indexed plaintext in PostgreSQL |
| Password hash | `Users.PasswordHash` | Critical | BCrypt hashed (irreversible) |
| Latitude / Longitude | `Users.Latitude`, `Users.Longitude` | Restricted — PII | EF precision limited to 2 decimal places (~1 km grid) |
| Phone number | Verification attempt data | Restricted — PII | Stored in JSON blob in `VerificationEvents` |
| Photos (faces) | `uploads/` + `UserPhotos.Url` | Restricted — Sensitive | Local disk; no encryption at rest |
| Audio bio | `uploads/` + `Users.AudioBioUrl` | Restricted — Sensitive | Local disk; no encryption at rest |
| Device JWT | iOS Keychain / browser memory | Critical | Keychain on iOS; not persisted to disk on web |
| Business partner email | `BusinessPartners` | Restricted — PII | Indexed plaintext in PostgreSQL |

### 2.2 Data Residency

- PostgreSQL database: configured via `ConnectionStrings__DefaultConnection` environment variable. Current default targets Supabase (hosted PostgreSQL). Region must be confirmed and documented for each deployment environment.
- Uploaded media: stored on container local disk under `uploads/`. No object storage (S3/GCS/Azure Blob) integration exists today.
- No cross-border transfer controls are currently implemented.

---

## 3. Data at Rest

### 3.1 Current State

| Control | Status | Detail |
|---|---|---|
| Database encryption at rest | **Not configured** | Relies on Supabase/PostgreSQL host-level encryption if enabled by the hosting provider |
| Field-level encryption | **Not implemented** | Email, coordinates, and PII fields stored in plaintext |
| Media file encryption | **Not implemented** | Files in `uploads/` stored unencrypted on container disk |
| Password storage | **Implemented** | BCrypt with implicit work factor (~12 rounds) via `BCrypt.Net.BCrypt.HashPassword()` |
| JWT signing key at rest | **At risk** | `Jwt__Key` present in `.env.docker` and `appsettings.Development.json` in version control |

### 3.2 SOC 2 Requirement

SOC 2 CC6.1 requires that logical access to data at rest is restricted and that sensitive data is protected. Field-level or disk-level encryption of PII is expected. See `TODO/SEC_008_Field_Level_Encryption_PII.md`.

---

## 4. Data in Transit

| Control | Status | Detail |
|---|---|---|
| HTTPS enforcement | **Implemented** | `app.UseHttpsRedirection()` active in production (`!IsDevelopment()`) |
| TLS version | **Inherited from host** | Not explicitly pinned; depends on Kestrel/reverse proxy defaults |
| SignalR WebSocket | **Partial** | JWT passed as query string parameter `?access_token=` — exposes token in logs and referrer headers |
| iOS TLS | **Inherited from iOS** | No certificate pinning implemented |
| Internal API to DB | SSL Mode=Require in current connection string | Relies on correct env configuration |

### 4.1 SOC 2 Requirement

SOC 2 CC6.7 requires that transmission of sensitive data uses encryption. The SignalR JWT-in-query-string pattern is a gap. See `TODO/SEC_009_JWT_SignalR_Header_Auth.md`.

---

## 5. Data Retention And Deletion

### 5.1 Current State

No formal data retention policy is implemented. The platform has:

- `DELETE /api/profile` — permanent account deletion endpoint
- `DELETE /api/couple` — couple record deletion
- Admin seed cleanup via `DELETE /api/admin/seed-users`
- No automated purge jobs for expired tokens, old notifications, or lapsed verification attempts
- No documented retention schedule for user photos, messages, or match history

### 5.2 Applicable Limits (Current Business Rules)

| Data Type | Current Handling |
|---|---|
| JWT sessions | Expire after 7 days (stateless; no server-side revocation) |
| Impress Me signals | Expire after 48 hours (logical expiry, row may persist) |
| Live / age verifications | Expire after 365 days (logical expiry) |
| Uploaded media | No TTL; persists until user deletes profile or manually removes media |
| Messages | No TTL; persist indefinitely in `Messages` table |
| Block / report records | No TTL; persist indefinitely |

### 5.3 SOC 2 Requirement

SOC 2 C1.2 requires documented retention and disposal procedures. See `TODO/SEC_018_Data_Retention_Policy.md`.

---

## 6. Access Control — Data Layer

### 6.1 Database Access

| Role | Access | Control Mechanism |
|---|---|---|
| API application user | Read/write all tables | Single PostgreSQL credential in connection string |
| Admin dashboard | Read via `/api/admin/*` | Requires admin JWT; returns admin-safe summaries only |
| Developer (local) | Direct DB access | Local `.env.docker` credentials |
| No read replicas or row-level security (RLS) | — | PostgreSQL RLS not configured |

### 6.2 Application-Level Access

| Control | Status | Detail |
|---|---|---|
| Users can only read/write their own profile | **Implemented** | `userId` extracted from JWT claims, not from request body |
| Admin endpoints restricted to admin role | **BROKEN** | `[AllowAnonymous]` on `GET /api/admin/users`, `GET /api/admin/online-users`, `GET /api/admin/moderation-analytics`, `GET /api/admin/users/{userId}` — these return user data without any authentication |
| Business endpoints restricted to business role | **Implemented** | `[Authorize(Policy = "BusinessOnly")]` on business portal routes |
| Profile media ownership checks | **Implemented** | Media delete verifies ownership before deletion |

**Critical gap:** Admin read endpoints are unauthenticated. Any actor with network access to the API can enumerate users, view online presence, and read moderation statistics. See `TODO/SEC_001_Fix_Admin_AllowAnonymous.md`.

### 6.3 Media / Uploads Access

- Uploaded files served from `/uploads/*` with no authentication check.
- Any actor who knows or can guess a file URL can access it.
- No pre-signed URL mechanism or expiry on media links.
- See `TODO/SEC_016_Authenticated_Media_Access.md`.

---

## 7. Sensitive Data Handling In Code

### 7.1 Secrets In Version Control (CRITICAL)

| File | Sensitive Content | Risk |
|---|---|---|
| `appsettings.Development.json` | Live Supabase connection string including password, weak JWT key | Credentials leaked if repo is cloned or made public |
| `.env.docker` | Same Supabase credentials, JWT key | Same risk |
| `AdminController.cs` | Hardcoded email `yasvanth@live.in` as seed admin gate | PII embedded in source |
| `Program.cs` | Default admin password `admin@123` in seed block | Weak default if dev seed runs in production |

See `TODO/SEC_003_Remove_Hardcoded_Credentials.md` and `TODO/SEC_019_Secrets_Rotation.md`.

### 7.2 Logging And Telemetry

| Control | Status | Detail |
|---|---|---|
| OpenTelemetry instrumentation | **Implemented** | ASP.NET Core, EF Core, HTTP client traces |
| Console exporter in development | **Implemented** | Traces written to stdout — risk of credential/PII leakage in dev logs |
| Sensitive fields in logs | **Not audited** | No explicit log scrubbing for email, coordinates, tokens |
| Immutable audit log | **Not implemented** | No append-only audit trail for data access events |

See `TODO/SEC_007_Immutable_Audit_Log.md`.

### 7.3 Spam Detection Hashing

`AntiSpamService` uses `MD5.HashData()` to fingerprint repeated messages. MD5 is cryptographically broken and unsuitable even for non-cryptographic integrity checks in a security-reviewed codebase. See `TODO/SEC_006_Replace_MD5_AntiSpam.md`.

---

## 8. User Consent And Privacy

| Control | Status | Detail |
|---|---|---|
| Profile deletion | **Implemented** | `DELETE /api/profile` removes user and related data |
| Location privacy | **Implemented** | Coordinates stored at ~1 km resolution (2 dp precision) |
| Red flags visible to matches | **By design** | Red flags are user-authored and intentionally surfaced |
| No privacy policy linkage | **Not implemented** | No in-app or API-level consent capture or versioning |
| No GDPR right-to-erasure automation | **Not implemented** | Manual deletion only via profile delete endpoint |

---

## 9. Third-Party Data Processors

| Processor | Data Shared | Current Control |
|---|---|---|
| Supabase (PostgreSQL host) | All user PII and platform data | Connection string in env; SSL required in current config |
| Vercel (web/admin/business deploy) | Request logs, build artifacts | No DPA documented |
| Apple App Store | App binary, analytics opt-in | Standard Apple developer agreement |
| Verification providers | PII for identity checks | All currently in **mock mode**; no live vendor integration |

No formal Data Processing Agreements (DPAs) are documented in the repository.

---

## 10. Incident Response — Data Breach

No incident response plan exists in the repository today.

Minimum required elements for SOC 2:

- Breach detection procedure (monitoring alerts + escalation)
- Notification timeline (SOC 2 does not mandate specifics but GDPR requires 72 hours)
- Communication template for affected users
- Post-incident review process
- Evidence preservation procedure

See `TODO/SEC_020_Incident_Response_Plan.md`.

---

## 11. Controls Summary — Data Security

| SOC 2 Criteria | Control | Status | Gap |
|---|---|---|---|
| CC6.1 | Logical access to data restricted | **Partial** | Admin read endpoints unauthenticated; media files publicly accessible |
| CC6.5 | Logical access removed when no longer needed | **Not implemented** | No session revocation; no offboarding process |
| CC6.7 | Transmission encryption | **Partial** | HTTPS enforced; JWT in query string on SignalR |
| C1.1 | Data classified and protected | **Not implemented** | No classification schema enforced in code or infra |
| C1.2 | Retention and disposal | **Not implemented** | No documented retention schedule or purge jobs |
| PI1.2 | Input validation | **Partial** | BCrypt on passwords; no password strength policy; no CAPTCHA |
| A1.1 | Availability commitments | **Not documented** | No SLA or uptime target defined |

---

## 12. Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | Security Engineering | Initial draft from codebase assessment |
