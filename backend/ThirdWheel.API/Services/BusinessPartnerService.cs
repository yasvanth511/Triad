using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class BusinessPartnerService
{
    private readonly AppDbContext _db;

    public BusinessPartnerService(AppDbContext db) => _db = db;

    public async Task<List<BusinessCategoryResponse>> GetCategoriesAsync()
    {
        return await _db.BusinessCategories
            .AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.DisplayName)
            .Select(category => new BusinessCategoryResponse(
                category.Id,
                category.Key,
                category.DisplayName,
                category.SortOrder))
            .ToListAsync();
    }

    public async Task<BusinessPartnerResponse> GetOrCreatePartnerAsync(Guid userId)
    {
        var partner = await _db.BusinessPartners
            .Include(b => b.User)
            .Include(b => b.Profile)
            .FirstOrDefaultAsync(b => b.UserId == userId);

        if (partner is null)
            throw new KeyNotFoundException("Business partner account not found.");

        return ToResponse(partner);
    }

    public async Task<BusinessPartnerResponse> GetPartnerByUserIdAsync(Guid userId)
    {
        var partner = await _db.BusinessPartners
            .Include(b => b.User)
            .Include(b => b.Profile)
            .FirstOrDefaultAsync(b => b.UserId == userId)
            ?? throw new KeyNotFoundException("Business partner account not found.");

        return ToResponse(partner);
    }

    public async Task<BusinessPartnerResponse> InitializePartnerAsync(Guid userId)
    {
        var existing = await _db.BusinessPartners.AnyAsync(b => b.UserId == userId);
        if (existing)
            throw new InvalidOperationException("Business partner account already exists.");

        var partner = new BusinessPartner { UserId = userId };
        _db.BusinessPartners.Add(partner);
        await _db.SaveChangesAsync();

        return await GetPartnerByUserIdAsync(userId);
    }

    public async Task<BusinessProfileResponse> UpsertProfileAsync(Guid userId, UpsertBusinessProfileRequest req)
    {
        await ValidateCategoryAsync(req.Category);

        var partner = await _db.BusinessPartners
            .Include(b => b.Profile)
            .FirstOrDefaultAsync(b => b.UserId == userId)
            ?? throw new KeyNotFoundException("Business partner account not found.");

        if (partner.Profile is null)
        {
            var profile = new BusinessProfile
            {
                BusinessPartnerId = partner.Id,
                BusinessName = req.BusinessName,
                Category = req.Category,
                Description = req.Description ?? string.Empty,
                Website = req.Website,
                ContactEmail = req.ContactEmail,
                ContactPhone = req.ContactPhone,
                Address = req.Address,
                City = req.City,
                State = req.State
            };
            _db.BusinessProfiles.Add(profile);
            partner.Profile = profile;
        }
        else
        {
            var p = partner.Profile;
            p.BusinessName = req.BusinessName;
            p.Category = req.Category;
            if (req.Description != null) p.Description = req.Description;
            if (req.Website != null) p.Website = req.Website;
            if (req.ContactEmail != null) p.ContactEmail = req.ContactEmail;
            if (req.ContactPhone != null) p.ContactPhone = req.ContactPhone;
            if (req.Address != null) p.Address = req.Address;
            if (req.City != null) p.City = req.City;
            if (req.State != null) p.State = req.State;
            p.UpdatedAt = DateTime.UtcNow;
        }

        // Re-queue for approval if previously rejected
        if (partner.Status == BusinessVerificationStatus.Rejected)
        {
            partner.Status = BusinessVerificationStatus.Pending;
            partner.RejectionReason = null;
        }

        partner.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ToProfileResponse(partner.Profile!);
    }

    public async Task<string?> SetLogoAsync(Guid userId, string url)
    {
        var partner = await _db.BusinessPartners
            .Include(b => b.Profile)
            .FirstOrDefaultAsync(b => b.UserId == userId)
            ?? throw new KeyNotFoundException("Business partner account not found.");

        if (partner.Profile is null)
            throw new InvalidOperationException("Complete business profile setup before uploading a logo.");

        var old = partner.Profile.LogoUrl;
        partner.Profile.LogoUrl = url;
        partner.Profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return old;
    }

    public async Task<Guid> GetPartnerIdAsync(Guid userId)
    {
        var id = await _db.BusinessPartners
            .Where(b => b.UserId == userId)
            .Select(b => (Guid?)b.Id)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Business partner account not found.");

        return id;
    }

    public async Task<bool> IsApprovedAsync(Guid partnerId)
    {
        return await _db.BusinessPartners
            .AnyAsync(b => b.Id == partnerId && b.Status == BusinessVerificationStatus.Approved);
    }

    private async Task ValidateCategoryAsync(string categoryKey)
    {
        var isValid = await _db.BusinessCategories
            .AnyAsync(category => category.Key == categoryKey && category.IsActive);

        if (!isValid)
            throw new InvalidOperationException("Select a valid business category.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    internal static BusinessPartnerResponse ToResponse(BusinessPartner b) =>
        new(b.Id, b.UserId, b.User.Username, b.User.Email, b.Status, b.RejectionReason,
            b.CreatedAt, b.Profile is null ? null : ToProfileResponse(b.Profile));

    internal static BusinessProfileResponse ToProfileResponse(BusinessProfile p) =>
        new(p.Id, p.BusinessName, p.Category, p.Description, p.Website, p.LogoUrl,
            p.ContactEmail, p.ContactPhone, p.Address, p.City, p.State, p.UpdatedAt);
}
