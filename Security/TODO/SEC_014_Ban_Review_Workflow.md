# SEC_014 — Add Human Review Step Before Automatic Account Ban

**Severity:** MEDIUM  
**SOC 2 Criteria:** CC5.1, CC7.2  
**Status:** Open  
**Effort:** Medium (1–2 days)

---

## Problem

`AntiSpamService` automatically bans a user account after 3 spam strikes with no human review:

```csharp
// AntiSpamService.cs
if (user.SpamWarnings >= AppConstants.SpamStrikesBeforeBan) {
    user.IsBanned = true;
    // No review queue, no notification to admin
}
```

This creates two risks:

1. **Ban-by-proxy attack**: An adversary can deliberately trigger spam-flag conditions on a victim's account (e.g., by sending the victim messages that quote back flagged content), causing the victim to be automatically banned.
2. **False positive**: A legitimate user's message might inadvertently contain a flagged keyword (e.g., discussing the word "telegram" in a safety context) and be permanently banned with no appeal path.

## Fix

### Phase 1 — Soft Ban with Review Queue (Immediate)

1. Instead of `IsBanned = true`, set `IsPendingBanReview = true` on the third strike.
2. Create a `BanReviewQueue` table (or reuse `Report` + a `ReviewStatus` field).
3. Surface pending bans in the admin dashboard under a new "Ban Review" tab.
4. Admin approves or reverses the ban from the dashboard.
5. Until admin action, the user's account is rate-limited (50% quota reduction) but not banned.

### Phase 2 — Appeal Process

1. Notify the user via in-app notification when their account is flagged.
2. Provide an "appeal" flow in the app settings where the user can submit context.
3. Admin sees the appeal alongside the spam record.
4. Document an SLA for reviewing bans (e.g., within 24 hours for first offense).

### Immediate Step

Even before the full review queue: send an admin notification (email or in-app) whenever `IsBanned = true` is set automatically, so a human is at least aware.

## Files To Edit

- `backend/ThirdWheel.API/Models/User.cs` — add `IsPendingBanReview` flag
- `backend/ThirdWheel.API/Services/AntiSpamService.cs` — replace auto-ban with flag + queue entry
- `backend/ThirdWheel.API/Controllers/AdminController.cs` — add ban review endpoints
- `admin/nextjs-admin/` — add ban review UI
- `backend/ThirdWheel.API/Migrations/` — migration for new fields

## Fix Prompt

```
In backend/ThirdWheel.API/Models/User.cs, add:
    public bool IsPendingBanReview { get; set; } = false;

Create backend/ThirdWheel.API/Models/BanReviewQueueEntry.cs:
    public class BanReviewQueueEntry {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public string Status { get; set; } = "Pending"; // Pending|Approved|Reversed
        public Guid? ReviewedBy { get; set; }
        public DateTimeOffset? ReviewedAt { get; set; }
    }
Add DbSet<BanReviewQueueEntry> to AppDbContext.cs.

In backend/ThirdWheel.API/Services/AntiSpamService.cs:
- Replace `user.IsBanned = true;` with:
    user.IsPendingBanReview = true;
    _db.BanReviewQueue.Add(new BanReviewQueueEntry { UserId = user.Id, Reason = "spam-strikes" });
- Do not set IsBanned = true automatically.

In backend/ThirdWheel.API/Controllers/AdminController.cs, add:
- GET /api/admin/ban-review → list pending BanReviewQueueEntry records with user info.
- POST /api/admin/ban-review/{entryId}/approve → set user.IsBanned = true, entry.Status = "Approved".
- POST /api/admin/ban-review/{entryId}/reverse → set user.IsPendingBanReview = false, entry.Status = "Reversed".

Generate EF migration.

In admin/nextjs-admin/, add a "Ban Review" page that lists pending entries and provides Approve/Reverse buttons.
```
