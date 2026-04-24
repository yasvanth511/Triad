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
            .Where(e => e.BusinessPartnerId == partnerId)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Status
            })
            .ToListAsync();

        var eventIds = events.Select(e => e.Id).ToList();

        var likeCounts = await _db.EventLikes
            .AsNoTracking()
            .Where(l => eventIds.Contains(l.BusinessEventId))
            .GroupBy(l => l.BusinessEventId)
            .Select(g => new { EventId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.EventId, x => x.Count);

        var saveCounts = await _db.EventSaves
            .AsNoTracking()
            .Where(s => eventIds.Contains(s.BusinessEventId))
            .GroupBy(s => s.BusinessEventId)
            .Select(g => new { EventId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.EventId, x => x.Count);

        var regCounts = await _db.EventRegistrations
            .AsNoTracking()
            .Where(r => eventIds.Contains(r.BusinessEventId))
            .GroupBy(r => r.BusinessEventId)
            .Select(g => new { EventId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.EventId, x => x.Count);

        var offerIds = await _db.BusinessOffers
            .AsNoTracking()
            .Where(o => eventIds.Contains(o.BusinessEventId))
            .Select(o => o.Id)
            .ToListAsync();

        var claimCounts = await _db.CouponClaims
            .AsNoTracking()
            .Where(c => offerIds.Contains(c.BusinessOfferId))
            .GroupBy(c => c.BusinessOfferId)
            .Select(g => new { OfferId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.OfferId, x => x.Count);

        var offersByEvent = await _db.BusinessOffers
            .AsNoTracking()
            .Where(o => eventIds.Contains(o.BusinessEventId))
            .GroupBy(o => o.BusinessEventId)
            .Select(g => new { EventId = g.Key, Total = g.Count(), TotalClaims = g.SelectMany(o => o.Claims).Count() })
            .ToListAsync();

        var challengeData = await _db.EventChallenges
            .AsNoTracking()
            .Where(c => eventIds.Contains(c.BusinessEventId))
            .Select(c => new
            {
                c.BusinessEventId,
                ChallengeId = c.Id,
                ResponseCount = c.Responses.Count,
                WinnerCount = c.Responses.Count(r => r.Status == ChallengeResponseStatus.Winner)
            })
            .ToDictionaryAsync(x => x.BusinessEventId);

        var offerEventMap = await _db.BusinessOffers
            .AsNoTracking()
            .Where(o => eventIds.Contains(o.BusinessEventId))
            .Select(o => new { o.BusinessEventId, o.Id })
            .ToListAsync();

        var offerEventGrouped = offerEventMap
            .GroupBy(o => o.BusinessEventId)
            .ToDictionary(g => g.Key, g => g.Select(o => o.Id).ToList());

        var breakdown = events.Select(e =>
        {
            challengeData.TryGetValue(e.Id, out var ch);
            offerEventGrouped.TryGetValue(e.Id, out var eOfferIds);
            var totalClaims = eOfferIds?.Sum(id => claimCounts.GetValueOrDefault(id)) ?? 0;

            return new EventAnalyticsItem(
                e.Id,
                e.Title,
                e.Status,
                likeCounts.GetValueOrDefault(e.Id),
                saveCounts.GetValueOrDefault(e.Id),
                regCounts.GetValueOrDefault(e.Id),
                ch?.ResponseCount ?? 0,
                ch?.WinnerCount ?? 0,
                totalClaims
            );
        }).ToList();

        return new BusinessAnalyticsResponse(
            events.Count,
            events.Count(e => e.Status == BusinessEventStatus.Published),
            breakdown.Sum(b => b.Likes),
            breakdown.Sum(b => b.Saves),
            breakdown.Sum(b => b.Registrations),
            offerIds.Count,
            breakdown.Sum(b => b.CouponClaims),
            challengeData.Count,
            breakdown.Sum(b => b.ChallengeResponses),
            breakdown.Sum(b => b.Winners),
            breakdown
        );
    }
}
