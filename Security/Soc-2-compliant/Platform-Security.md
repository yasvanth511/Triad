# Platform Security — SOC 2 Type II Reference

**Product:** Triad  
**Document owner:** Security Engineering  
**Last reviewed:** 2026-04-24  
**Applicable TSC:** CC1 (Control Environment), CC2 (Communication), CC3 (Risk Assessment), CC4 (Monitoring), CC5 (Control Activities), CC6 (Logical Access), CC7 (System Operations), CC8 (Change Management)

---

## 1. Scope

This document covers the platform security posture of all active Triad surfaces:

| Surface | Technology | Deployed Via |
|---|---|---|
| `backend/ThirdWheel.API` | ASP.NET Core 10, PostgreSQL, SignalR | Docker container / OCI registry |
| `IOSNative/ThirdWheelNative` | SwiftUI iOS | Apple App Store |
| `web/triad-web` | Next.js 16, React 19 | Vercel / Docker |
| `web/triad-business` | Next.js 16, React 19 | Vercel / Docker |
| `admin/nextjs-admin` | Next.js static export | Vercel / Admin.Host |
| Infrastructure | Docker Compose, PostgreSQL, local disk | Self-hosted / Supabase |

---

## 2. Authentication

### 2.1 Consumer Authentication

| Control | Implementation | Status |
|---|---|---|
| Mechanism | Email + password with JWT bearer token | **Implemented** |
| Password hashing | BCrypt via `BCrypt.Net.BCrypt.HashPassword()` | **Implemented** |
| JWT signing algorithm | HS256 (symmetric HMAC-SHA256) | **Implemented** |
| JWT validation | Issuer, audience, lifetime, signing key all validated | **Implemented** |
| JWT clock skew | 30 seconds (tighter than default 5-minute) | **Implemented** |
| Token lifetime | 7 days (`TokenExpiryDays = 7` in `AppConstants`) | **Implemented** |
| Token storage — iOS | iOS Keychain via `KeychainTokenStore.swift` | **Implemented** |
| Token storage — web | Browser memory / session; not persisted to localStorage | **Implemented** |
| Token revocation | **Not implemented** | **GAP** — see SEC_005 |
| Refresh tokens | **Not implemented** | **GAP** — long-lived tokens without rotation |
| Account lockout | **Not implemented** | **GAP** — see SEC_004 |
| Email verification on registration | **Not implemented** | **GAP** — see SEC_011 |
| Password strength policy | **Not visible in code** | **GAP** — see SEC_012 |
| Multi-factor authentication (MFA) | **Not implemented** | **GAP** |

### 2.2 Admin Authentication

The admin dashboard uses a separate JWT issued via `POST /api/admin/auth/login`. The token is stored in `localStorage` under `triad.admin.token` and sent as a bearer token on admin API requests.

**Critical issue:** Four admin read endpoints override class-level `[Authorize]` with `[AllowAnonymous]`:

| Endpoint | Exposed Data | Severity |
|---|---|---|
| `GET /api/admin/users` | Full user roster (username, couple, verification count, ban status) | **CRITICAL** |
| `GET /api/admin/users/{userId}` | Individual user detail including report history and verification status | **CRITICAL** |
| `GET /api/admin/online-users` | Real-time list of currently online users | **CRITICAL** |
| `GET /api/admin/moderation-analytics` | Aggregate block/report counts and reason breakdowns | **HIGH** |

See `TODO/SEC_001_Fix_Admin_AllowAnonymous.md`.

### 2.3 Business Partner Authentication

Business partners authenticate via `POST /api/auth/business/register` and `POST /api/auth/login`. The `[Authorize(Policy = "BusinessOnly")]` policy is applied to business portal routes. Admin approval is required before business accounts gain portal access.

### 2.4 SignalR (Real-Time Chat) Authentication

`[Authorize]` is applied at the hub class level. JWT is extracted from the `access_token` query string parameter per SignalR WebSocket upgrade requirements:

```csharp
options.Events = new JwtBearerEvents {
    OnMessageReceived = ctx => {
        var token = ctx.Request.Query["access_token"];
        ctx.Token = token;
    }
};
```

**Gap:** JWT in query string is logged by web servers, appears in browser history, referrer headers, and proxy logs. See `TODO/SEC_009_JWT_SignalR_Header_Auth.md`.

---

## 3. Authorization

### 3.1 Role Model

Roles are defined in `AppConstants.cs`:

| Role | Policy | Intended Use |
|---|---|---|
| `User` | `UserOnly` | Standard consumer app users |
| `Business` | `BusinessOnly` | Business partner portal access |
| `Admin` | `AdminOnly` | Internal admin dashboard |

