using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class BusinessOfferService
{
    private readonly AppDbContext _db;

    public BusinessOfferService(AppDbContext db) => _db = db;

    public async Task<List<BusinessOfferResponse>> GetMyOffersAsync(Guid partnerId, Guid? eventId = null)
    {
        var query = _db.BusinessOffers
            .AsNoTracking()
            .Include(o => o.BusinessEvent).ThenInclude(e => e.BusinessPartner).ThenInclude(b => b.Profile)
            .Include(o => o.Claims)
            .Where(o => o.BusinessEvent.BusinessPartnerId == partnerId);

        if (eventId.HasValue)
            query = query.Where(o => o.BusinessEventId == eventId.Value);

        var offers = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return offers.Select(o => ToResponse(o, null)).ToList();
    }

    public async Task<BusinessOfferResponse> GetMyOfferAsync(Guid partnerId, Guid offerId)
    {
        var offer = await LoadOfferAsync(offerId);
        EnsureOwnership(offer, partnerId);
        return ToResponse(offer, null);
    }

    public async Task<BusinessOfferResponse> CreateAsync(Guid partnerId, Guid eventId, CreateBusinessOfferRequest req)
    {
        ValidateOffer(req.ClaimLimit, req.ExpiryDate);

        var ev = await _db.BusinessEvents
            .FirstOrDefaultAsync(e => e.Id == eventId && e.BusinessPartnerId == partnerId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.Status is BusinessEventStatus.Cancelled or BusinessEventStatus.Archived)
            throw new InvalidOperationException("Cannot add offer to a cancelled or archived event.");

        var offer = new BusinessOffer
        {
            BusinessEventId = eventId,
            OfferType = req.OfferType,
            Title = req.Title,
            Description = req.Description ?? string.Empty,
            CouponCode = req.CouponCode,
            ClaimLimit = req.ClaimLimit,
            ExpiryDate = req.ExpiryDate,
            RedemptionInstructions = req.RedemptionInstructions,
            Status = BusinessOfferStatus.Draft
        };

        _db.BusinessOffers.Add(offer);
        await _db.SaveChangesAsync();

        return await GetMyOfferAsync(partnerId, offer.Id);
    }

    public async Task<BusinessOfferResponse> UpdateAsync(Guid partnerId, Guid offerId, UpdateBusinessOfferRequest req)
    {
        var offer = await LoadOfferAsync(offerId);

        EnsureOwnership(offer, partnerId);

        if (offer.Status is BusinessOfferStatus.Archived or BusinessOfferStatus.Expired)
            throw new InvalidOperationException("Cannot edit an archived or expired offer.");

        ValidateOffer(req.ClaimLimit ?? offer.ClaimLimit, req.ExpiryDate ?? offer.ExpiryDate);

        if (req.OfferType.HasValue) offer.OfferType = req.OfferType.Value;
        if (req.Title != null) offer.Title = req.Title;
        if (req.Description != null) offer.Description = req.Description;
        if (req.CouponCode != null) offer.CouponCode = req.CouponCode;
        if (req.ClaimLimit.HasValue) offer.ClaimLimit = req.ClaimLimit;
        if (req.ExpiryDate.HasValue) offer.ExpiryDate = req.ExpiryDate;
        if (req.RedemptionInstructions != null) offer.RedemptionInstructions = req.RedemptionInstructions;

        if (offer.Status is BusinessOfferStatus.Active or BusinessOfferStatus.Approved)
            offer.Status = BusinessOfferStatus.PendingApproval;

        offer.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetMyOfferAsync(partnerId, offerId);
    }

    public async Task SubmitForApprovalAsync(Guid partnerId, Guid offerId)
    {
        var offer = await LoadOfferAsync(offerId);

        EnsureOwnership(offer, partnerId);

        if (offer.Status is not (BusinessOfferStatus.Draft or BusinessOfferStatus.Rejected))
            throw new InvalidOperationException($"Offer cannot be submitted from status {offer.Status}.");

        offer.Status = BusinessOfferStatus.PendingApproval;
        offer.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid partnerId, Guid offerId)
    {
        var offer = await LoadOfferAsync(offerId);

        EnsureOwnership(offer, partnerId);

        if (offer.Status is not BusinessOfferStatus.Draft)
            throw new InvalidOperationException("Only draft offers can be deleted.");

        _db.BusinessOffers.Remove(offer);
        await _db.SaveChangesAsync();
    }

    // ── User-facing ───────────────────────────────────────────────────────────

    public async Task<List<BusinessOfferResponse>> GetPublishedOffersAsync(Guid eventId, Guid? userId)
    {
        var published = await _db.BusinessEvents
            .AnyAsync(e => e.Id == eventId && e.Status == BusinessEventStatus.Published);

        if (!published)
            throw new KeyNotFoundException("Event not found.");

        var offers = await _db.BusinessOffers
            .AsNoTracking()
            .Include(o => o.BusinessEvent).ThenInclude(e => e.BusinessPartner).ThenInclude(b => b.Profile)
            .Include(o => o.Claims)
            .Where(o => o.BusinessEventId == eventId && o.Status == BusinessOfferStatus.Active)
            .ToListAsync();

        if (userId is null)
            return offers.Select(o => ToResponse(o, null)).ToList();

        var claimedOfferIds = await _db.CouponClaims
            .Where(c => c.UserId == userId.Value && offers.Select(o => o.Id).Contains(c.BusinessOfferId))
            .Select(c => c.BusinessOfferId)
            .ToHashSetAsync();

        return offers.Select(o => ToResponse(o, userId.Value, claimedOfferIds)).ToList();
    }

    public async Task<ClaimCouponResponse> ClaimCouponAsync(Guid userId, Guid eventId, Guid offerId)
    {
        var offer = await _db.BusinessOffers
            .Include(o => o.BusinessEvent)
            .Include(o => o.Claims)
            .FirstOrDefaultAsync(o => o.Id == offerId)
            ?? throw new KeyNotFoundException("Offer not found.");

        if (offer.BusinessEventId != eventId)
            throw new KeyNotFoundException("Offer not found.");

        if (offer.Status != BusinessOfferStatus.Active || offer.BusinessEvent.Status != BusinessEventStatus.Published)
            throw new InvalidOperationException("This offer is not available.");

        if (offer.ExpiryDate.HasValue && offer.ExpiryDate.Value < DateTime.UtcNow)
            throw new InvalidOperationException("This offer has expired.");

        if (offer.ClaimLimit.HasValue && offer.Claims.Count >= offer.ClaimLimit.Value)
            throw new InvalidOperationException("This offer has reached its claim limit.");

        if (await _db.CouponClaims.AnyAsync(c => c.UserId == userId && c.BusinessOfferId == offerId))
            throw new InvalidOperationException("You have already claimed this offer.");

        var claim = new CouponClaim { UserId = userId, BusinessOfferId = offerId };
        _db.CouponClaims.Add(claim);
        await _db.SaveChangesAsync();

        return new ClaimCouponResponse(
            claim.Id,
            offer.CouponCode ?? string.Empty,
            offer.RedemptionInstructions,
            claim.ClaimedAt);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<BusinessOffer> LoadOfferAsync(Guid offerId)
    {
        return await _db.BusinessOffers
            .Include(o => o.BusinessEvent).ThenInclude(e => e.BusinessPartner).ThenInclude(b => b.Profile)
            .Include(o => o.Claims)
            .FirstOrDefaultAsync(o => o.Id == offerId)
            ?? throw new KeyNotFoundException("Offer not found.");
    }

    private void EnsureOwnership(BusinessOffer offer, Guid partnerId)
    {
        if (offer.BusinessEvent.BusinessPartnerId != partnerId)
            throw new UnauthorizedAccessException("Not your offer.");
    }

    private static void ValidateOffer(int? claimLimit, DateTime? expiryDate)
    {
        if (claimLimit.HasValue && claimLimit.Value <= 0)
            throw new InvalidOperationException("Offer claim limit must be greater than zero.");

        if (expiryDate.HasValue && expiryDate.Value <= DateTime.UtcNow)
            throw new InvalidOperationException("Offer expiry date must be in the future.");
    }

    internal static BusinessOfferResponse ToResponse(BusinessOffer o, Guid? userId, HashSet<Guid>? claimedIds = null)
    {
        var businessName = o.BusinessEvent?.BusinessPartner?.Profile?.BusinessName ?? string.Empty;
        return new BusinessOfferResponse(
            o.Id,
            o.BusinessEventId,
            o.BusinessEvent?.Title ?? string.Empty,
            o.OfferType,
            o.Title,
            o.Description,
            o.CouponCode,
            o.ClaimLimit,
            o.ExpiryDate,
            o.RedemptionInstructions,
            o.Status,
            o.RejectionReason,
            o.Claims.Count,
            userId.HasValue ? claimedIds?.Contains(o.Id) : null,
            o.CreatedAt
        );
    }
}
