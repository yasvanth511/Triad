using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class MessagingService
{
    private readonly AppDbContext _db;
    private readonly AntiSpamService _antiSpam;
    private readonly MatchingService _matchingService;

    public MessagingService(AppDbContext db, AntiSpamService antiSpam, MatchingService matchingService)
    {
        _db = db;
        _antiSpam = antiSpam;
        _matchingService = matchingService;
    }

    public async Task<MessageResponse> SendMessageAsync(Guid userId, Guid matchId, string content)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("messaging.send");
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.match.id", matchId);

        try
        {
            var participantIds = await _matchingService.GetMatchParticipantIdsAsync(matchId);
            if (!participantIds.Contains(userId))
                throw new KeyNotFoundException("Match not found.");

            var match = await _db.Matches.FindAsync(matchId)!;
            if (!match!.IsActive)
                throw new InvalidOperationException("Match is no longer active.");

            await _antiSpam.CheckMessageAsync(userId, matchId, content);

            var message = new Message
            {
                MatchId = matchId,
                SenderId = userId,
                Content = content
            };

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            var sender = await _db.Users.Include(u => u.Photos).FirstOrDefaultAsync(u => u.Id == userId);
            var photoUrl = sender?.Photos.OrderBy(p => p.SortOrder).FirstOrDefault()?.Url;
            Telemetry.MessagesSent.Add(1,
                new KeyValuePair<string, object?>("channel", "chat"));
            activity?.SetTag("messaging.message.id", message.Id);
            Telemetry.MarkSuccess(activity);
            return new MessageResponse(message.Id, message.SenderId, sender?.Username ?? "Unknown", photoUrl, message.Content, message.SentAt, false);
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
            var participantIds = await _matchingService.GetMatchParticipantIdsAsync(matchId);
            if (!participantIds.Contains(userId))
                throw new KeyNotFoundException("Match not found.");

            var messages = await _db.Messages
                .Where(m => m.MatchId == matchId)
                .OrderByDescending(m => m.SentAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            var unread = messages.Where(m => m.SenderId != userId && !m.IsRead).ToList();
            foreach (var msg in unread) msg.IsRead = true;
            if (unread.Count > 0) await _db.SaveChangesAsync();

            var senderIds = messages.Select(m => m.SenderId).Distinct().ToList();
            var senders = await _db.Users
                .Include(u => u.Photos)
                .Where(u => senderIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            var response = messages
                .OrderBy(m => m.SentAt)
                .Select(m =>
                {
                    var sender = senders.GetValueOrDefault(m.SenderId);
                    var photoUrl = sender?.Photos.OrderBy(p => p.SortOrder).FirstOrDefault()?.Url;
                    return new MessageResponse(m.Id, m.SenderId, sender?.Username ?? "Unknown", photoUrl, m.Content, m.SentAt, m.IsRead);
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
}
