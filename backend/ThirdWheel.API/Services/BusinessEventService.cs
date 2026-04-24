using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class BusinessEventService
{
    private readonly AppDbContext _db;

    public BusinessEventService(AppDbContext db) => _db = db;

    // ── Business partner views ────────────────────────────────────────────────

    public async Task<List<BusinessEventResponse>> GetMyEventsAsync(Guid partnerId)
    {
        var events = await _db.BusinessEvents
            .AsNoTracking()
            .Include(e => e.Images)
            .Include(e => e.BusinessPartner).ThenInclude(b => b.Profile)
            .Where(e => e.BusinessPartnerId == partnerId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return events.Select(e => ToResponse(e, null)).ToList();
    }

    public async Task<BusinessEventResponse> GetMyEventAsync(Guid partnerId, Guid eventId)
    {
        var ev = await LoadEventAsync(eventId);
        if (ev.BusinessPartnerId != partnerId)
            throw new UnauthorizedAccessException("Not your event.");
        return ToResponse(ev, null);
    }

    public async Task<BusinessEventResponse> CreateAsync(Guid partnerId, CreateBusinessEventRequest req)
    {
        await ValidateRequestAsync(req.StartDate, req.EndDate, req.Capacity, req.Price, req.Category);

        var isApproved = await _db.BusinessPartners
            .AnyAsync(b => b.Id == partnerId && b.Status == BusinessVerificationStatus.Approved);

        if (!isApproved)
            throw new InvalidOperationException("Your business account must be approved before creating events.");

        var ev = new BusinessEvent
        {
            BusinessPartnerId = partnerId,
            Title = req.Title,
            Description = req.Description ?? string.Empty,
            Category = req.Category ?? string.Empty,
            Location = req.Location,
            City = req.City,
            State = req.State,
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            StartDate = req.StartDate,
            EndDate = req.EndDate,
            Capacity = req.Capacity,
            Price = req.Price,
            ExternalTicketUrl = req.ExternalTicketUrl,
            Status = BusinessEventStatus.Draft
        };

        _db.BusinessEvents.Add(ev);
        await _db.SaveChangesAsync();

        return await GetMyEventAsync(partnerId, ev.Id);
    }

    public async Task<BusinessEventResponse> UpdateAsync(Guid partnerId, Guid eventId, UpdateBusinessEventRequest req)
    {
        var ev = await _db.BusinessEvents.FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.BusinessPartnerId != partnerId)
            throw new UnauthorizedAccessException("Not your event.");

        if (ev.Status is BusinessEventStatus.Cancelled or BusinessEventStatus.Archived)
            throw new InvalidOperationException("Cannot edit a cancelled or archived event.");

        await ValidateRequestAsync(
            req.StartDate ?? ev.StartDate,
            req.EndDate ?? ev.EndDate,
            req.Capacity ?? ev.Capacity,
            req.Price ?? ev.Price,
            req.Category ?? ev.Category);

        if (req.Title != null) ev.Title = req.Title;
        if (req.Description != null) ev.Description = req.Description;
        if (req.Category != null) ev.Category = req.Category;
        if (req.Location != null) ev.Location = req.Location;
        if (req.City != null) ev.City = req.City;
        if (req.State != null) ev.State = req.State;
        if (req.Latitude.HasValue) ev.Latitude = req.Latitude;
        if (req.Longitude.HasValue) ev.Longitude = req.Longitude;
        if (req.StartDate.HasValue) ev.StartDate = req.StartDate;
        if (req.EndDate.HasValue) ev.EndDate = req.EndDate;
        if (req.Capacity.HasValue) ev.Capacity = req.Capacity;
        if (req.Price.HasValue) ev.Price = req.Price;
        if (req.ExternalTicketUrl != null) ev.ExternalTicketUrl = req.ExternalTicketUrl;

        // Re-queue for approval if already published/approved
        if (ev.Status is BusinessEventStatus.Published or BusinessEventStatus.Approved)
            ev.Status = BusinessEventStatus.PendingApproval;

        ev.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetMyEventAsync(partnerId, ev.Id);
    }

    public async Task SubmitForApprovalAsync(Guid partnerId, Guid eventId)
    {
        var ev = await _db.BusinessEvents.FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.BusinessPartnerId != partnerId)
            throw new UnauthorizedAccessException("Not your event.");

        if (ev.Status is not (BusinessEventStatus.Draft or BusinessEventStatus.Rejected))
            throw new InvalidOperationException($"Event cannot be submitted from status {ev.Status}.");

        ev.Status = BusinessEventStatus.PendingApproval;
        ev.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid partnerId, Guid eventId)
    {
        var ev = await _db.BusinessEvents.FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.BusinessPartnerId != partnerId)
            throw new UnauthorizedAccessException("Not your event.");

        if (ev.Status is not BusinessEventStatus.Draft)
            throw new InvalidOperationException("Only draft events can be deleted.");

        _db.BusinessEvents.Remove(ev);
        await _db.SaveChangesAsync();
    }

    public async Task<BusinessEventImageResponse> AddImageAsync(Guid partnerId, Guid eventId, string url)
    {
        var ev = await _db.BusinessEvents
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.BusinessPartnerId != partnerId)
            throw new UnauthorizedAccessException("Not your event.");

        if (ev.Images.Count >= AppConstants.MaxBusinessEventImages)
            throw new InvalidOperationException($"Maximum {AppConstants.MaxBusinessEventImages} images per event.");

        var image = new BusinessEventImage
        {
            BusinessEventId = eventId,
            Url = url,
            SortOrder = ev.Images.Count
        };

        _db.BusinessEventImages.Add(image);
        await _db.SaveChangesAsync();

        return new BusinessEventImageResponse(image.Id, image.Url, image.SortOrder);
    }

    public async Task<string> DeleteImageAsync(Guid partnerId, Guid eventId, Guid imageId)
    {
        var ev = await _db.BusinessEvents.FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.BusinessPartnerId != partnerId)
            throw new UnauthorizedAccessException("Not your event.");

        var image = await _db.BusinessEventImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.BusinessEventId == eventId)
            ?? throw new KeyNotFoundException("Image not found.");

        var url = image.Url;
        _db.BusinessEventImages.Remove(image);
        await _db.SaveChangesAsync();
        return url;
    }

    // ── Public user-facing views ──────────────────────────────────────────────

    public async Task<List<BusinessEventResponse>> GetPublishedEventsAsync(Guid? userId, string? city, string? category, int skip = 0, int take = 20)
    {
        var query = _db.BusinessEvents
            .AsNoTracking()
            .Include(e => e.Images)
            .Include(e => e.BusinessPartner).ThenInclude(b => b.Profile)
            .Where(e => e.Status == BusinessEventStatus.Published);

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(e => e.City != null && e.City.ToLower().Contains(city.ToLower()));

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(e => e.Category.ToLower() == category.ToLower());

        var events = await query
            .OrderByDescending(e => e.StartDate)
            .Skip(skip)
            .Take(Math.Clamp(take, 1, 50))
            .ToListAsync();

        if (userId is null)
            return events.Select(e => ToResponse(e, null)).ToList();

        var eventIds = events.Select(e => e.Id).ToList();

        var likedIds = await _db.EventLikes
            .Where(l => l.UserId == userId.Value && eventIds.Contains(l.BusinessEventId))
            .Select(l => l.BusinessEventId)
            .ToHashSetAsync();

        var savedIds = await _db.EventSaves
            .Where(s => s.UserId == userId.Value && eventIds.Contains(s.BusinessEventId))
            .Select(s => s.BusinessEventId)
            .ToHashSetAsync();

        var registeredIds = await _db.EventRegistrations
            .Where(r => r.UserId == userId.Value && eventIds.Contains(r.BusinessEventId))
            .Select(r => r.BusinessEventId)
            .ToHashSetAsync();

        return events.Select(e => ToResponse(e, userId.Value, likedIds, savedIds, registeredIds)).ToList();
    }

    public async Task<BusinessEventResponse> GetPublishedEventAsync(Guid eventId, Guid? userId)
    {
        var ev = await LoadEventAsync(eventId);

        if (ev.Status != BusinessEventStatus.Published)
            throw new KeyNotFoundException("Event not found.");

        if (userId is null)
            return ToResponse(ev, null);

        var isLiked = await _db.EventLikes.AnyAsync(l => l.UserId == userId.Value && l.BusinessEventId == eventId);
        var isSaved = await _db.EventSaves.AnyAsync(s => s.UserId == userId.Value && s.BusinessEventId == eventId);
        var isRegistered = await _db.EventRegistrations.AnyAsync(r => r.UserId == userId.Value && r.BusinessEventId == eventId);

        return ToResponse(ev, userId.Value,
            isLiked ? new HashSet<Guid> { eventId } : new HashSet<Guid>(),
            isSaved ? new HashSet<Guid> { eventId } : new HashSet<Guid>(),
            isRegistered ? new HashSet<Guid> { eventId } : new HashSet<Guid>());
    }

    // ── User engagement ───────────────────────────────────────────────────────

    public async Task ToggleLikeAsync(Guid userId, Guid eventId)
    {
        await EnsurePublishedAsync(eventId);

        var existing = await _db.EventLikes.FirstOrDefaultAsync(l => l.UserId == userId && l.BusinessEventId == eventId);
        if (existing is not null)
        {
            _db.EventLikes.Remove(existing);
        }
        else
        {
            _db.EventLikes.Add(new EventLike { UserId = userId, BusinessEventId = eventId });
        }

        await _db.SaveChangesAsync();
    }

    public async Task ToggleSaveAsync(Guid userId, Guid eventId)
    {
        await EnsurePublishedAsync(eventId);

        var existing = await _db.EventSaves.FirstOrDefaultAsync(s => s.UserId == userId && s.BusinessEventId == eventId);
        if (existing is not null)
        {
            _db.EventSaves.Remove(existing);
        }
        else
        {
            _db.EventSaves.Add(new EventSave { UserId = userId, BusinessEventId = eventId });
        }

        await _db.SaveChangesAsync();
    }

    public async Task RegisterAsync(Guid userId, Guid eventId)
    {
        await EnsurePublishedAsync(eventId);

        if (await _db.EventRegistrations.AnyAsync(r => r.UserId == userId && r.BusinessEventId == eventId))
            throw new InvalidOperationException("Already registered for this event.");

        _db.EventRegistrations.Add(new EventRegistration { UserId = userId, BusinessEventId = eventId });
        await _db.SaveChangesAsync();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task EnsurePublishedAsync(Guid eventId)
    {
        var exists = await _db.BusinessEvents.AnyAsync(e => e.Id == eventId && e.Status == BusinessEventStatus.Published);
        if (!exists)
            throw new KeyNotFoundException("Event not found or not available.");
    }

    private async Task ValidateRequestAsync(
        DateTime? startDate,
        DateTime? endDate,
        int? capacity,
        decimal? price,
        string? category)
    {
        if (startDate.HasValue && endDate.HasValue && endDate.Value < startDate.Value)
            throw new InvalidOperationException("Event end date must be after the start date.");

        if (capacity.HasValue && capacity.Value <= 0)
            throw new InvalidOperationException("Event capacity must be greater than zero.");

        if (price.HasValue && price.Value < 0)
            throw new InvalidOperationException("Event price cannot be negative.");

        if (!string.IsNullOrWhiteSpace(category))
        {
            var isValidCategory = await _db.BusinessCategories
                .AnyAsync(item => item.Key == category && item.IsActive);

            if (!isValidCategory)
                throw new InvalidOperationException("Select a valid business category.");
        }
    }

    private async Task<BusinessEvent> LoadEventAsync(Guid eventId)
    {
        return await _db.BusinessEvents
            .Include(e => e.Images)
            .Include(e => e.BusinessPartner).ThenInclude(b => b.Profile)
            .Include(e => e.Likes)
            .Include(e => e.Saves)
            .Include(e => e.Registrations)
            .Include(e => e.Challenge)
            .Include(e => e.Offers)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");
    }

    internal static BusinessEventResponse ToResponse(
        BusinessEvent e,
        Guid? viewerUserId,
        HashSet<Guid>? likedIds = null,
        HashSet<Guid>? savedIds = null,
        HashSet<Guid>? registeredIds = null)
    {
        var businessName = e.BusinessPartner?.Profile?.BusinessName ?? string.Empty;
        return new BusinessEventResponse(
            e.Id,
            e.BusinessPartnerId,
            businessName,
            e.Title,
            e.Description,
            e.Category,
            e.Location,
            e.City,
            e.State,
            e.Latitude,
            e.Longitude,
            e.StartDate,
            e.EndDate,
            e.Capacity,
            e.Price,
            e.ExternalTicketUrl,
            e.Status,
            e.RejectionReason,
            e.Images.OrderBy(i => i.SortOrder).Select(i => new BusinessEventImageResponse(i.Id, i.Url, i.SortOrder)).ToList(),
            e.Likes.Count,
            e.Saves.Count,
            e.Registrations.Count,
            viewerUserId.HasValue ? likedIds?.Contains(e.Id) : null,
            viewerUserId.HasValue ? savedIds?.Contains(e.Id) : null,
            viewerUserId.HasValue ? registeredIds?.Contains(e.Id) : null,
            e.Challenge is not null,
            e.Offers.Any(),
            e.CreatedAt,
            e.UpdatedAt
        );
    }
}
