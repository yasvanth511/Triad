using Microsoft.Extensions.Options;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services.Verification;

public sealed class VerificationOptions
{
    public Dictionary<string, VerificationMethodOptions> Methods { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class VerificationMethodOptions
{
    public bool Enabled { get; set; } = true;
    public string DisplayName { get; set; } = string.Empty;
    public string Version { get; set; } = "v1";
    public string Provider { get; set; } = "default";
    public int? ExpiresAfterDays { get; set; }
    public Dictionary<string, string> Settings { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed record VerificationMethodDefinition(
    string Key,
    string DisplayName,
    string[] Capabilities
);

public sealed record RegisteredVerificationMethod(
    VerificationMethodDefinition Definition,
    VerificationMethodOptions Options,
    IVerificationMethod Handler
);

public sealed record VerificationEligibilityResult(
    bool IsEligible,
    string? Reason = null
);

public sealed record VerificationStartResult(
    VerificationStatus Status,
    string? ProviderReference = null,
    string? ClientToken = null,
    string? StateJson = null,
    DateTime? ExpiresAt = null
);

public sealed record VerificationProviderResult(
    string Decision,
    string? ProviderReference = null,
    string? FailureReason = null,
    string? ResultJson = null
);

public sealed record VerificationMethodResult(
    VerificationStatus Status,
    string? FailureReason = null,
    DateTime? VerifiedAt = null,
    DateTime? ExpiresAt = null,
    string? StateJson = null
);

public sealed record VerificationEligibilityContext(
    Guid UserId
);

public sealed record VerificationStartContext(
    Guid UserId,
    UserVerification Verification,
    VerificationAttempt Attempt,
    VerificationMethodOptions Options,
    DateTime NowUtc
);

public sealed record VerificationCompletionInput(
    string? Decision,
    string? ProviderToken,
    string? ProviderReference,
    string? DeclaredIntent,
    string? PhoneNumber,
    string? PartnerUserId,
    DateTimeOffset? ConsentRecordedAt,
    string? SocialProvider,
    string? SocialAccountId,
    string? EventId,
    string? CheckInReference,
    bool? VerifiedAtVenue
);

public sealed record VerificationCompletionContext(
    Guid UserId,
    UserVerification Verification,
    VerificationAttempt Attempt,
    VerificationMethodOptions Options,
    VerificationCompletionInput Input,
    DateTime NowUtc
);

public interface IVerificationMethod
{
    VerificationMethodDefinition Definition { get; }
    Task<VerificationEligibilityResult> EvaluateEligibilityAsync(VerificationEligibilityContext context, CancellationToken cancellationToken = default);
    Task<VerificationStartResult> StartAsync(VerificationStartContext context, CancellationToken cancellationToken = default);
    Task<VerificationProviderResult> CompleteAsync(VerificationCompletionContext context, CancellationToken cancellationToken = default);
    VerificationMethodResult MapResult(VerificationProviderResult providerResult, VerificationCompletionContext context);
}

public sealed class VerificationRegistry
{
    private readonly IReadOnlyDictionary<string, RegisteredVerificationMethod> _methods;

    public VerificationRegistry(IEnumerable<IVerificationMethod> handlers, IOptions<VerificationOptions> options)
    {
        var handlersByKey = handlers.ToDictionary(h => h.Definition.Key, StringComparer.OrdinalIgnoreCase);
        var registered = new Dictionary<string, RegisteredVerificationMethod>(StringComparer.OrdinalIgnoreCase);

        foreach (var (key, methodOptions) in options.Value.Methods)
        {
            if (!handlersByKey.TryGetValue(key, out var handler))
            {
                throw new InvalidOperationException($"Verification method '{key}' is configured but no handler is registered.");
            }

            registered[key] = new RegisteredVerificationMethod(
                handler.Definition with
                {
                    DisplayName = string.IsNullOrWhiteSpace(methodOptions.DisplayName)
                        ? handler.Definition.DisplayName
                        : methodOptions.DisplayName
                },
                methodOptions,
                handler);
        }

        _methods = registered;
    }

    public IReadOnlyCollection<RegisteredVerificationMethod> List() => _methods.Values.OrderBy(m => m.Definition.DisplayName).ToArray();

    public RegisteredVerificationMethod Get(string methodKey)
    {
        if (_methods.TryGetValue(methodKey, out var method))
        {
            return method;
        }

        throw new KeyNotFoundException($"Verification method '{methodKey}' is not registered.");
    }
}
