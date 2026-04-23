using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class MessagingService
{
    private readonly AppDbContext _db;
    private readonly AntiSpamService _antiSpam;

    public MessagingService(AppDbContext db, AntiSpamService antiSpam)
    {
        _db = db;
        _antiSpam = antiSpam;
    }

    private sealed record SenderContext(Guid UserId, string Username, string? PhotoUrl, Guid? CoupleId, bool IsBanned);

    private sealed record MatchAccess(bool IsActive);

    private sealed record SenderSummary(string Username, string? PhotoUrl);

    public async Task<MessageResponse> SendMessageAsync(Guid userId, Guid matchId, string content)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("messaging.send");
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.match.id", matchId);

        try
        {
            var sender = await GetSenderContextAsync(userId);
            var match = await GetMatchAccessAsync(userId, sender.CoupleId, matchId)
                ?? throw new KeyNotFoundException("Match not found.");

            if (!match.IsActive)
                throw new InvalidOperationException("Match is no longer active.");

            await _antiSpam.CheckMessageAsync(userId, matchId, content, sender.IsBanned);

            var message = new Message
            {
                MatchId = matchId,
                SenderId = userId,
                Content = content
            };

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            Telemetry.MessagesSent.Add(1,
                new KeyValuePair<string, object?>("channel", "chat"));
            activity?.SetTag("messaging.message.id", message.Id);
            Telemetry.MarkSuccess(activity);
            return new MessageResponse(message.Id, message.SenderId, sender.Username, sender.PhotoUrl, message.Content, message.SentAt, false);
        }
        catch (Exception ex)
        {
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task<List<MessageResponse>> GetMessagesAsync(Guid userId, Guid matchId, int skip = 0, int take = 50)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("messaging.get_history");
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.match.id", matchId);
        activity?.SetTag("triad.history.take", take);

        try
        {
            var sender = await GetSenderContextAsync(userId);
            var match = await GetMatchAccessAsync(userId, sender.CoupleId, matchId);
            if (match == null)
                throw new KeyNotFoundException("Match not found.");

            var messages = await _db.Messages
                .AsNoTracking()
                .Where(m => m.MatchId == matchId)
                .OrderByDescending(m => m.SentAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            var unreadIds = messages
                .Where(m => m.SenderId != userId && !m.IsRead)
                .Select(m => m.Id)
                .ToList();

            if (unreadIds.Count > 0)
            {
                await _db.Messages
                    .Where(m => unreadIds.Contains(m.Id))
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(m => m.IsRead, true));
            }

            var senderIds = messages.Select(m => m.SenderId).Distinct().ToList();
            var senders = await _db.Users
                .AsNoTracking()
                .Where(u => senderIds.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    Summary = new SenderSummary(
                        u.Username,
                        u.Photos.OrderBy(p => p.SortOrder)
                            .Select(p => p.Url)
                            .FirstOrDefault())
                })
                .ToDictionaryAsync(u => u.Id, u => u.Summary);

            var unreadIdSet = unreadIds.ToHashSet();

            var response = messages
                .OrderBy(m => m.SentAt)
                .Select(m =>
                {
                    var sender = senders.GetValueOrDefault(m.SenderId);
                    return new MessageResponse(
                        m.Id,
                        m.SenderId,
                        sender?.Username ?? "Unknown",
                        sender?.PhotoUrl,
                        m.Content,
                        m.SentAt,
                        m.IsRead || unreadIdSet.Contains(m.Id));
                })
                .ToList();

            Telemetry.MessagesFetched.Record(response.Count,
                new KeyValuePair<string, object?>("channel", "chat"));
            activity?.SetTag("triad.messages.returned", response.Count);
            Telemetry.MarkSuccess(activity);
            return response;
        }
        catch (Exception ex)
        {
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    private async Task<SenderContext> GetSenderContextAsync(Guid userId)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new SenderContext(
                u.Id,
                u.Username,
                u.Photos.OrderBy(p => p.SortOrder)
                    .Select(p => p.Url)
                    .FirstOrDefault(),
                u.CoupleId,
                u.IsBanned))
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("User not found.");
    }

    private Task<MatchAccess?> GetMatchAccessAsync(Guid userId, Guid? coupleId, Guid matchId)
    {
        return _db.Matches
            .AsNoTracking()
            .Where(m => m.Id == matchId)
            .Where(m => m.User1Id == userId
                || m.User2Id == userId
                || (coupleId != null && (m.Couple1Id == coupleId || m.Couple2Id == coupleId)))
            .Select(m => new MatchAccess(m.IsActive))
            .FirstOrDefaultAsync();
    }
}
