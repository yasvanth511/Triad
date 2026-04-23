using ThirdWheel.API.Data;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services.Verification;

public sealed class IntentVerifiedMethod : SessionVerificationMethodBase
{
    private const string MissingDeclaredIntentReason = "Intent verification requires a declared intent.";
    private const string DefaultFailureReason = "Intent verification failed.";

    public IntentVerifiedMethod(AppDbContext db, ISessionVerificationVendor vendor)
        : base(db, vendor)
    {
    }

    protected override string SessionPrefix => "intent";
    protected override string FailureReason => DefaultFailureReason;

    public override VerificationMethodDefinition Definition { get; } = new(
        "intent_verified",
        "Intent Verified",
        ["badge", "intent"]);

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
        var providerReference = context.Input.ProviderReference ?? context.Attempt.ProviderReference;
        var declaredIntent = NormalizeValue(context.Input.DeclaredIntent);

        if (normalizedDecision == "verified" && declaredIntent == null)
        {
            return Task.FromResult(CreateResult(
                "failed",
                providerReference,
                declaredIntent,
                MissingDeclaredIntentReason));
        }

        return Task.FromResult(CreateResult(
            normalizedDecision,
            providerReference,
            declaredIntent,
            normalizedDecision == "failed" ? DefaultFailureReason : null));
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
        string? declaredIntent,
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
                declaredIntent,
                failureReason
            }));
    }
}