Roles are embedded in JWT claims at issuance and validated via ASP.NET Core policy middleware.

### 3.2 Authorization Controls by Surface

| Surface | Control | Status |
|---|---|---|
| Consumer API endpoints | `[Authorize]` on controllers; user ID from JWT claims | **Implemented** |
| Admin API endpoints | `[Authorize(Policy = "AdminOnly")]` — but see critical gap above | **Broken on reads** |
| Business API endpoints | `[Authorize(Policy = "BusinessOnly")]` | **Implemented** |
| Profile media ownership | Service layer verifies `userId == photo.UserId` before delete | **Implemented** |
| Match participation | ChatHub verifies sender is a match participant before group join | **Implemented** |
| Uploaded media access | `/uploads/*` — **no authentication required** | **GAP** — see SEC_016 |

### 3.3 Privilege Escalation Risks

- Seed admin access gated by hardcoded email `yasvanth@live.in` in `AdminController.cs`. No policy or role check — relies on string comparison.
- No least-privilege separation within admin role (all admins can perform all admin operations including destructive seed operations).

---

## 4. Input Validation And Injection Prevention

### 4.1 API Input Validation

| Control | Status | Detail |
|---|---|---|
| Model binding validation | **Assumed via Data Annotations** | Not verified in code scan; DTOs may use `[Required]`, `[MaxLength]` etc. |
| SQL injection — ORM | **Implemented** | EF Core parameterized queries for all standard operations |
| SQL injection — raw SQL | **Partial** | `ExecuteSqlRawAsync` used in seed operations; seed email is a constant but pattern is risky |
| XSS on API responses | **Out of scope for API** | API returns JSON; XSS is a client responsibility |
| File upload type validation | **Partial** | Image processing via SixLabors.ImageSharp fails on non-image bytes; video/audio not similarly validated |
| File size limits | **Implemented** | 10 MB audio, 50 MB video, 5 photos, 3 videos (enforced in `AppConstants`) |
| Message length limits | **Implemented** | 2000 chars per message, 500 char bio |
| Spam content filtering | **Implemented — Weak** | Keyword blocklist + link regex; easily bypassed; see SEC_006 |
| CSRF protection | **Not implemented** | No CSRF token on state-changing operations | 

### 4.2 Business Logic Validation

| Limit | Value | Enforced |
|---|---|---|
| Max likes per day | 50 | `AppConstants.MaxLikesPerDay` — verify enforcement in `MatchingService` |
| Impress Me daily quota | 5 | `AppConstants.ImpressMe.DailyQuota` |
| Impress Me max active outbound | 10 | `AppConstants.ImpressMe.MaxActiveOutbound` |
| Spam strikes before ban | 3 | `AppConstants.SpamStrikesBeforeBan` — automatic ban with no human review |

