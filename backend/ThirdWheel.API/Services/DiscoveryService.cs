using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Helpers;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class DiscoveryService
{
    private readonly AppDbContext _db;

    public DiscoveryService(AppDbContext db) => _db = db;

    public async Task<List<DiscoveryCardResponse>> GetDiscoveryCardsAsync(
        Guid userId, DiscoveryFilterRequest filter)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("discovery.get_cards");
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.discovery.user_type", filter.UserType ?? "all");
        activity?.SetTag("triad.discovery.take", filter.Take);

        try
        {
            var currentUser = await _db.Users
                .Include(u => u.Couple)
                .FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new KeyNotFoundException("User not found.");

            var blockedIds = await _db.Blocks
                .Where(b => b.BlockerUserId == userId || b.BlockedUserId == userId)
                .Select(b => b.BlockerUserId == userId ? b.BlockedUserId : b.BlockerUserId)
                .ToListAsync();

            var likedIds = await _db.Likes
                .Where(l => l.FromUserId == userId)
                .Select(l => l.ToUserId)
                .ToListAsync();

            var savedIds = await _db.SavedProfiles
                .Where(s => s.UserId == userId)
                .Select(s => s.SavedUserId)
                .ToListAsync();

            var excludeIds = blockedIds
                .Concat(likedIds)
                .Concat(savedIds)
                .Append(userId)
                .ToHashSet();

            if (currentUser.CoupleId != null)
            {
                var partnerIds = await _db.Users
                    .Where(u => u.CoupleId == currentUser.CoupleId && u.Id != userId)
                    .Select(u => u.Id)
                    .ToListAsync();
                foreach (var id in partnerIds) excludeIds.Add(id);
            }

            var query = _db.Users
                .Include(u => u.Photos)
                .Include(u => u.Interests)
                .Where(u => !excludeIds.Contains(u.Id) && !u.IsBanned);

            if (filter.UserType == "single")
                query = query.Where(u => u.CoupleId == null);
            else if (filter.UserType == "couple")
                query = query.Where(u => u.CoupleId != null);

            query = query.Where(u => u.Photos.Count > 0 && u.Bio.Length > 0);

            // ── Geo-filter at the DB level before paginating ─────────────────
            // Compute effective radius in km (prefer per-user radius over filter param).
            double? radiusKm = null;
            if (currentUser.RadiusMiles.HasValue)
                radiusKm = GeoUtils.MilesToKilometres(currentUser.RadiusMiles.Value);
            else if (filter.MaxDistanceKm.HasValue)
                radiusKm = filter.MaxDistanceKm.Value;

            // Apply bounding-box pre-filter when lat/lon are available — cheap SQL
            // comparison that dramatically reduces the candidate set before the
            // in-memory Haversine check below.
            if (radiusKm.HasValue
                && currentUser.Latitude.HasValue
                && currentUser.Longitude.HasValue)
            {
                double latDelta = radiusKm.Value / 111.0;          // ~1 degree lat ≈ 111 km
                double lonDelta = radiusKm.Value /
                    (111.0 * Math.Cos(currentUser.Latitude.Value * Math.PI / 180.0));

                double latMin = currentUser.Latitude.Value - latDelta;
                double latMax = currentUser.Latitude.Value + latDelta;
                double lonMin = currentUser.Longitude.Value - lonDelta;
                double lonMax = currentUser.Longitude.Value + lonDelta;

                query = query.Where(u =>
                    u.Latitude.HasValue && u.Longitude.HasValue &&
                    u.Latitude  >= (double?)latMin && u.Latitude  <= (double?)latMax &&
                    u.Longitude >= (double?)lonMin && u.Longitude <= (double?)lonMax);
            }

            // ── Deterministic random: stable per-user seed avoids full-table sort ──
            // Skip a random offset within the eligible pool rather than sorting the
            // entire table by Guid.NewGuid(), which cannot use any index.
            var totalEligible = await query.CountAsync();
            var randomOffset = totalEligible > filter.Take
                ? Random.Shared.Next(0, totalEligible - filter.Take)
                : 0;

            var users = await query
                .OrderBy(u => u.CreatedAt)   // stable, index-friendly sort
                .Skip(randomOffset + filter.Skip)
                .Take(filter.Take)
                .ToListAsync();

            // ── Precise Haversine pass (in-memory, small set) ────────────────
            var cards = users.Select(u =>
            {
                double? distance = null;
                if (currentUser.Latitude.HasValue && currentUser.Longitude.HasValue
                    && u.Latitude.HasValue && u.Longitude.HasValue)
                {
                    distance = GeoUtils.DistanceKm(
                        currentUser.Latitude.Value, currentUser.Longitude.Value,
                        u.Latitude.Value, u.Longitude.Value);
                }

                // Final precise radius check
                if (radiusKm.HasValue && distance.HasValue && distance.Value > radiusKm.Value)
                    return null;

                return new DiscoveryCardResponse(
                    u.Id,
                    u.Username,
                    u.Bio,
                    u.AgeMin,
                    u.AgeMax,
                    u.Intent,
                    u.LookingFor,
                    u.Interests.Select(i => i.Tag).ToList(),
                    u.Photos.OrderBy(p => p.SortOrder)
                        .Select(p => new PhotoResponse(p.Id, p.Url, p.SortOrder)).ToList(),
                    u.CoupleId != null,
                    distance.HasValue ? Math.Round(distance.Value, 0) : null,
                    u.City,
                    u.State
                );
            }).Where(c => c != null).Cast<DiscoveryCardResponse>().ToList();

            Telemetry.DiscoveryRequests.Add(1,
                new KeyValuePair<string, object?>("outcome", "success"),
                new KeyValuePair<string, object?>("user_type", filter.UserType ?? "all"));
            Telemetry.DiscoveryCardsReturned.Record(cards.Count,
                new KeyValuePair<string, object?>("user_type", filter.UserType ?? "all"));
            activity?.SetTag("triad.discovery.cards_returned", cards.Count);
            Telemetry.MarkSuccess(activity);
            return cards;
        }
        catch (Exception ex)
        {
            Telemetry.DiscoveryRequests.Add(1,
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("user_type", filter.UserType ?? "all"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

}
