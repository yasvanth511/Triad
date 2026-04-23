using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services.Verification;

public class VerificationService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly AppDbContext _db;
    private readonly VerificationRegistry _registry;

    public VerificationService(AppDbContext db, VerificationRegistry registry)
    {
        _db = db;
        _registry = registry;
    }

    public async Task<VerificationListResponse> GetMethodsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var registeredMethods = _registry.List();
        var stateList = await _db.UserVerifications
            .AsNoTracking()
            .Where(v => v.UserId == userId)
            .ToListAsync(cancellationToken);
        var states = stateList.ToDictionary(v => v.MethodKey, StringComparer.OrdinalIgnoreCase);

        var methods = new List<VerificationMethodResponse>(registeredMethods.Count);
        foreach (var method in registeredMethods)
        {
            states.TryGetValue(method.Definition.Key, out var state);
            var eligibility = method.Options.Enabled
                ? await method.Handler.EvaluateEligibilityAsync(new VerificationEligibilityContext(userId), cancellationToken)
                : new VerificationEligibilityResult(false, "Method is disabled.");

            var effectiveStatus = GetEffectiveStatus(state, method.Options, DateTime.UtcNow);
            methods.Add(new VerificationMethodResponse(
                method.Definition.Key,
                method.Definition.DisplayName,
                effectiveStatus.ToString().ToLowerInvariant(),
                method.Options.Enabled,
                eligibility.IsEligible,
                eligibility.Reason,
                method.Options.Version,
                method.Definition.Capabilities,
                state?.FailureReason,
                state?.VerifiedAt,
                state?.ExpiresAt,
                state?.UpdatedAt ?? DateTime.UtcNow
            ));
        }

        return new VerificationListResponse(methods);
    }

    public async Task<StartVerificationAttemptResponse> StartAttemptAsync(
        Guid userId,
        string methodKey,
        StartVerificationAttemptRequest request,
        CancellationToken cancellationToken = default)
    {
        var method = _registry.Get(methodKey);
        var now = DateTime.UtcNow;

        if (!method.Options.Enabled)
        {
            var disabledState = await EnsureVerificationAsync(userId, method, now, cancellationToken);
            await MoveToDisabledAsync(disabledState, method, now, cancellationToken);
            throw new InvalidOperationException("Verification method is disabled.");
        }

        var eligibility = await method.Handler.EvaluateEligibilityAsync(new VerificationEligibilityContext(userId), cancellationToken);
        if (!eligibility.IsEligible)
        {
            throw new InvalidOperationException(eligibility.Reason ?? "Verification method is not eligible.");
        }

        var verification = await EnsureVerificationAsync(userId, method, now, cancellationToken);
        var idempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey)
            ? Guid.NewGuid().ToString("n")
            : request.IdempotencyKey.Trim();

        var existingAttempt = await _db.VerificationAttempts
            .AsNoTracking()
            .FirstOrDefaultAsync(a =>
                a.UserId == userId &&
                a.MethodKey == method.Definition.Key &&
                a.IdempotencyKey == idempotencyKey,
                cancellationToken);

        if (existingAttempt != null)
        {
            return new StartVerificationAttemptResponse(
                existingAttempt.Id,
                method.Definition.Key,
                existingAttempt.Status.ToString().ToLowerInvariant(),
                null,
                verification.ExpiresAt
            );
        }

        var attempt = new VerificationAttempt
        {
            UserId = userId,
            VerificationId = verification.Id,
            MethodKey = method.Definition.Key,
            MethodVersion = method.Options.Version,
            ProviderKey = method.Options.Provider,
            IdempotencyKey = idempotencyKey,
            Status = VerificationStatus.Pending
        };

        var start = await method.Handler.StartAsync(
            new VerificationStartContext(userId, verification, attempt, method.Options, now),
            cancellationToken);

        attempt.Status = start.Status;
        attempt.ProviderReference = start.ProviderReference;
        attempt.ResultJson = start.StateJson;
        attempt.RequestJson = SerializePayload(new
        {
            request.IdempotencyKey
        });

        var previousStatus = verification.Status;
        verification.MethodVersion = method.Options.Version;
        verification.ProviderKey = method.Options.Provider;
        verification.Status = start.Status;
        verification.FailureReason = null;
        verification.ExpiresAt = null;
        verification.LastAttemptId = attempt.Id;
        verification.StateJson = start.StateJson;
        verification.UpdatedAt = now;

        _db.VerificationAttempts.Add(attempt);
        _db.VerificationEvents.Add(CreateEvent(verification, attempt.Id, VerificationEventType.AttemptStarted, previousStatus, start.Status, "Attempt started", start.StateJson, now));

        if (previousStatus != start.Status)
        {
            _db.VerificationEvents.Add(CreateEvent(verification, attempt.Id, VerificationEventType.StatusChanged, previousStatus, start.Status, "Status updated", null, now));
        }

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var duplicateAttempt = await _db.VerificationAttempts
                .AsNoTracking()
                .FirstOrDefaultAsync(a =>
                    a.UserId == userId &&
                    a.MethodKey == method.Definition.Key &&
                    a.IdempotencyKey == idempotencyKey,
                    cancellationToken);

            if (duplicateAttempt == null)
            {
                throw;
            }

            return new StartVerificationAttemptResponse(
                duplicateAttempt.Id,
                method.Definition.Key,
                duplicateAttempt.Status.ToString().ToLowerInvariant(),
                null,
                verification.ExpiresAt
            );
        }

        return new StartVerificationAttemptResponse(
            attempt.Id,
            method.Definition.Key,
            attempt.Status.ToString().ToLowerInvariant(),
            start.ClientToken,
            verification.ExpiresAt
        );
    }

    public async Task<VerificationAttemptResponse> CompleteAttemptAsync(
        Guid userId,
        string methodKey,
        Guid attemptId,
        CompleteVerificationAttemptRequest request,
        CancellationToken cancellationToken = default)
    {
        var method = _registry.Get(methodKey);
        var now = DateTime.UtcNow;

        var verification = await EnsureVerificationAsync(userId, method, now, cancellationToken);
        var attempt = await _db.VerificationAttempts
            .FirstOrDefaultAsync(a =>
                a.Id == attemptId &&
                a.UserId == userId &&
                a.MethodKey == method.Definition.Key,
                cancellationToken)
            ?? throw new KeyNotFoundException("Verification attempt not found.");

        if (!method.Options.Enabled)
        {
            await MoveToDisabledAsync(verification, method, now, cancellationToken, attempt.Id);
            throw new InvalidOperationException("Verification method is disabled.");
        }

        if (attempt.CompletedAt.HasValue)
        {
            return new VerificationAttemptResponse(
                attempt.Id,
                method.Definition.Key,
                GetEffectiveStatus(verification, method.Options, now).ToString().ToLowerInvariant(),
                verification.FailureReason,
                verification.VerifiedAt,
                verification.ExpiresAt
            );
        }

        var completionContext = new VerificationCompletionContext(
            userId,
            verification,
            attempt,
            method.Options,
            new VerificationCompletionInput(
                request.Decision,
                request.ProviderToken,
                request.ProviderReference,
                request.DeclaredIntent,
                request.PhoneNumber,
                request.PartnerUserId,
                request.ConsentRecordedAt,
                request.SocialProvider,
                request.SocialAccountId,
                request.EventId,
                request.CheckInReference,
                request.VerifiedAtVenue),
            now);

        var providerResult = await method.Handler.CompleteAsync(completionContext, cancellationToken);
        var mappedResult = method.Handler.MapResult(providerResult, completionContext);

        var previousStatus = verification.Status;
        attempt.Status = mappedResult.Status;
        attempt.ProviderReference = providerResult.ProviderReference ?? attempt.ProviderReference;
        attempt.FailureReason = mappedResult.FailureReason;
        attempt.RequestJson = SerializePayload(request);
        attempt.ResultJson = providerResult.ResultJson;
        attempt.CompletedAt = now;

        verification.MethodVersion = method.Options.Version;
        verification.ProviderKey = method.Options.Provider;
        verification.Status = mappedResult.Status;
        verification.FailureReason = mappedResult.FailureReason;
        verification.VerifiedAt = mappedResult.VerifiedAt;
        verification.ExpiresAt = mappedResult.ExpiresAt;
        verification.LastAttemptId = attempt.Id;
        verification.StateJson = mappedResult.StateJson ?? providerResult.ResultJson;
        verification.UpdatedAt = now;

        _db.VerificationEvents.Add(CreateEvent(verification, attempt.Id, VerificationEventType.AttemptCompleted, previousStatus, mappedResult.Status, mappedResult.FailureReason ?? "Attempt completed", providerResult.ResultJson, now));

        if (previousStatus != mappedResult.Status)
        {
            _db.VerificationEvents.Add(CreateEvent(verification, attempt.Id, VerificationEventType.StatusChanged, previousStatus, mappedResult.Status, "Status updated", null, now));
        }

        await _db.SaveChangesAsync(cancellationToken);

        return new VerificationAttemptResponse(
            attempt.Id,
            method.Definition.Key,
            GetEffectiveStatus(verification, method.Options, now).ToString().ToLowerInvariant(),
            verification.FailureReason,
            verification.VerifiedAt,
            verification.ExpiresAt
        );
    }

    private async Task<UserVerification> EnsureVerificationAsync(
        Guid userId,
        RegisteredVerificationMethod method,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var verification = await _db.UserVerifications
            .FirstOrDefaultAsync(v => v.UserId == userId && v.MethodKey == method.Definition.Key, cancellationToken);

        if (verification != null)
        {
            verification.MethodVersion = method.Options.Version;
            verification.ProviderKey = method.Options.Provider;
            return verification;
        }

        verification = new UserVerification
        {
            UserId = userId,
            MethodKey = method.Definition.Key,
            MethodVersion = method.Options.Version,
            ProviderKey = method.Options.Provider,
            Status = method.Options.Enabled ? VerificationStatus.NotStarted : VerificationStatus.Disabled,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.UserVerifications.Add(verification);
        await _db.SaveChangesAsync(cancellationToken);
        return verification;
    }

    private async Task MoveToDisabledAsync(
        UserVerification verification,
        RegisteredVerificationMethod method,
        DateTime now,
        CancellationToken cancellationToken,
        Guid? attemptId = null)
    {
        if (verification.Status == VerificationStatus.Disabled)
        {
            return;
        }

        var previousStatus = verification.Status;
        verification.Status = VerificationStatus.Disabled;
        verification.UpdatedAt = now;
        verification.FailureReason = "Method is disabled.";

        _db.VerificationEvents.Add(CreateEvent(verification, attemptId, VerificationEventType.MethodDisabled, previousStatus, VerificationStatus.Disabled, "Method disabled", null, now));
        _db.VerificationEvents.Add(CreateEvent(verification, attemptId, VerificationEventType.StatusChanged, previousStatus, VerificationStatus.Disabled, "Status updated", null, now));
        await _db.SaveChangesAsync(cancellationToken);
    }

    private static VerificationStatus GetEffectiveStatus(UserVerification? verification, VerificationMethodOptions options, DateTime now)
    {
        if (!options.Enabled)
        {
            return VerificationStatus.Disabled;
        }

        if (verification == null)
        {
            return VerificationStatus.NotStarted;
        }

        if (verification.Status == VerificationStatus.Verified && verification.ExpiresAt.HasValue && verification.ExpiresAt <= now)
        {
            return VerificationStatus.Expired;
        }

        return verification.Status;
    }

    private static VerificationEvent CreateEvent(
        UserVerification verification,
        Guid? attemptId,
        VerificationEventType eventType,
        VerificationStatus? fromStatus,
        VerificationStatus? toStatus,
        string? message,
        string? dataJson,
        DateTime now)
    {
        return new VerificationEvent
        {
            UserId = verification.UserId,
            VerificationId = verification.Id,
            AttemptId = attemptId,
            MethodKey = verification.MethodKey,
            EventType = eventType,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            Message = message,
            DataJson = dataJson,
            CreatedAt = now
        };
    }

    public static string SerializePayload<T>(T value) => JsonSerializer.Serialize(value, JsonOptions);
}
