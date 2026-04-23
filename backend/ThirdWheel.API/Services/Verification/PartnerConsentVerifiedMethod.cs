using ThirdWheel.API.Data;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services.Verification;

public sealed class PartnerConsentVerifiedMethod : SessionVerificationMethodBase
{
    private const string MissingPartnerReason = "Partner consent verification requires a partner user id.";
    private const string DefaultFailureReason = "Partner consent verification failed.";

    public PartnerConsentVerifiedMethod(AppDbContext db, ISessionVerificationVendor vendor)
        : base(db, vendor)
    {
    }

    protected override string SessionPrefix => "partner_consent";
    protected override string FailureReason => DefaultFailureReason;

    public override VerificationMethodDefinition Definition { get; } = new(
        "partner_consent_verified",
        "Partner Consent Verified",
        ["badge", "partner"]);

    public override Task<VerificationStartResult> StartAsync(
        VerificationStartContext context,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new VerificationStartResult(VerificationStatus.Pending));
    }

    public override Task<VerificationProviderResult> CompleteAsync(
        VerificationCompletionContext context,
        CancellationToken cancellationToken = default)
    {
        var normalizedDecision = NormalizeDecision(context.Input.Decision ?? context.Input.ProviderToken);
        var partnerUserId = context.Input.PartnerUserId?.Trim();
        var consentRecordedAt = context.Input.ConsentRecordedAt ?? context.NowUtc;
        var providerReference = context.Input.ProviderReference ?? context.Attempt.ProviderReference;

        if (normalizedDecision == "verified" && string.IsNullOrWhiteSpace(partnerUserId))
        {
            return Task.FromResult(CreateResult(
                "failed",
                providerReference,
                partnerUserId,
                MissingPartnerReason,
                consentRecordedAt));
        }

        return Task.FromResult(CreateResult(
            normalizedDecision,
            providerReference,
            partnerUserId,
            normalizedDecision == "failed"
                ? DefaultFailureReason
                : null,
            consentRecordedAt));
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

    private static VerificationProviderResult CreateResult(
        string decision,
        string? providerReference,
        string? partnerUserId,
        string? failureReason,
        DateTimeOffset? consentRecordedAt = null)
    {
        return new VerificationProviderResult(
            decision,
            providerReference,
            failureReason,
            VerificationService.SerializePayload(new
            {
                decision,
                providerReference,
                partnerUserId,
                consentRecordedAt,
                failureReason
            }));
    }
}
