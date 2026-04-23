using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services.Verification;

public sealed class InPersonVerifiedMethod : IVerificationMethod
{
    private const string DefaultFailureReason = "In-person verification failed.";
    private const string MissingMetadataReason = "In-person verification requires an event id, check-in reference, and verified venue confirmation.";

    private readonly AppDbContext _db;

    public InPersonVerifiedMethod(AppDbContext db)
    {
        _db = db;
    }

    public VerificationMethodDefinition Definition { get; } = new(
        "in_person_verified",
        "In-Person Verified",
        ["badge", "event"]);

    public async Task<VerificationEligibilityResult> EvaluateEligibilityAsync(
        VerificationEligibilityContext context,
        CancellationToken cancellationToken = default)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == context.UserId)
            .Select(u => new { u.Id, u.IsBanned })
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null || user.IsBanned)
        {
            return new VerificationEligibilityResult(false, "User is not eligible.");
        }

        return new VerificationEligibilityResult(true);
    }

    public Task<VerificationStartResult> StartAsync(
        VerificationStartContext context,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new VerificationStartResult(VerificationStatus.Pending));
    }

    public Task<VerificationProviderResult> CompleteAsync(
        VerificationCompletionContext context,
        CancellationToken cancellationToken = default)
    {
        var decision = NormalizeDecision(context.Input.Decision ?? context.Input.ProviderToken);
        var providerReference = NormalizeValue(context.Input.ProviderReference) ?? context.Attempt.ProviderReference;
        var eventId = NormalizeValue(context.Input.EventId);
        var checkInReference = NormalizeValue(context.Input.CheckInReference);
        var verifiedAtVenue = context.Input.VerifiedAtVenue ?? false;

        if (decision == "verified" && (eventId == null || checkInReference == null || !verifiedAtVenue))
        {
            return Task.FromResult(CreateResult(
                "failed",
                providerReference,
                eventId,
                checkInReference,
                verifiedAtVenue,
                MissingMetadataReason));
        }

        return Task.FromResult(CreateResult(
            decision,
            providerReference,
            eventId,
            checkInReference,
            verifiedAtVenue,
            decision == "failed" ? DefaultFailureReason : null));
    }

    public VerificationMethodResult MapResult(VerificationProviderResult providerResult, VerificationCompletionContext context)
    {
        return providerResult.Decision switch
        {
            "verified" => new VerificationMethodResult(
                VerificationStatus.Verified,
                VerifiedAt: context.NowUtc,
                ExpiresAt: context.Options.ExpiresAfterDays.HasValue
                    ? context.NowUtc.AddDays(context.Options.ExpiresAfterDays.Value)
                    : null,
                StateJson: providerResult.ResultJson),
            "in_review" => new VerificationMethodResult(
                VerificationStatus.InReview,
                StateJson: providerResult.ResultJson),
            _ => new VerificationMethodResult(
                VerificationStatus.Failed,
                providerResult.FailureReason ?? DefaultFailureReason,
                StateJson: providerResult.ResultJson)
        };
    }

    private static string NormalizeDecision(string? decision)
    {
        return (decision ?? "failed").Trim().ToLowerInvariant() switch
        {
            "approved" or "verified" or "pass" or "passed" => "verified",
            "review" or "in_review" or "manual_review" => "in_review",
            _ => "failed"
        };
    }

    private static string? NormalizeValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static VerificationProviderResult CreateResult(
        string decision,
        string? providerReference,
        string? eventId,
        string? checkInReference,
        bool verifiedAtVenue,
        string? failureReason)
    {
        return new VerificationProviderResult(
            decision,
            providerReference,
            failureReason,
            VerificationService.SerializePayload(new
            {
                decision,
                providerReference,
                eventId,
                checkInReference,
                verifiedAtVenue,
                failureReason
            }));
    }
}
