using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class BusinessChallengeService
{
    private readonly AppDbContext _db;

    public BusinessChallengeService(AppDbContext db) => _db = db;

    // ── Business partner management ───────────────────────────────────────────

    public async Task<EventChallengeResponse> GetChallengeAsync(Guid partnerId, Guid eventId)
    {
        var challenge = await LoadChallengeByEventAsync(eventId);
        EnsureOwnership(challenge, partnerId);
        return ToResponse(challenge, null);
    }

    public async Task<EventChallengeResponse> CreateChallengeAsync(Guid partnerId, Guid eventId, CreateEventChallengeRequest req)
    {
        ValidateChallenge(req.MaxWinners, req.ExpiryDate);

        var ev = await _db.BusinessEvents
            .Include(e => e.Challenge)
            .FirstOrDefaultAsync(e => e.Id == eventId && e.BusinessPartnerId == partnerId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.Challenge is not null)
            throw new InvalidOperationException("This event already has a challenge. Update it instead.");

        if (ev.Status is BusinessEventStatus.Cancelled or BusinessEventStatus.Archived)
            throw new InvalidOperationException("Cannot add challenge to a cancelled or archived event.");

        var challenge = new EventChallenge
        {
            BusinessEventId = eventId,
            Prompt = req.Prompt,
            RewardType = req.RewardType,
            RewardDescription = req.RewardDescription,
            MaxWinners = req.MaxWinners,
            ExpiryDate = req.ExpiryDate,
            Status = ChallengeStatus.Draft
        };

        _db.EventChallenges.Add(challenge);
        await _db.SaveChangesAsync();

        return await GetChallengeAsync(partnerId, eventId);
    }

    public async Task<EventChallengeResponse> UpdateChallengeAsync(Guid partnerId, Guid challengeId, UpdateEventChallengeRequest req)
    {
        var challenge = await LoadChallengeAsync(challengeId);
        EnsureOwnership(challenge, partnerId);

        if (challenge.Status is ChallengeStatus.Archived or ChallengeStatus.Closed)
            throw new InvalidOperationException("Cannot edit a closed or archived challenge.");

        ValidateChallenge(req.MaxWinners ?? challenge.MaxWinners, req.ExpiryDate ?? challenge.ExpiryDate);

        if (req.Prompt != null) challenge.Prompt = req.Prompt;
        if (req.RewardType.HasValue) challenge.RewardType = req.RewardType.Value;
        if (req.RewardDescription != null) challenge.RewardDescription = req.RewardDescription;
        if (req.MaxWinners.HasValue) challenge.MaxWinners = req.MaxWinners;
        if (req.ExpiryDate.HasValue) challenge.ExpiryDate = req.ExpiryDate;

        if (challenge.Status is ChallengeStatus.Active or ChallengeStatus.Approved)
            challenge.Status = ChallengeStatus.PendingApproval;

        challenge.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetChallengeAsync(partnerId, challenge.BusinessEventId);
    }

    public async Task SubmitChallengeForApprovalAsync(Guid partnerId, Guid challengeId)
    {
        var challenge = await LoadChallengeAsync(challengeId);
        EnsureOwnership(challenge, partnerId);

        if (challenge.Status is not (ChallengeStatus.Draft or ChallengeStatus.Rejected))
            throw new InvalidOperationException($"Challenge cannot be submitted from status {challenge.Status}.");

        challenge.Status = ChallengeStatus.PendingApproval;
        challenge.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteChallengeAsync(Guid partnerId, Guid challengeId)
    {
        var challenge = await LoadChallengeAsync(challengeId);
        EnsureOwnership(challenge, partnerId);

        if (challenge.Status is not ChallengeStatus.Draft)
            throw new InvalidOperationException("Only draft challenges can be deleted.");

        _db.EventChallenges.Remove(challenge);
        await _db.SaveChangesAsync();
    }

    // ── Responses ─────────────────────────────────────────────────────────────

    public async Task<List<ChallengeResponseItem>> GetResponsesAsync(Guid partnerId, Guid challengeId)
    {
        var challenge = await LoadChallengeAsync(challengeId);
        EnsureOwnership(challenge, partnerId);

        var responses = await _db.ChallengeResponses
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.EventChallengeId == challengeId)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();

        return responses.Select(r => new ChallengeResponseItem(
            r.Id, r.UserId, r.User.Username, r.ResponseText, r.Status, r.SubmittedAt)).ToList();
    }

    public async Task MarkWinnerAsync(Guid partnerId, Guid challengeId, Guid responseId, MarkWinnerRequest req)
    {
        var challenge = await LoadChallengeAsync(challengeId);
        EnsureOwnership(challenge, partnerId);

        if (challenge.Status is not ChallengeStatus.Active)
            throw new InvalidOperationException("Challenge must be active to select winners.");

        var currentWinners = await _db.ChallengeResponses
            .CountAsync(r => r.EventChallengeId == challengeId && r.Status == ChallengeResponseStatus.Winner);

        if (challenge.MaxWinners.HasValue && currentWinners >= challenge.MaxWinners.Value)
            throw new InvalidOperationException($"Maximum {challenge.MaxWinners.Value} winners already selected.");

        var response = await _db.ChallengeResponses
            .FirstOrDefaultAsync(r => r.Id == responseId && r.EventChallengeId == challengeId)
            ?? throw new KeyNotFoundException("Response not found.");

        if (response.Status == ChallengeResponseStatus.Winner)
            throw new InvalidOperationException("This response is already marked as a winner.");

        response.Status = ChallengeResponseStatus.Winner;

        var alreadyIssued = await _db.RewardClaims
            .AnyAsync(rc => rc.UserId == response.UserId && rc.EventChallengeId == challengeId);

        if (!alreadyIssued)
        {
            _db.RewardClaims.Add(new RewardClaim
            {
                UserId = response.UserId,
                EventChallengeId = challengeId,
                ChallengeResponseId = responseId,
                RewardCode = req.RewardCode,
                RewardNote = req.RewardNote
            });
        }

        await _db.SaveChangesAsync();
    }

    // ── User-facing ───────────────────────────────────────────────────────────

    public async Task<EventChallengeResponse> GetPublicChallengeAsync(Guid eventId, Guid? userId)
    {
        var ev = await _db.BusinessEvents
            .AnyAsync(e => e.Id == eventId && e.Status == BusinessEventStatus.Published);

        if (!ev)
            throw new KeyNotFoundException("Event not found.");

        var challenge = await LoadChallengeByEventAsync(eventId);

        if (challenge.Status != ChallengeStatus.Active)
            throw new KeyNotFoundException("No active challenge for this event.");

        return ToResponse(challenge, userId);
    }

    public async Task SubmitResponseAsync(Guid userId, Guid eventId, SubmitChallengeResponseRequest req)
    {
        var challenge = await LoadChallengeByEventAsync(eventId);

        if (challenge.Status != ChallengeStatus.Active)
            throw new InvalidOperationException("No active challenge for this event.");

        if (challenge.ExpiryDate.HasValue && challenge.ExpiryDate.Value < DateTime.UtcNow)
            throw new InvalidOperationException("This challenge has expired.");

        if (await _db.ChallengeResponses.AnyAsync(r => r.UserId == userId && r.EventChallengeId == challenge.Id))
            throw new InvalidOperationException("You have already submitted a response to this challenge.");

        _db.ChallengeResponses.Add(new ChallengeResponse
        {
            UserId = userId,
            EventChallengeId = challenge.Id,
            ResponseText = req.ResponseText
        });

        await _db.SaveChangesAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<EventChallenge> LoadChallengeAsync(Guid challengeId)
    {
        return await _db.EventChallenges
            .Include(c => c.BusinessEvent).ThenInclude(e => e.BusinessPartner)
            .Include(c => c.Responses)
            .Include(c => c.RewardClaims)
            .FirstOrDefaultAsync(c => c.Id == challengeId)
            ?? throw new KeyNotFoundException("Challenge not found.");
    }

    private async Task<EventChallenge> LoadChallengeByEventAsync(Guid eventId)
    {
        return await _db.EventChallenges
            .Include(c => c.BusinessEvent).ThenInclude(e => e.BusinessPartner)
            .Include(c => c.Responses)
            .Include(c => c.RewardClaims)
            .FirstOrDefaultAsync(c => c.BusinessEventId == eventId)
            ?? throw new KeyNotFoundException("Challenge not found.");
    }

    private static void EnsureOwnership(EventChallenge challenge, Guid partnerId)
    {
        if (challenge.BusinessEvent.BusinessPartnerId != partnerId)
            throw new UnauthorizedAccessException("Not your challenge.");
    }

    private static void ValidateChallenge(int? maxWinners, DateTime? expiryDate)
    {
        if (maxWinners.HasValue && maxWinners.Value <= 0)
            throw new InvalidOperationException("Challenge max winners must be greater than zero.");

        if (expiryDate.HasValue && expiryDate.Value <= DateTime.UtcNow)
            throw new InvalidOperationException("Challenge expiry date must be in the future.");
    }

    internal static EventChallengeResponse ToResponse(EventChallenge c, Guid? userId)
    {
        var hasResponded = userId.HasValue
            ? c.Responses.Any(r => r.UserId == userId.Value)
            : (bool?)null;

        return new EventChallengeResponse(
            c.Id,
            c.BusinessEventId,
            c.BusinessEvent?.Title ?? string.Empty,
            c.Prompt,
            c.RewardType,
            c.RewardDescription,
            c.MaxWinners,
            c.ExpiryDate,
            c.Status,
            c.RejectionReason,
            c.Responses.Count,
            c.RewardClaims.Count,
            hasResponded,
            c.CreatedAt
        );
    }
}
