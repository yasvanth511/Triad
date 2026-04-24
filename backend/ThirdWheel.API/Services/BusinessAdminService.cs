using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class BusinessAdminService
{
    private readonly AppDbContext _db;

    public BusinessAdminService(AppDbContext db) => _db = db;

    // ── Partners ──────────────────────────────────────────────────────────────

    public async Task<List<AdminBusinessPartnerSummary>> GetPendingPartnersAsync()
    {
        return await _db.BusinessPartners
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.Profile)
            .Where(b => b.Status == BusinessVerificationStatus.Pending)
            .OrderBy(b => b.CreatedAt)
            .Select(b => new AdminBusinessPartnerSummary(
                b.Id,
                b.UserId,
                b.User.Username,
                b.User.Email,
                b.Status,
                b.Profile != null ? b.Profile.BusinessName : null,
                b.Profile != null ? b.Profile.Category : null,
                b.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task ApprovePartnerAsync(Guid partnerId, AdminReviewRequest req, Guid? adminUserId)
    {
        var partner = await _db.BusinessPartners.FirstOrDefaultAsync(b => b.Id == partnerId)
            ?? throw new KeyNotFoundException("Business partner not found.");

        if (partner.Status == BusinessVerificationStatus.Approved)
            throw new InvalidOperationException("Partner is already approved.");

        partner.Status = BusinessVerificationStatus.Approved;
        partner.RejectionReason = null;
        partner.UpdatedAt = DateTime.UtcNow;

        _db.BusinessAuditLogs.Add(new BusinessAuditLog
        {
            Action = BusinessAuditAction.PartnerApproved,
            AdminUserId = adminUserId,
            TargetPartnerId = partnerId,
            Note = req.Note
        });

        await _db.SaveChangesAsync();
    }

    public async Task RejectPartnerAsync(Guid partnerId, AdminReviewRequest req, Guid? adminUserId)
    {
        var partner = await _db.BusinessPartners.FirstOrDefaultAsync(b => b.Id == partnerId)
            ?? throw new KeyNotFoundException("Business partner not found.");

        partner.Status = BusinessVerificationStatus.Rejected;
        partner.RejectionReason = req.Reason;
        partner.UpdatedAt = DateTime.UtcNow;

        _db.BusinessAuditLogs.Add(new BusinessAuditLog
        {
            Action = BusinessAuditAction.PartnerRejected,
            AdminUserId = adminUserId,
            TargetPartnerId = partnerId,
            Reason = req.Reason,
            Note = req.Note
        });

        await _db.SaveChangesAsync();
    }

    public async Task SuspendPartnerAsync(Guid partnerId, AdminReviewRequest req, Guid? adminUserId)
    {
        var partner = await _db.BusinessPartners.FirstOrDefaultAsync(b => b.Id == partnerId)
            ?? throw new KeyNotFoundException("Business partner not found.");

        partner.Status = BusinessVerificationStatus.Suspended;
        partner.RejectionReason = req.Reason;
        partner.UpdatedAt = DateTime.UtcNow;

        _db.BusinessAuditLogs.Add(new BusinessAuditLog
        {
            Action = BusinessAuditAction.PartnerSuspended,
            AdminUserId = adminUserId,
            TargetPartnerId = partnerId,
            Reason = req.Reason,
            Note = req.Note
        });

        await _db.SaveChangesAsync();
    }

    // ── Events ────────────────────────────────────────────────────────────────

    public async Task<List<AdminBusinessEventSummary>> GetPendingEventsAsync()
    {
        return await _db.BusinessEvents
            .AsNoTracking()
            .Include(e => e.BusinessPartner).ThenInclude(b => b.Profile)
            .Where(e => e.Status == BusinessEventStatus.PendingApproval)
            .OrderBy(e => e.CreatedAt)
            .Select(e => new AdminBusinessEventSummary(
                e.Id,
                e.BusinessPartnerId,
                e.BusinessPartner.Profile != null ? e.BusinessPartner.Profile.BusinessName : string.Empty,
                e.Title,
                e.Category,
                e.Status,
                e.StartDate,
                e.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task ApproveEventAsync(Guid eventId, AdminReviewRequest req, Guid? adminUserId)
    {
        var ev = await _db.BusinessEvents.FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        ev.Status = BusinessEventStatus.Published;
        ev.RejectionReason = null;
        ev.UpdatedAt = DateTime.UtcNow;

        _db.BusinessAuditLogs.Add(new BusinessAuditLog
        {
            Action = BusinessAuditAction.EventApproved,
            AdminUserId = adminUserId,
            TargetEventId = eventId,
            Note = req.Note
        });

        await _db.SaveChangesAsync();
    }

    public async Task RejectEventAsync(Guid eventId, AdminReviewRequest req, Guid? adminUserId)
    {
        var ev = await _db.BusinessEvents.FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        ev.Status = BusinessEventStatus.Rejected;
        ev.RejectionReason = req.Reason;
        ev.UpdatedAt = DateTime.UtcNow;

        _db.BusinessAuditLogs.Add(new BusinessAuditLog
        {
            Action = BusinessAuditAction.EventRejected,
            AdminUserId = adminUserId,
            TargetEventId = eventId,
            Reason = req.Reason,
            Note = req.Note
        });

        await _db.SaveChangesAsync();
    }

    // ── Offers ────────────────────────────────────────────────────────────────

    public async Task<List<AdminBusinessOfferSummary>> GetPendingOffersAsync()
    {
        return await _db.BusinessOffers
            .AsNoTracking()
            .Include(o => o.BusinessEvent).ThenInclude(e => e.BusinessPartner).ThenInclude(b => b.Profile)
            .Where(o => o.Status == BusinessOfferStatus.PendingApproval)
            .OrderBy(o => o.CreatedAt)
            .Select(o => new AdminBusinessOfferSummary(
                o.Id,
                o.BusinessEventId,
                o.BusinessEvent.Title,
                o.BusinessEvent.BusinessPartner.Profile != null ? o.BusinessEvent.BusinessPartner.Profile.BusinessName : string.Empty,
                o.OfferType,
                o.Title,
                o.Status,
                o.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task ApproveOfferAsync(Guid offerId, AdminReviewRequest req, Guid? adminUserId)
    {
        var offer = await _db.BusinessOffers.FirstOrDefaultAsync(o => o.Id == offerId)
            ?? throw new KeyNotFoundException("Offer not found.");

        offer.Status = BusinessOfferStatus.Active;
        offer.RejectionReason = null;
        offer.UpdatedAt = DateTime.UtcNow;

        _db.BusinessAuditLogs.Add(new BusinessAuditLog
        {
            Action = BusinessAuditAction.OfferApproved,
            AdminUserId = adminUserId,
            TargetOfferId = offerId,
            Note = req.Note
        });

        await _db.SaveChangesAsync();
    }

    public async Task RejectOfferAsync(Guid offerId, AdminReviewRequest req, Guid? adminUserId)
    {
        var offer = await _db.BusinessOffers.FirstOrDefaultAsync(o => o.Id == offerId)
            ?? throw new KeyNotFoundException("Offer not found.");

        offer.Status = BusinessOfferStatus.Rejected;
        offer.RejectionReason = req.Reason;
        offer.UpdatedAt = DateTime.UtcNow;

        _db.BusinessAuditLogs.Add(new BusinessAuditLog
        {
            Action = BusinessAuditAction.OfferRejected,
            AdminUserId = adminUserId,
            TargetOfferId = offerId,
            Reason = req.Reason,
            Note = req.Note
        });

        await _db.SaveChangesAsync();
    }

    // ── Challenges ────────────────────────────────────────────────────────────

    public async Task<List<AdminChallengeSummary>> GetPendingChallengesAsync()
    {
        return await _db.EventChallenges
            .AsNoTracking()
            .Include(c => c.BusinessEvent).ThenInclude(e => e.BusinessPartner).ThenInclude(b => b.Profile)
            .Where(c => c.Status == ChallengeStatus.PendingApproval)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new AdminChallengeSummary(
                c.Id,
                c.BusinessEventId,
                c.BusinessEvent.Title,
                c.BusinessEvent.BusinessPartner.Profile != null ? c.BusinessEvent.BusinessPartner.Profile.BusinessName : string.Empty,
                c.Prompt,
                c.Status,
                c.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task ApproveChallengeAsync(Guid challengeId, AdminReviewRequest req, Guid? adminUserId)
    {
        var challenge = await _db.EventChallenges.FirstOrDefaultAsync(c => c.Id == challengeId)
            ?? throw new KeyNotFoundException("Challenge not found.");

        challenge.Status = ChallengeStatus.Active;
        challenge.RejectionReason = null;
        challenge.UpdatedAt = DateTime.UtcNow;

        _db.BusinessAuditLogs.Add(new BusinessAuditLog
        {
            Action = BusinessAuditAction.ChallengeApproved,
            AdminUserId = adminUserId,
            TargetChallengeId = challengeId,
            Note = req.Note
        });

        await _db.SaveChangesAsync();
    }

    public async Task RejectChallengeAsync(Guid challengeId, AdminReviewRequest req, Guid? adminUserId)
    {
        var challenge = await _db.EventChallenges.FirstOrDefaultAsync(c => c.Id == challengeId)
            ?? throw new KeyNotFoundException("Challenge not found.");

        challenge.Status = ChallengeStatus.Rejected;
        challenge.RejectionReason = req.Reason;
        challenge.UpdatedAt = DateTime.UtcNow;

        _db.BusinessAuditLogs.Add(new BusinessAuditLog
        {
            Action = BusinessAuditAction.ChallengeRejected,
            AdminUserId = adminUserId,
            TargetChallengeId = challengeId,
            Reason = req.Reason,
            Note = req.Note
        });

        await _db.SaveChangesAsync();
    }

    public async Task SuspendChallengeAsync(Guid challengeId, AdminReviewRequest req, Guid? adminUserId)
    {
        var challenge = await _db.EventChallenges.FirstOrDefaultAsync(c => c.Id == challengeId)
            ?? throw new KeyNotFoundException("Challenge not found.");

        challenge.Status = ChallengeStatus.Suspended;
        challenge.UpdatedAt = DateTime.UtcNow;

        _db.BusinessAuditLogs.Add(new BusinessAuditLog
        {
            Action = BusinessAuditAction.ChallengeSuspended,
            AdminUserId = adminUserId,
            TargetChallengeId = challengeId,
            Reason = req.Reason,
            Note = req.Note
        });

        await _db.SaveChangesAsync();
    }

    // ── Audit Log ─────────────────────────────────────────────────────────────

    public async Task<List<BusinessAuditLogItem>> GetAuditLogAsync(int skip = 0, int take = 50)
    {
        return await _db.BusinessAuditLogs
            .AsNoTracking()
            .OrderByDescending(a => a.CreatedAt)
            .Skip(skip)
            .Take(Math.Clamp(take, 1, 100))
            .Select(a => new BusinessAuditLogItem(
                a.Id, a.Action, a.AdminUserId,
                a.TargetPartnerId, a.TargetEventId, a.TargetOfferId, a.TargetChallengeId,
                a.Reason, a.Note, a.CreatedAt))
            .ToListAsync();
    }
}
