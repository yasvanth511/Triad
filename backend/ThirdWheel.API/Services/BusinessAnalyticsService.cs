using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class BusinessAnalyticsService
{
    private readonly AppDbContext _db;

    public BusinessAnalyticsService(AppDbContext db) => _db = db;

    public async Task<BusinessAnalyticsResponse> GetAnalyticsAsync(Guid partnerId)
    {
        var events = await _db.BusinessEvents
            .AsNoTracking()
            .AsSplitQuery()
            .Include(e => e.Likes)
            .Include(e => e.Saves)
            .Include(e => e.Registrations)
            .Include(e => e.Offers).ThenInclude(o => o.Claims)
            .Include(e => e.Challenge).ThenInclude(c => c!.Responses)
            .Where(e => e.BusinessPartnerId == partnerId)
            .ToListAsync();

        var breakdown = events.Select(e =>
        {
            var ch = e.Challenge;
            return new EventAnalyticsItem(
                e.Id,
                e.Title,
                e.Status,
                e.Likes.Count,
                e.Saves.Count,
                e.Registrations.Count,
                ch?.Responses.Count ?? 0,
                ch?.Responses.Count(r => r.Status == ChallengeResponseStatus.Winner) ?? 0,
                e.Offers.Sum(o => o.Claims.Count)
            );
        }).ToList();

        return new BusinessAnalyticsResponse(
            events.Count,
            events.Count(e => e.Status == BusinessEventStatus.Published),
            breakdown.Sum(b => b.Likes),
            breakdown.Sum(b => b.Saves),
            breakdown.Sum(b => b.Registrations),
            events.Sum(e => e.Offers.Count),
            breakdown.Sum(b => b.CouponClaims),
            events.Count(e => e.Challenge != null),
            breakdown.Sum(b => b.ChallengeResponses),
            breakdown.Sum(b => b.Winners),
            breakdown
        );
    }
}
