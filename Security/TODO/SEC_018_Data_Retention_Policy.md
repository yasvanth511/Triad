# SEC_018 — Define and Implement a Data Retention Policy

**Severity:** HIGH  
**SOC 2 Criteria:** C1.2  
**Status:** Open  
**Effort:** Large (3–5 days — policy + implementation)

---

## Problem

No data retention policy is defined or enforced. User data, messages, media, verification records, and audit events accumulate indefinitely. This creates:

1. **Privacy risk**: Data retained beyond operational need violates GDPR, CCPA, and privacy best practices.
2. **Compliance risk**: SOC 2 C1.2 requires documented retention and disposal procedures.
3. **Storage cost**: Unlimited growth of the `uploads/` directory and database tables.
4. **Breach impact**: The more stale data retained, the larger the breach blast radius.

## Required Retention Schedule

The following schedule is a starting recommendation. Legal and product teams must review and approve before implementation.

| Data Type | Suggested Retention | Trigger for Deletion |
|---|---|---|
| Active user account | Indefinite while active | Profile deletion request |
| Deleted user profile | 30 days (soft delete) | Then hard delete |
| Messages | 1 year from last message in thread | Match deletion or inactivity |
| Match records | 2 years from unmatch date | Inactivity purge |
| Uploaded photos | Deleted with profile | Profile deletion |
| Uploaded videos / audio | Deleted with profile | Profile deletion |
| Notification records | 90 days | Background purge job |
| Spam warnings | 1 year from issuance | Background purge job |
| Block records | Duration of both accounts | Account deletion |
| Report records | 3 years (legal hold) | Admin-only delete |
| Verification attempts | 1 year from attempt | Background purge job |
| Verification events (audit) | 3 years | Background purge job |
| Audit log (SEC_007) | 7 years (SOC 2 requirement) | Archived, not deleted |
| JWT deny-list entries (SEC_005) | JWT expiry date | Automatic TTL |
| Impress Me signals (expired) | 30 days after expiry | Background purge job |
| Business partner audit log | 7 years | Archived |

## Implementation Steps

### 1. Soft Delete Pattern

Add `DeletedAt` (DateTimeOffset?) to `User`, `Match`, `Message` entities:
- When a user deletes their profile, set `DeletedAt = now`. Suppress in all queries via EF global query filter.
- Hard delete runs in a background job 30 days later.

### 2. Background Purge Service

Create a `DataRetentionService` that runs on a `IHostedService` (cron-like) schedule (e.g., nightly at 2:00 UTC):
- Delete notifications older than 90 days.
- Delete expired Impress Me signals older than 30 days past expiry.
- Delete expired verification attempts older than 1 year.
- Hard delete soft-deleted users older than 30 days.

### 3. Media Cleanup

When a `UserPhoto`, `UserVideo`, or audio bio is deleted (or a user is hard-deleted), also delete the corresponding file from `uploads/`.

### 4. User-Facing Right to Erasure

Verify that `DELETE /api/profile` deletes or anonymizes all PII fields, not just the user row:
- Messages should be anonymized (replace sender name with "Deleted User").
- Reports filed by the deleted user should have the reporter ID nullified.
- Photos and media files must be deleted from disk.

## Files To Edit

- `backend/ThirdWheel.API/Models/User.cs` — add `DeletedAt`
- `backend/ThirdWheel.API/Data/AppDbContext.cs` — add soft-delete global query filter
- `backend/ThirdWheel.API/Services/DataRetentionService.cs` — new background service
- `backend/ThirdWheel.API/Services/ProfileService.cs` — ensure media files deleted on profile delete
- `backend/ThirdWheel.API/Program.cs` — register `DataRetentionService` as `IHostedService`
- `Security/Soc-2-compliant/Data-Security.md` — update retention schedule section once approved

## Fix Prompt

```
In backend/ThirdWheel.API/Models/User.cs (also Match.cs, Message.cs):
    public DateTimeOffset? DeletedAt { get; set; }

In backend/ThirdWheel.API/Data/AppDbContext.cs, in OnModelCreating:
    modelBuilder.Entity<User>().HasQueryFilter(u => u.DeletedAt == null);
    modelBuilder.Entity<Match>().HasQueryFilter(m => m.DeletedAt == null);
    modelBuilder.Entity<Message>().HasQueryFilter(m => m.DeletedAt == null);

Create backend/ThirdWheel.API/Services/DataRetentionService.cs implementing BackgroundService:
- RunAsync loop: sleep until next 02:00 UTC, then:
    - Hard-delete users where DeletedAt < now - 30 days (also delete their uploads/ files).
    - Delete Notifications older than 90 days.
    - Delete expired ImpressMe signals older than expiry + 30 days.
    - Delete VerificationAttempts older than 1 year.
- Log each purge count.

In backend/ThirdWheel.API/Services/ProfileService.cs, in DeleteAsync:
1. Set user.DeletedAt = DateTimeOffset.UtcNow (soft delete).
2. Delete all files in uploads/ associated with this user.
3. Anonymize messages: UPDATE Messages SET SenderName = 'Deleted User' WHERE SenderId = userId.
4. Nullify reporter ID on Report records filed by this user.

Register: builder.Services.AddHostedService<DataRetentionService>();
Generate EF migration (dotnet ef migrations add AddSoftDelete).
```
