using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services.Verification;

public sealed class SocialVerifiedMethod : IVerificationMethod
{
    private const string DefaultFailureReason = "Social verification failed.";
    private const string MissingMetadataReason = "Social verification requires a provider and social account id.";
    private const string UnsupportedProviderReason = "Social provider is not approved.";

    private readonly AppDbContext _db;

    public SocialVerifiedMethod(AppDbContext db)
    {
        _db = db;
    }

    public VerificationMethodDefinition Definition { get; } = new(
        "social_verified",
        "Social Verified",
        ["badge", "social"]);

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
        var providerReference = context.Input.ProviderReference ?? context.Attempt.ProviderReference;
        var socialProvider = NormalizeValue(context.Input.SocialProvider);
        var socialAccountId = NormalizeValue(context.Input.SocialAccountId);

        if (decision == "verified" && (socialProvider == null || socialAccountId == null))
        {
            return Task.FromResult(CreateResult(
                "failed",
                providerReference,
                socialProvider,
                socialAccountId,
                MissingMetadataReason));
        }

        if (decision == "verified" && !IsApprovedProvider(socialProvider, context.Options))
        {
            return Task.FromResult(CreateResult(
                "failed",
                providerReference,
                socialProvider,
                socialAccountId,
                UnsupportedProviderReason));
        }

        return Task.FromResult(CreateResult(
            decision,
            providerReference,
            socialProvider,
            socialAccountId,
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

    private static bool IsApprovedProvider(string? socialProvider, VerificationMethodOptions options)
    {
        if (socialProvider == null)
        {
            return false;
        }

        if (!options.Settings.TryGetValue("approvedProviders", out var configuredProviders) ||
            string.IsNullOrWhiteSpace(configuredProviders))
        {
            return true;
        }

        var approvedProviders = configuredProviders
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return approvedProviders.Contains(socialProvider, StringComparer.OrdinalIgnoreCase);
    }

    private static VerificationProviderResult CreateResult(
        string decision,
        string? providerReference,
        string? socialProvider,
        string? socialAccountId,
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
                socialProvider,
                socialAccountId,
                failureReason
            }));
    }
}
