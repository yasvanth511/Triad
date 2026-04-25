using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class MatchingService
{
    private readonly AppDbContext _db;
    private readonly NotificationService _notifications;

    public MatchingService(AppDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<MatchResponse?> LikeUserAsync(Guid fromUserId, Guid toUserId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("matching.like");
        activity?.SetTag("enduser.id", fromUserId);
        activity?.SetTag("triad.target_user.id", toUserId);

        try
        {
            if (fromUserId == toUserId)
                throw new InvalidOperationException("Cannot like yourself.");

            // Step 2: block check + duplicate like check in one round-trip
            var guard = await _db.Users
                .Where(u => u.Id == fromUserId)
                .Select(u => new
                {
                    IsBlocked = _db.Blocks.Any(b =>
                        (b.BlockerUserId == fromUserId && b.BlockedUserId == toUserId) ||
                        (b.BlockerUserId == toUserId && b.BlockedUserId == fromUserId)),
                    AlreadyLiked = _db.Likes.Any(l => l.FromUserId == fromUserId && l.ToUserId == toUserId)
                })
                .FirstOrDefaultAsync();

            if (guard == null)
                throw new KeyNotFoundException("User not found.");
            if (guard.IsBlocked)
                throw new InvalidOperationException("Cannot interact with this user.");
            if (guard.AlreadyLiked)
                throw new InvalidOperationException("Already liked this user.");

            var todayLikes = await _db.Likes
                .CountAsync(l => l.FromUserId == fromUserId
                    && l.CreatedAt > DateTime.UtcNow.AddHours(-24));
            if (todayLikes >= AppConstants.MaxLikesPerDay)
                throw new InvalidOperationException("Daily like limit reached.");

            // Step 1: both users in one query
            var users = await _db.Users
                .Where(u => u.Id == fromUserId || u.Id == toUserId)
                .ToDictionaryAsync(u => u.Id);
            var fromUser = users.GetValueOrDefault(fromUserId) ?? throw new KeyNotFoundException("User not found.");
            var toUser   = users.GetValueOrDefault(toUserId)   ?? throw new KeyNotFoundException("User not found.");

            var like = new Like
            {
                FromUserId = fromUserId,
                ToUserId = toUserId,
                FromCoupleId = fromUser.CoupleId,
                ToCoupleId = toUser.CoupleId
            };

            var existingSave = await _db.SavedProfiles
                .FirstOrDefaultAsync(s => s.UserId == fromUserId && s.SavedUserId == toUserId);
            if (existingSave != null)
                _db.SavedProfiles.Remove(existingSave);

            _db.Likes.Add(like);
            await _db.SaveChangesAsync();

            var mutualLike = await _db.Likes
                .AnyAsync(l => l.FromUserId == toUserId && l.ToUserId == fromUserId);

            if (mutualLike)
            {
                var match = new Match
                {
                    User1Id = fromUserId < toUserId ? fromUserId : toUserId,
                    User2Id = fromUserId < toUserId ? toUserId : fromUserId,
                    Couple1Id = fromUser.CoupleId,
                    Couple2Id = toUser.CoupleId
                };

                _db.Matches.Add(match);
                await _db.SaveChangesAsync();

                // Step 3: fire-and-forget — don't block the response on notification I/O
                _ = Task.Run(async () => { try { await _notifications.NotifyMatchAsync(match, fromUserId); } catch { } });

                var participants = await ResolveParticipantsAsync(match, fromUserId);
                Telemetry.MatchOperations.Add(1,
                    new KeyValuePair<string, object?>("operation", "like"),
                    new KeyValuePair<string, object?>("outcome", "matched"));
                activity?.SetTag("triad.match.id", match.Id);
                Telemetry.MarkSuccess(activity);
                return new MatchResponse(match.Id, participants, match.CreatedAt, participants.Count > 1);
            }

            // Step 3: fire-and-forget — don't block the response on notification I/O
            _ = Task.Run(async () => { try { await _notifications.NotifyLikeAsync(fromUserId, toUserId); } catch { } });

            Telemetry.MatchOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "like"),
                new KeyValuePair<string, object?>("outcome", "liked"));
            Telemetry.MarkSuccess(activity);
            return null;
        }
        catch (Exception ex)
        {
            Telemetry.MatchOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "like"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task<List<MatchResponse>> GetMatchesAsync(Guid userId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("matching.get_matches");
        activity?.SetTag("enduser.id", userId);

        try
        {
            // ── Single query: fetch all relevant matches ──────────────────────
            var userCoupleId = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => u.CoupleId)
                .FirstOrDefaultAsync();

            var matches = await _db.Matches
                .AsNoTracking()
                .Where(m => m.IsActive &&
                    (m.User1Id == userId || m.User2Id == userId ||
                     (userCoupleId != null &&
                      (m.Couple1Id == userCoupleId || m.Couple2Id == userCoupleId) &&
                      m.User1Id != userId && m.User2Id != userId)))
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            var distinctMatches = matches.DistinctBy(m => m.Id).ToList();

            // ── Batch resolve all participant IDs in one query ────────────────
            var allUserIds = new HashSet<Guid>();
            foreach (var m in distinctMatches)
            {
                allUserIds.Add(m.User1Id);
                allUserIds.Add(m.User2Id);
            }

            var coupleIdsInMatches = distinctMatches
                .SelectMany(m => new[] { m.Couple1Id, m.Couple2Id })
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            if (coupleIdsInMatches.Count > 0)
            {
                var partnerIds = await _db.Users
                    .Where(u => u.CoupleId != null && coupleIdsInMatches.Contains(u.CoupleId.Value))
                    .Select(u => u.Id)
                    .ToListAsync();
                foreach (var id in partnerIds) allUserIds.Add(id);
            }

            // Single bulk user fetch with photos
            var userMap = await _db.Users
                .AsNoTracking()
                .Include(u => u.Photos)
                .Where(u => allUserIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            // ── Build responses without any further DB round-trips ────────────
            var result = distinctMatches.Select(match =>
            {
                var participantIds = new HashSet<Guid> { match.User1Id, match.User2Id };

                if (match.Couple1Id.HasValue || match.Couple2Id.HasValue)
                {
                    foreach (var kvp in userMap.Values)
                    {
                        if (kvp.CoupleId.HasValue &&
                            (kvp.CoupleId == match.Couple1Id || kvp.CoupleId == match.Couple2Id))
                            participantIds.Add(kvp.Id);
                    }
                }

                var participants = participantIds
                    .Where(id => id != userId && userMap.ContainsKey(id))
                    .Select(id =>
                    {
                        var u = userMap[id];
                        return new ParticipantResponse(
                            u.Id, u.Username, u.Bio ?? string.Empty,
                            u.Photos.OrderBy(p => p.SortOrder)
                                    .Select(p => new PhotoResponse(p.Id, p.Url, p.SortOrder))
                                    .ToList(),
                            u.CoupleId.HasValue, u.CoupleId);
                    }).ToList();

                return new MatchResponse(match.Id, participants, match.CreatedAt, participants.Count > 1);
            }).ToList();

            Telemetry.MatchOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "get_matches"),
                new KeyValuePair<string, object?>("outcome", "success"));
            activity?.SetTag("triad.match.count", result.Count);
            Telemetry.MarkSuccess(activity);
            return result;
        }
        catch (Exception ex)
        {
            Telemetry.MatchOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "get_matches"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task UnmatchAsync(Guid userId, Guid matchId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("matching.unmatch");
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.match.id", matchId);

        try
        {
            var participantIds = await GetMatchParticipantIdsAsync(matchId);
            if (!participantIds.Contains(userId))
                throw new KeyNotFoundException("Match not found.");

            var match = await _db.Matches.FindAsync(matchId)
                ?? throw new KeyNotFoundException("Match not found.");

            match.IsActive = false;
            await _db.SaveChangesAsync();
            Telemetry.MatchOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "unmatch"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
        }
        catch (Exception ex)
        {
            Telemetry.MatchOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "unmatch"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    /// <summary>Returns all user IDs who are participants in a match (User1, User2, and any couple partners).</summary>
    public async Task<HashSet<Guid>> GetMatchParticipantIdsAsync(Guid matchId)
    {
        var match = await _db.Matches
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new KeyNotFoundException("Match not found.");

        return await ResolveAllParticipantIdsAsync(match);
    }

    /// <summary>Resolves all participants OTHER than selfUserId for a match response.</summary>
    private async Task<List<ParticipantResponse>> ResolveParticipantsAsync(Match match, Guid selfUserId)
    {
        var allIds = await ResolveAllParticipantIdsAsync(match);
        var otherIds = allIds.Where(id => id != selfUserId).ToList();

        var users = await _db.Users
            .AsNoTracking()
            .Include(u => u.Photos)
            .Where(u => otherIds.Contains(u.Id))
            .ToListAsync();

        return users.Select(user => new ParticipantResponse(
            user.Id,
            user.Username,
            user.Bio ?? string.Empty,
            user.Photos.OrderBy(p => p.SortOrder)
                .Select(p => new PhotoResponse(p.Id, p.Url, p.SortOrder))
                .ToList(),
            user.CoupleId.HasValue,
            user.CoupleId)).ToList();
    }

    /// <summary>Collects User1, User2, and all couple partners in a single query.</summary>
    private async Task<HashSet<Guid>> ResolveAllParticipantIdsAsync(Match match)
    {
        var ids = new HashSet<Guid> { match.User1Id, match.User2Id };

        var coupleIds = new List<Guid>();
        if (match.Couple1Id.HasValue) coupleIds.Add(match.Couple1Id.Value);
        if (match.Couple2Id.HasValue) coupleIds.Add(match.Couple2Id.Value);

        if (coupleIds.Count > 0)
        {
            var partnerIds = await _db.Users
                .Where(u => u.CoupleId != null && coupleIds.Contains(u.CoupleId.Value))
                .Select(u => u.Id)
                .ToListAsync();

            foreach (var id in partnerIds)
                ids.Add(id);
        }

        return ids;
    }
}
