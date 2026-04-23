using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public enum VerificationStatus
{
    NotStarted = 0,
    Pending = 1,
    InReview = 2,
    Verified = 3,
    Failed = 4,
    Expired = 5,
    Disabled = 6
}

public enum VerificationEventType
{
    AttemptStarted = 0,
    AttemptCompleted = 1,
    StatusChanged = 2,
    MethodDisabled = 3
}

public class UserVerification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    [Required, MaxLength(100)]
    public string MethodKey { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string MethodVersion { get; set; } = "v1";

    [Required, MaxLength(100)]
    public string ProviderKey { get; set; } = string.Empty;

    public VerificationStatus Status { get; set; } = VerificationStatus.NotStarted;

    [MaxLength(250)]
    public string? FailureReason { get; set; }

    public DateTime? VerifiedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public Guid? LastAttemptId { get; set; }
    public string? StateJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class VerificationAttempt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid VerificationId { get; set; }

    [Required, MaxLength(100)]
    public string MethodKey { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string MethodVersion { get; set; } = "v1";

    [Required, MaxLength(100)]
    public string ProviderKey { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string IdempotencyKey { get; set; } = string.Empty;

    public VerificationStatus Status { get; set; } = VerificationStatus.Pending;

    [MaxLength(200)]
    public string? ProviderReference { get; set; }

    [MaxLength(250)]
    public string? FailureReason { get; set; }

    public string? RequestJson { get; set; }
    public string? ResultJson { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public class VerificationEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid VerificationId { get; set; }
    public Guid? AttemptId { get; set; }

    [Required, MaxLength(100)]
    public string MethodKey { get; set; } = string.Empty;

    public VerificationEventType EventType { get; set; }
    public VerificationStatus? FromStatus { get; set; }
    public VerificationStatus? ToStatus { get; set; }

    [MaxLength(250)]
    public string? Message { get; set; }

    public string? DataJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
