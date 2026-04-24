using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public enum ChallengeStatus
{
    Draft,
    PendingApproval,
    Approved,
    Rejected,
    Active,
    Suspended,
    Closed,
    Archived
}

public enum RewardType
{
    Coupon,
    FreeEntry,
    Discount,
    Merchandise,
    Other
}

public class EventChallenge
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BusinessEventId { get; set; }
    public BusinessEvent BusinessEvent { get; set; } = null!;

    [Required, MaxLength(AppConstants.MaxBusinessChallengePromptLength)]
    public string Prompt { get; set; } = string.Empty;

    public RewardType RewardType { get; set; } = RewardType.Coupon;

    [MaxLength(500)]
    public string? RewardDescription { get; set; }

    public int? MaxWinners { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public ChallengeStatus Status { get; set; } = ChallengeStatus.Draft;

    [MaxLength(AppConstants.MaxRejectionReasonLength)]
    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<ChallengeResponse> Responses { get; set; } = new();
    public List<RewardClaim> RewardClaims { get; set; } = new();
}
