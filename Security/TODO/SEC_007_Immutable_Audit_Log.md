# SEC_007 — Implement Immutable Audit Log

**Severity:** HIGH  
**SOC 2 Criteria:** CC4.1, CC7.1, CC7.2  
**Status:** Open  
**Effort:** Large (3–5 days)

---

## Problem

The platform has no immutable audit trail for security-relevant events. OpenTelemetry telemetry captures request traces but:

- It is not queryable as a security log.
- It can be modified or deleted by anyone with access to the OTLP backend.
- Admin data access (who read which user's profile, when) is not logged at all.
- Business partner actions (event approval, reward issuance) are partially logged in `BusinessAuditLog` but this table is mutable.

SOC 2 CC7.2 requires that security events are logged and reviewed. CC4.1 requires monitoring activities be performed. Without an audit log, the organization cannot demonstrate compliance or investigate incidents.

## Events That Must Be Audited

| Category | Events |
|---|---|
| Authentication | Login success, login failure, logout, token refresh, account lockout |
| Authorization | Admin endpoint access (who accessed which endpoint, when) |
| Profile data | Profile read by admin, profile update, profile deletion |
| Safety | Block, unblock, report submission, ban, unban |
| Admin actions | Seed operations, user detail views, moderation analytics queries |
| Business | Partner approval/rejection/suspension, event approval/rejection, reward issuance |
| Verification | Attempt started, attempt completed, attempt failed |
| Media | Photo/video/audio upload, delete |

## Required Audit Log Entry Fields

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Unique event ID |
| `occurred_at` | DateTimeOffset | UTC timestamp (server-generated) |
| `actor_id` | UUID? | User or admin who performed the action |
| `actor_role` | string | `User`, `Admin`, `Business`, `System` |
| `action` | string | Enum: `login.success`, `admin.users.list`, etc. |
| `target_type` | string? | `User`, `Match`, `BusinessEvent`, etc. |
| `target_id` | UUID? | ID of the affected entity |
| `ip_address` | string | Source IP (from X-Forwarded-For or remote IP) |
| `user_agent` | string | Client User-Agent |
| `result` | string | `success`, `failure`, `denied` |
| `detail` | jsonb | Optional additional context |

## Fix

### Phase 1 — Append-Only Table

1. Create `AuditLog` table in PostgreSQL with an append-only constraint (trigger or DB role that prevents UPDATE and DELETE on this table).
2. Create `AuditLogService` that writes entries asynchronously (fire-and-forget via a background queue to avoid blocking request threads).
3. Inject `AuditLogService` into `AuthController`, `AdminController`, `SafetyController`, and `BusinessController`.

### Phase 2 — External Immutable Log (for Full SOC 2)

For a fully immutable audit trail that cannot be tampered with even by a database administrator, ship audit events to an external append-only store:
- AWS CloudTrail / CloudWatch Logs
- Datadog Audit Logs
- A write-only S3 bucket with Object Lock enabled

### Immediate Step

At minimum, audit all admin endpoint accesses (who, what, when, from where) in `AdminController` as a logging middleware.

## Files To Edit

- `backend/ThirdWheel.API/Models/AuditLog.cs` — new entity
- `backend/ThirdWheel.API/Services/AuditLogService.cs` — new service
- `backend/ThirdWheel.API/Data/AppDbContext.cs` — add `AuditLogs` DbSet
- `backend/ThirdWheel.API/Controllers/AuthController.cs` — add audit calls
- `backend/ThirdWheel.API/Controllers/AdminController.cs` — add audit calls
- `backend/ThirdWheel.API/Controllers/SafetyController.cs` — add audit calls
- `backend/ThirdWheel.API/Migrations/` — generate migration

## Fix Prompt

```
Create backend/ThirdWheel.API/Models/AuditLog.cs:
    public class AuditLog {
        public Guid Id { get; set; } = Guid.NewGuid();
        public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;
        public Guid? ActorId { get; set; }
        public string ActorRole { get; set; } = string.Empty; // User|Admin|Business|System
        public string Action { get; set; } = string.Empty;    // e.g. login.success
        public string? TargetType { get; set; }
        public Guid? TargetId { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;    // success|failure|denied
        public JsonDocument? Detail { get; set; }
    }

In backend/ThirdWheel.API/Data/AppDbContext.cs:
- Add DbSet<AuditLog> AuditLogs.
- In OnModelCreating, add a DB trigger migration (or a model comment) that prevents UPDATE/DELETE on AuditLogs.

Create backend/ThirdWheel.API/Services/AuditLogService.cs:
- Inject AppDbContext; expose LogAsync(AuditLog entry) that enqueues to a Channel<AuditLog> and returns immediately.
- Background consumer loop dequeues and bulk-inserts to DB.

Inject IAuditLogService into AuthController, AdminController, SafetyController and call LogAsync for:
- AuthController: Login (success/failure), Logout
- AdminController: every GET/POST action (actor=admin, action=admin.<controller>.<method>)
- SafetyController: Report, Block, Ban

Generate EF migration (dotnet ef migrations add AddAuditLog).
```