**Concern:** Automatic banning at 3 spam strikes without human review could enable ban-by-proxy attacks (adversary engineers spam flags on victim's account). See `TODO/SEC_014_Ban_Review_Workflow.md`.

---

## 5. Rate Limiting And Abuse Prevention

### 5.1 Current Rate Limiting

| Control | Configuration | Status |
|---|---|---|
| Global API rate limiter | 120 requests / 60 seconds per IP (sliding window) | **Implemented** |
| Per-endpoint rate limiting | **Not implemented** | All endpoints share the same global limit |
| Registration endpoint throttling | Relies on global limit only | **GAP** — brute-force registration possible |
| Login endpoint throttling | Relies on global limit only | **GAP** — password brute-force possible within 120 req/60s |
| Report submission throttling | No separate limit | **GAP** |
| Verification attempt limiting | No separate limit | **GAP** |
| SignalR message rate limiting | Not implemented | **GAP** |

See `TODO/SEC_013_Per_Endpoint_Rate_Limiting.md`.

### 5.2 Anti-Spam Service

`AntiSpamService` detects:
- Known platform names (OnlyFans, Telegram, etc.) — substring match, easily bypassed
- URL patterns via regex
- Repeated identical messages (MD5 hash comparison within 5-minute window, 3 triggers)

**Weaknesses:**
- MD5 is cryptographically broken — replace with SHA-256 (SEC_006)
- In-memory cache (`IMemoryCache`) lost on process restart — spam state not durable
- No IP or device fingerprinting — spam per-user only
- No ML or n-gram similarity detection for near-duplicate messages

---

## 6. Network And Infrastructure Security

### 6.1 Docker Compose Infrastructure

| Service | Host Port | Network | Notes |
|---|---|---|---|
| API | 5127 | `ipv6net` | Exposed to host |
| Admin | 5173 | `ipv6net` | Exposed to host |
| Web | 3000 | `ipv6net` | Exposed to host |
| Business | 3002 | `ipv6net` | Exposed to host |
| Marketing site | 3003 | `ipv6net` | Exposed to host |

**Gaps:**
- All services expose ports to host; no network-level ingress/egress policies.
- No Docker secrets mechanism; credentials passed via `.env.docker` file.
- No container image vulnerability scanning configured.
- No memory/CPU limits on containers.
- No read-only root filesystem on containers.
- No Docker health checks in `docker-compose.yml` (health endpoint exists in API code but not wired into compose). See `TODO/SEC_015_Docker_Health_Checks.md`.

### 6.2 TLS / HTTPS

| Control | Status | Detail |
|---|---|---|
| HTTPS redirect in production | **Implemented** | `app.UseHttpsRedirection()` active when not in development |
| TLS version | **Inherited** | Relies on Kestrel / reverse proxy defaults (TLS 1.2+ expected) |
| HSTS | **Not explicitly configured** | Not observed in middleware setup |
| Certificate management | **Not in repo** | Managed externally (Supabase, Vercel, reverse proxy) |
| iOS TLS pinning | **Not implemented** | App trusts system certificate store |

---

## 7. Secrets Management

### 7.1 Current State — CRITICAL GAPS

| Secret | Location | Risk |
|---|---|---|
| PostgreSQL connection string + password | `appsettings.Development.json`, `.env.docker` | Credentials in version control |
| JWT signing key | `appsettings.Development.json`, `.env.docker` | Signing key in version control |
| Default admin password | `Program.cs` (seed block) | Hardcoded `admin@123` |
| Seed admin email | `AdminController.cs` | PII in source code |

### 7.2 Required Controls for SOC 2

| Control | Required | Status |
|---|---|---|
| Secrets in environment variables only (not source code) | Yes | **Not met** |
| Secrets rotation mechanism | Yes | **Not implemented** |
| Secrets stored in vault (e.g., HashiCorp Vault, AWS Secrets Manager) | Yes for production | **Not implemented** |
| `.gitignore` on all `.env*` files | Yes | Verify `.gitignore` coverage |
| Key length | Min 32 chars for JWT | **Enforced at startup** |

See `TODO/SEC_002_Secrets_Vault_Management.md` and `TODO/SEC_003_Remove_Hardcoded_Credentials.md`.

---

## 8. Observability And Monitoring

### 8.1 Current Instrumentation

| Area | Tool | Status |
|---|---|---|
| ASP.NET Core request tracing | OpenTelemetry | **Implemented** |
| EF Core query tracing | OpenTelemetry | **Implemented** |
| Outbound HTTP tracing | OpenTelemetry | **Implemented** |
| Runtime metrics | OpenTelemetry | **Implemented** |
| Structured application logs | OpenTelemetry | **Implemented** |
| Console exporter (dev) | Enabled | **Implemented** |
| OTLP exporter (prod) | Activates when `OTEL_EXPORTER_OTLP_ENDPOINT` set | **Conditional** |
| Security event logging | **Not implemented** | No dedicated security event stream |
| Failed login attempt logging | **Partial** | OpenTelemetry tags on login, not a queryable security log |
| Admin action audit log | **Not implemented** | No immutable log of admin data access |
| Alerting / anomaly detection | **Not implemented** | No alerting rules defined |

### 8.2 SOC 2 Requirements

SOC 2 CC7.1-CC7.3 requires that security events are detected, logged, and responded to. The platform currently lacks:
- A queryable security event log separate from application telemetry
- Alerting on brute-force login attempts, high-rate API abuse, or admin data dumps
- Immutable audit records for admin and business partner actions

See `TODO/SEC_007_Immutable_Audit_Log.md`.

---

## 9. Vulnerability And Patch Management

### 9.1 Dependencies

| Surface | Package Manager | Status |
|---|---|---|
| Backend | NuGet (`.csproj`) | No automated vulnerability scanning configured |
| iOS | Swift Package Manager | No automated scanning |
| Web apps | npm / `package-lock.json` | No Dependabot or `npm audit` CI step observed |

### 9.2 Known Cryptographic Issues

| Issue | Location | Severity |
|---|---|---|
| MD5 usage | `AntiSpamService.cs` — `MD5.HashData()` for message fingerprinting | **Medium** — not used for security but sets a bad precedent |

### 9.3 CI/CD Security

No CI/CD pipeline configuration was found in the repository. The absence of automated testing, linting, and SAST in CI is itself a SOC 2 gap (CC8 — Change Management).

See `TODO/SEC_021_SAST_And_Dependency_Scanning.md`.

---

## 10. Change Management

### 10.1 Current State

| Control | Status |
|---|---|
| Git-based version control | **Implemented** |
| Branch protection rules | **Not documented in repo** |
| Code review requirement | **Not documented** |
| Automated test gate before merge | **No CI pipeline found** |
| Deployment approval workflow | **Not documented** |

### 10.2 SOC 2 Requirement (CC8)

SOC 2 CC8.1 requires that changes are authorized, tested, and approved before deployment. The absence of a CI/CD pipeline with test gates and a documented approval process is a gap.

---

## 11. Backup And Recovery

### 11.1 Current State

| Control | Status | Detail |
|---|---|---|
| Database backup | **Not documented** | Supabase provides automated backups; restore procedure not documented |
| Media backup | **Not implemented** | `uploads/` volume has no backup policy |
| RTO / RPO targets | **Not defined** | No availability SLA exists |
| Disaster recovery plan | **Not implemented** | No DR runbook in repo |

See `TODO/SEC_020_Backup_And_Recovery_Plan.md`.

---

## 12. Verification Provider Security

All eight verification methods (`live_verified`, `age_verified`, `phone_verified`, `couple_verified`, `partner_consent_verified`, `intent_verified`, `in_person_verified`, `social_verified`) are currently in **mock mode** per `appsettings.json`:

```json
"Settings": { "mode": "mock" }
```

Production deployment requires:
- Real provider credentials per method
- Secure credential storage (not in `appsettings.json`)
- Vendor security review for each provider
- Incident response procedure if a provider is compromised

See `TODO/SEC_010_Enable_Verification_Providers.md`.

---

## 13. Mobile Client Security

| Control | Status | Detail |
|---|---|---|
| JWT in Keychain | **Implemented** | `KeychainTokenStore.swift` |
| Certificate pinning | **Not implemented** | Trusts system roots |
| Jailbreak detection | **Not implemented** | No jailbreak/root check |
| App Transport Security (ATS) | **Default iOS behavior** | Requires HTTPS; exceptions not audited |
| Biometric authentication | **Not implemented** | No biometric app lock |
| Screenshot prevention | **Not implemented** | No `UIScreen.main.isCaptured` check |
| API base URL override | `APIBaseURL` in `Info.plist` | Overridable on physical device; verify no debug builds ship this |

---

## 14. Third-Party Security

| Vendor | Integration | Risk | Current Control |
|---|---|---|---|
| Supabase | Hosted PostgreSQL | Full data store | SSL required; credentials in version control (CRITICAL gap) |
| Vercel | Web/admin deployment | Code and environment secrets | Standard Vercel env var isolation |
| Apple | App distribution | Binary signing | Standard developer account; no additional controls |
| SixLabors.ImageSharp | Image processing | DoS via malformed images | Library validates format; version should be current |
| BCrypt.Net-Next | Password hashing | Credential compromise | Strong hash function; version should be current |

No vendor security review or third-party risk assessment process is documented.

---

## 15. Controls Summary — Platform Security

| SOC 2 Criteria | Control | Status | Key Gap |
|---|---|---|---|
| CC1.2 | Board / management oversight | **Not documented** | No security governance structure defined |
| CC2.2 | Security policies communicated | **Partial** | `AGENTS.md` has security rules; no formal security policy |
| CC3.1 | Risk assessment | **Not performed** | No formal risk register |
| CC4.1 | Monitoring activities | **Partial** | OpenTelemetry present; no security event alerting |
| CC5.1 | Control activities | **Partial** | Some controls implemented; many gaps documented in TODO |
| CC6.1 | Logical access controls | **Broken** | Admin read endpoints unauthenticated |
| CC6.2 | New user provisioning | **Partial** | JWT-based; no MFA, no email verification |
| CC6.3 | Role registration and authorization | **Implemented** | Three-role model with policies |
| CC6.6 | Security threats addressed | **Partial** | Rate limiting, BCrypt, HTTPS present |
| CC6.7 | Transmission encryption | **Partial** | HTTPS enforced; JWT in query string for SignalR |
| CC6.8 | Malicious software prevention | **Not implemented** | No file scanning on uploads |
| CC7.1 | System security monitoring | **Partial** | Telemetry present; no security alerting |
| CC7.2 | Security events evaluated | **Not implemented** | No security event triage process |
| CC7.3 | Security incidents identified | **Not implemented** | No incident response plan |
| CC8.1 | Change management | **Not documented** | No CI pipeline, no PR approval gates |
| CC9.1 | Risk mitigation | **Not documented** | No formal vendor/third-party risk process |

---

## 16. Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | Security Engineering | Initial draft from codebase assessment |
