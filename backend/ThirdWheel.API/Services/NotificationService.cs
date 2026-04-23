using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Hubs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class NotificationService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<ChatHub> _hub;

    public NotificationService(AppDbContext db, IHubContext<ChatHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    public async Task NotifyLikeAsync(Guid fromUserId, Guid toUserId)
    {
        var actor = await GetActorAsync(fromUserId);
        if (actor == null) return;

        var notification = new Notification
        {
            RecipientId = toUserId,
            ActorId = fromUserId,
            ActorName = actor.Username,
            ActorPhotoUrl = actor.PhotoUrl,
            Type = NotificationType.LikeReceived,
            Title = "Someone liked you",
            Body = $"{actor.Username} liked your profile.",
            ReferenceId = fromUserId
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();
        await PushAsync(toUserId, notification);
    }

    public async Task NotifyMatchAsync(Match match, Guid initiatingUserId)
    {
        var participantIds = await ResolveParticipantIdsAsync(match);

        var actors = await _db.Users
            .AsNoTracking()
            .Where(u => participantIds.Contains(u.Id))
            .Select(u => new ActorInfo(
                u.Id,
                u.Username,
                u.Photos.OrderBy(p => p.SortOrder).Select(p => p.Url).FirstOrDefault()))
            .ToDictionaryAsync(a => a.UserId);

        var notifications = new List<Notification>();
        foreach (var recipientId in participantIds)
        {
            var actorId = participantIds.FirstOrDefault(id => id != recipientId && id == initiatingUserId)
                != default ? initiatingUserId
                : participantIds.FirstOrDefault(id => id != recipientId);

            actors.TryGetValue(actorId, out var actor);

            notifications.Add(new Notification
            {
                RecipientId = recipientId,
                ActorId = actor?.UserId,
                ActorName = actor?.Username,
                ActorPhotoUrl = actor?.PhotoUrl,
                Type = NotificationType.MatchCreated,
                Title = "New match!",
                Body = actor != null ? $"You matched with {actor.Username}!" : "You have a new match!",
                ReferenceId = match.Id
            });
        }

        _db.Notifications.AddRange(notifications);
        await _db.SaveChangesAsync();

        foreach (var n in notifications)
            await PushAsync(n.RecipientId, n);
    }

    public async Task NotifyMessageAsync(Guid senderId, Guid matchId, string content)
    {
        var match = await _db.Matches.AsNoTracking().FirstOrDefaultAsync(m => m.Id == matchId);
        if (match == null) return;

        var participantIds = await ResolveParticipantIdsAsync(match);
        var recipients = participantIds.Where(id => id != senderId).ToList();
        if (recipients.Count == 0) return;

        var actor = await GetActorAsync(senderId);
        if (actor == null) return;

        var preview = content.Length > 80 ? content[..77] + "..." : content;

        var notifications = recipients.Select(recipientId => new Notification
        {
            RecipientId = recipientId,
            ActorId = senderId,
            ActorName = actor.Username,
            ActorPhotoUrl = actor.PhotoUrl,
            Type = NotificationType.MessageReceived,
            Title = $"Message from {actor.Username}",
            Body = preview,
            ReferenceId = matchId
        }).ToList();

        _db.Notifications.AddRange(notifications);
        await _db.SaveChangesAsync();

        foreach (var n in notifications)
            await PushAsync(n.RecipientId, n);
    }

    public async Task NotifyImpressMeAsync(Guid senderId, Guid receiverId, Guid signalId)
    {
        var actor = await GetActorAsync(senderId);
        if (actor == null) return;

        var notification = new Notification
        {
            RecipientId = receiverId,
            ActorId = senderId,
            ActorName = actor.Username,
            ActorPhotoUrl = actor.PhotoUrl,
            Type = NotificationType.ImpressMeReceived,
            Title = "Impress Me challenge!",
            Body = $"{actor.Username} sent you an Impress Me challenge.",
            ReferenceId = signalId
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();
        await PushAsync(receiverId, notification);
    }

    public async Task<NotificationListResponse> GetNotificationsAsync(Guid userId, int skip, int take)
    {
        var notifications = await _db.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        var unreadCount = await _db.Notifications
            .CountAsync(n => n.RecipientId == userId && !n.IsRead);

        return new NotificationListResponse(notifications.Select(Map).ToList(), unreadCount);
    }

    public async Task MarkReadAsync(Guid userId, Guid notificationId)
    {
        await _db.Notifications
            .Where(n => n.Id == notificationId && n.RecipientId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        await _db.Notifications
            .Where(n => n.RecipientId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<ActorInfo?> GetActorAsync(Guid userId)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new ActorInfo(
                u.Id,
                u.Username,
                u.Photos.OrderBy(p => p.SortOrder).Select(p => p.Url).FirstOrDefault()))
            .FirstOrDefaultAsync();
    }

    private async Task<HashSet<Guid>> ResolveParticipantIdsAsync(Match match)
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
            foreach (var id in partnerIds) ids.Add(id);
        }

        return ids;
    }

    private async Task PushAsync(Guid recipientId, Notification notification)
    {
        await _hub.Clients
            .Group(recipientId.ToString())
            .SendAsync("ReceiveNotification", Map(notification));
    }

    private static NotificationResponse Map(Notification n) =>
        new(n.Id, n.Type.ToString(), n.Title, n.Body, n.ReferenceId,
            n.ActorId, n.ActorName, n.ActorPhotoUrl, n.IsRead, n.CreatedAt);

    private sealed record ActorInfo(Guid UserId, string Username, string? PhotoUrl);
}
