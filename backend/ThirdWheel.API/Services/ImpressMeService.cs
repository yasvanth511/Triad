using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class ImpressMeService
{
    private readonly AppDbContext _db;
    private readonly PromptGeneratorService _promptGen;
    private readonly NotificationService _notifications;

    public ImpressMeService(AppDbContext db, PromptGeneratorService promptGen, NotificationService notifications)
    {
        _db = db;
        _promptGen = promptGen;
        _notifications = notifications;
    }

    // ── Send ─────────────────────────────────────────────────────────────────

    public async Task<ImpressMeSignalResponse> SendAsync(Guid senderId, SendImpressMeRequest req)
    {
        if (req.TargetUserId == senderId)
            throw new InvalidOperationException("You cannot send an Impress Me signal to yourself.");

        var senderExists = await _db.Users.AnyAsync(u => u.Id == senderId && !u.IsBanned);
        if (!senderExists)
            throw new KeyNotFoundException("Sender not found.");

        var receiver = await _db.Users
            .Include(u => u.Interests)
            .FirstOrDefaultAsync(u => u.Id == req.TargetUserId && !u.IsBanned);
        if (receiver is null)
            throw new KeyNotFoundException("Target user not found.");

        var isBlocked = await _db.Blocks.AnyAsync(b =>
            (b.BlockerUserId == senderId   && b.BlockedUserId == req.TargetUserId) ||
            (b.BlockerUserId == req.TargetUserId && b.BlockedUserId == senderId));
        if (isBlocked)
            throw new InvalidOperationException("Unable to send signal.");

        // One active signal per direction
        var alreadyPending = await _db.ImpressMeSignals.AnyAsync(s =>
            s.SenderId == senderId &&
            s.ReceiverId == req.TargetUserId &&
            s.Status == ImpressMeStatus.Sent &&
            s.ExpiresAt > DateTime.UtcNow);
        if (alreadyPending)
            throw new InvalidOperationException("You already have a pending Impress Me signal to this person.");

        // Daily quota
        var todayStart = DateTime.UtcNow.Date;
        var sentToday = await _db.ImpressMeSignals
            .CountAsync(s => s.SenderId == senderId && s.CreatedAt >= todayStart);
        if (sentToday >= ImpressMeConfig.DailyQuotaPerUser)
            throw new InvalidOperationException(
                $"Daily limit of {ImpressMeConfig.DailyQuotaPerUser} Impress Me signals reached. Try again tomorrow.");

        var flow = req.MatchId.HasValue ? ImpressMeFlow.PostMatch : ImpressMeFlow.PreMatch;
        var generated = _promptGen.Generate(receiver);

        var signal = new ImpressMeSignal
        {
            SenderId   = senderId,
            ReceiverId = req.TargetUserId,
            MatchId    = req.MatchId,
            Flow       = flow,
            Status     = ImpressMeStatus.Sent,
            ExpiresAt  = DateTime.UtcNow.AddHours(ImpressMeConfig.ExpiryHours),
            Prompt = new ImpressMePrompt
            {
                Category      = generated.Category,
                PromptText    = generated.PromptText,
                SenderContext = generated.SenderContext
            }
        };

        _db.ImpressMeSignals.Add(signal);
        await _db.SaveChangesAsync();

        try { await _notifications.NotifyImpressMeAsync(senderId, req.TargetUserId, signal.Id); } catch { }

        return await LoadAndMapAsync(signal.Id);
    }

    // ── Inbox / Sent ─────────────────────────────────────────────────────────

    public async Task<ImpressMeInboxResponse> GetInboxAsync(Guid userId)
    {
        var received = await _db.ImpressMeSignals
            .Include(s => s.Sender).ThenInclude(u => u.Photos)
            .Include(s => s.Receiver)
            .Include(s => s.Prompt)
            .Include(s => s.Response)
            .Where(s => s.ReceiverId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var sent = await _db.ImpressMeSignals
            .Include(s => s.Sender)
            .Include(s => s.Receiver).ThenInclude(u => u.Photos)
            .Include(s => s.Prompt)
            .Include(s => s.Response)
            .Where(s => s.SenderId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        // Expire stale records in-memory and persist
        var now = DateTime.UtcNow;
        var toExpire = received.Concat(sent)
            .Where(s => s.Status == ImpressMeStatus.Sent && s.ExpiresAt < now)
            .ToList();
        foreach (var s in toExpire)
            s.Status = ImpressMeStatus.Expired;
        if (toExpire.Count > 0)
            await _db.SaveChangesAsync();

        var unread = received.Count(s =>
            s.Status == ImpressMeStatus.Sent && s.ViewedAt == null);

        return new ImpressMeInboxResponse(
            received.Select(Map).ToList(),
            sent.Select(Map).ToList(),
            unread);
    }

    public async Task<ImpressMeSummaryResponse> GetSummaryAsync(Guid userId)
    {
        var now = DateTime.UtcNow;

        var staleSignals = await _db.ImpressMeSignals
            .Where(s =>
                (s.ReceiverId == userId || s.SenderId == userId) &&
                s.Status == ImpressMeStatus.Sent &&
                s.ExpiresAt < now)
            .ToListAsync();

        if (staleSignals.Count > 0)
        {
            foreach (var signal in staleSignals)
                signal.Status = ImpressMeStatus.Expired;

            await _db.SaveChangesAsync();
        }

        var receivedUnreadCount = await _db.ImpressMeSignals.CountAsync(s =>
            s.ReceiverId == userId &&
            s.Status == ImpressMeStatus.Sent &&
            s.ViewedAt == null &&
            s.ExpiresAt > now);

        var sentNeedsReviewCount = await _db.ImpressMeSignals.CountAsync(s =>
            s.SenderId == userId &&
            s.Status == ImpressMeStatus.Responded);

        return new ImpressMeSummaryResponse(receivedUnreadCount, sentNeedsReviewCount);
    }

    // ── Get single ───────────────────────────────────────────────────────────

    public async Task<ImpressMeSignalResponse> GetAsync(Guid userId, Guid signalId)
    {
        var signal = await LoadAsync(signalId);
        EnsureParticipant(signal, userId);

        // Receiver opens signal for the first time
        if (signal.ReceiverId == userId && signal.Status == ImpressMeStatus.Sent && signal.ViewedAt == null)
        {
            signal.ViewedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return Map(signal);
    }

    // ── Respond ──────────────────────────────────────────────────────────────

    public async Task<ImpressMeSignalResponse> RespondAsync(Guid userId, Guid signalId, ImpressMeRespondRequest req)
    {
        var signal = await LoadAsync(signalId);

        if (signal.ReceiverId != userId)
            throw new UnauthorizedAccessException("You are not the receiver of this signal.");
        if (signal.Status == ImpressMeStatus.Expired || signal.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("This signal has expired.");
        if (signal.Status != ImpressMeStatus.Sent)
            throw new InvalidOperationException($"Signal cannot be responded to in its current state.");

        var response = new ImpressMeResponse
        {
            SignalId = signal.Id,
            TextContent = req.TextContent.Trim()
        };

        _db.Entry(signal).State = EntityState.Detached;
        _db.ImpressMeResponses.Add(response);

        var respondedAt = DateTime.UtcNow;
        var updatedRows = await _db.ImpressMeSignals
            .Where(s => s.Id == signalId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(s => s.Status, ImpressMeStatus.Responded)
                .SetProperty(s => s.RespondedAt, respondedAt));

        if (updatedRows == 0)
            throw new KeyNotFoundException("Signal not found.");

        await _db.SaveChangesAsync();
        return await LoadAndMapAsync(signalId);
    }

    // ── Review (sender marks as viewed) ──────────────────────────────────────

    public async Task<ImpressMeSignalResponse> ReviewAsync(Guid userId, Guid signalId)
    {
        var signal = await LoadAsync(signalId);

        if (signal.SenderId != userId)
            throw new UnauthorizedAccessException("You are not the sender of this signal.");
        if (signal.Status != ImpressMeStatus.Responded)
            throw new InvalidOperationException("No response to review yet.");

        signal.Status    = ImpressMeStatus.Viewed;
        signal.ViewedAt  = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(signal);
    }

    // ── Accept ───────────────────────────────────────────────────────────────

    public async Task<ImpressMeSignalResponse> AcceptAsync(Guid userId, Guid signalId)
    {
        var signal = await LoadAsync(signalId);

        if (signal.SenderId != userId)
            throw new UnauthorizedAccessException("Only the sender can accept a response.");
        if (signal.Status != ImpressMeStatus.Responded && signal.Status != ImpressMeStatus.Viewed)
            throw new InvalidOperationException("Signal has no response to accept.");

        signal.Status     = ImpressMeStatus.Accepted;
        signal.ResolvedAt = DateTime.UtcNow;

        // Pre-match → auto-create match record
        if (signal.Flow == ImpressMeFlow.PreMatch && ImpressMeConfig.AutoCreateMatchOnAccept)
        {
            var u1 = signal.SenderId   < signal.ReceiverId ? signal.SenderId   : signal.ReceiverId;
            var u2 = signal.SenderId   < signal.ReceiverId ? signal.ReceiverId : signal.SenderId;
            var exists = await _db.Matches.AnyAsync(m => m.User1Id == u1 && m.User2Id == u2);
            if (!exists)
                _db.Matches.Add(new Match { User1Id = u1, User2Id = u2 });
        }

        await _db.SaveChangesAsync();
        return Map(signal);
    }

    // ── Decline ──────────────────────────────────────────────────────────────

    public async Task<ImpressMeSignalResponse> DeclineAsync(Guid userId, Guid signalId)
    {
        var signal = await LoadAsync(signalId);

        if (signal.SenderId != userId)
            throw new UnauthorizedAccessException("Only the sender can decline a response.");
        if (signal.Status != ImpressMeStatus.Responded && signal.Status != ImpressMeStatus.Viewed)
            throw new InvalidOperationException("Signal has no response to decline.");

        signal.Status     = ImpressMeStatus.Declined;
        signal.ResolvedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Map(signal);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<ImpressMeSignal> LoadAsync(Guid signalId)
    {
        return await _db.ImpressMeSignals
            .Include(s => s.Sender).ThenInclude(u => u.Photos)
            .Include(s => s.Receiver).ThenInclude(u => u.Photos)
            .Include(s => s.Prompt)
            .Include(s => s.Response)
            .FirstOrDefaultAsync(s => s.Id == signalId)
            ?? throw new KeyNotFoundException("Signal not found.");
    }

    private async Task<ImpressMeSignalResponse> LoadAndMapAsync(Guid signalId)
        => Map(await LoadAsync(signalId));

    private static void EnsureParticipant(ImpressMeSignal signal, Guid userId)
    {
        if (signal.SenderId != userId && signal.ReceiverId != userId)
            throw new UnauthorizedAccessException("Access denied.");
    }

    private static ImpressMeSignalResponse Map(ImpressMeSignal s)
    {
        var senderPhoto   = s.Sender.Photos.OrderBy(p => p.SortOrder).FirstOrDefault()?.Url;
        var receiverPhoto = s.Receiver.Photos.OrderBy(p => p.SortOrder).FirstOrDefault()?.Url;

        return new ImpressMeSignalResponse(
            s.Id,
            s.SenderId,
            s.Sender.Username,
            senderPhoto,
            s.ReceiverId,
            s.Receiver.Username,
            receiverPhoto,
            s.MatchId,
            s.Flow.ToString(),
            s.Status.ToString(),
            new ImpressMePromptResponse(s.Prompt.Id, s.Prompt.Category, s.Prompt.PromptText, s.Prompt.SenderContext),
            s.Response is null ? null : new ImpressMeResponseResponse(
                s.Response.Id,
                s.Response.TextContent,
                s.Response.MediaUrl,
                s.Response.MediaType,
                s.Response.CreatedAt),
            s.CreatedAt,
            s.ExpiresAt,
            s.RespondedAt,
            s.ViewedAt,
            s.ResolvedAt
        );
    }
}
