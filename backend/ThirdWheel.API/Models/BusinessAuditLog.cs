using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public enum BusinessAuditAction
{
    PartnerApproved,
    PartnerRejected,
    PartnerSuspended,
    EventApproved,
    EventRejected,
    OfferApproved,
    OfferRejected,
    ChallengeApproved,
    ChallengeRejected,
    ChallengeSuspended
}

public class BusinessAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public BusinessAuditAction Action { get; set; }

    public Guid? AdminUserId { get; set; }

    public Guid? TargetPartnerId { get; set; }
    public Guid? TargetEventId { get; set; }
    public Guid? TargetOfferId { get; set; }
    public Guid? TargetChallengeId { get; set; }

    [MaxLength(AppConstants.MaxRejectionReasonLength)]
    public string? Reason { get; set; }

    [MaxLength(200)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
