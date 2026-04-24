using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public enum BusinessVerificationStatus
{
    Pending,
    Approved,
    Rejected,
    Suspended
}

public class BusinessPartner
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public BusinessVerificationStatus Status { get; set; } = BusinessVerificationStatus.Pending;

    [MaxLength(AppConstants.MaxRejectionReasonLength)]
    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public BusinessProfile? Profile { get; set; }
    public List<BusinessEvent> Events { get; set; } = new();
}
