using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.DTOs;

public record VerificationMethodResponse(
    string Key,
    string DisplayName,
    string Status,
    bool IsEnabled,
    bool IsEligible,
    string? IneligibilityReason,
    string Version,
    string[] Capabilities,
    string? FailureReason,
    DateTime? VerifiedAt,
    DateTime? ExpiresAt,
    DateTime UpdatedAt
);

public record VerificationListResponse(IReadOnlyList<VerificationMethodResponse> Methods);

public record StartVerificationAttemptRequest(
    [MaxLength(100)] string? IdempotencyKey
);

public record StartVerificationAttemptResponse(
    Guid AttemptId,
    string MethodKey,
    string Status,
    string? ClientToken,
    DateTime? ExpiresAt
);

public record CompleteVerificationAttemptRequest(
    [MaxLength(50)] string? Decision,
    [MaxLength(512)] string? ProviderToken,
    [MaxLength(200)] string? ProviderReference,
    [MaxLength(100)] string? DeclaredIntent,
    [MaxLength(32)] string? PhoneNumber,
    [MaxLength(100)] string? PartnerUserId,
    DateTimeOffset? ConsentRecordedAt,
    [MaxLength(50)] string? SocialProvider,
    [MaxLength(200)] string? SocialAccountId,
    [MaxLength(100)] string? EventId,
    [MaxLength(200)] string? CheckInReference,
    bool? VerifiedAtVenue
);

public record VerificationAttemptResponse(
    Guid AttemptId,
    string MethodKey,
    string Status,
    string? FailureReason,
    DateTime? VerifiedAt,
    DateTime? ExpiresAt
);
