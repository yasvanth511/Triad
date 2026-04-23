using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services.Verification;

public interface ISessionVerificationVendor
{
    Task<VerificationVendorSession> StartSessionAsync(
        Guid userId,
        string sessionPrefix,
        VerificationMethodOptions options,
        CancellationToken cancellationToken = default);

    Task<VerificationVendorCompletion> CompleteSessionAsync(
        VerificationCompletionContext context,
        string failureReason,
        CancellationToken cancellationToken = default);
}

public sealed record VerificationVendorSession(
    string ProviderReference,
    string ClientToken,
    DateTime? ExpiresAt,
    string? PayloadJson
);

public sealed record VerificationVendorCompletion(
    string Decision,
    string ProviderReference,
    string? FailureReason,
    string? ResultJson
);

public sealed class MockSessionVerificationVendor : ISessionVerificationVendor
{
    public Task<VerificationVendorSession> StartSessionAsync(
        Guid userId,
        string sessionPrefix,
        VerificationMethodOptions options,
        CancellationToken cancellationToken = default)
    {
        var providerReference = $"{sessionPrefix}_{Guid.NewGuid():n}";
        var clientToken = $"client_{Guid.NewGuid():n}";
        var expiresAt = DateTime.UtcNow.AddMinutes(15);
        var payload = VerificationService.SerializePayload(new
        {
            providerReference,
            mode = options.Settings.GetValueOrDefault("mode") ?? "mock"
        });

        return Task.FromResult(new VerificationVendorSession(providerReference, clientToken, expiresAt, payload));
    }

    public Task<VerificationVendorCompletion> CompleteSessionAsync(
        VerificationCompletionContext context,
        string failureReason,
        CancellationToken cancellationToken = default)
    {
        var decision = (context.Input.Decision ?? context.Input.ProviderToken ?? "failed").Trim().ToLowerInvariant();
        var normalizedDecision = decision switch
        {
            "approved" or "verified" or "pass" or "passed" or "liveness_passed" => "verified",
            "review" or "in_review" or "manual_review" => "in_review",
            _ => "failed"
        };

        var providerReference = context.Input.ProviderReference ?? context.Attempt.ProviderReference ?? string.Empty;
        var resultJson = VerificationService.SerializePayload(new
        {
            decision = normalizedDecision,
            providerReference
        });

        return Task.FromResult(new VerificationVendorCompletion(
            normalizedDecision,
            providerReference,
            normalizedDecision == "failed" ? failureReason : null,
            resultJson));
    }
}

public abstract class SessionVerificationMethodBase : IVerificationMethod
{
    private readonly AppDbContext _db;
    private readonly ISessionVerificationVendor _vendor;

    protected SessionVerificationMethodBase(AppDbContext db, ISessionVerificationVendor vendor)
    {
        _db = db;
        _vendor = vendor;
    }

    protected abstract string SessionPrefix { get; }
    protected abstract string FailureReason { get; }
    protected AppDbContext Db => _db;
    public abstract VerificationMethodDefinition Definition { get; }

    public virtual async Task<VerificationEligibilityResult> EvaluateEligibilityAsync(VerificationEligibilityContext context, CancellationToken cancellationToken = default)
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

    public virtual async Task<VerificationStartResult> StartAsync(VerificationStartContext context, CancellationToken cancellationToken = default)
    {
        var session = await _vendor.StartSessionAsync(context.UserId, SessionPrefix, context.Options, cancellationToken);
        return new VerificationStartResult(
            VerificationStatus.Pending,
            session.ProviderReference,
            session.ClientToken,
            session.PayloadJson,
            session.ExpiresAt
        );
    }

    public virtual async Task<VerificationProviderResult> CompleteAsync(VerificationCompletionContext context, CancellationToken cancellationToken = default)
    {
        var vendorResult = await _vendor.CompleteSessionAsync(context, FailureReason, cancellationToken);
        return new VerificationProviderResult(
            vendorResult.Decision,
            vendorResult.ProviderReference,
            vendorResult.FailureReason,
            vendorResult.ResultJson
        );
    }

    public virtual VerificationMethodResult MapResult(VerificationProviderResult providerResult, VerificationCompletionContext context)
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
                providerResult.FailureReason ?? FailureReason,
                StateJson: providerResult.ResultJson)
        };
    }
}
