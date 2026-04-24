using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public enum BusinessOfferStatus
{
    Draft,
    PendingApproval,
    Approved,
    Rejected,
    Active,
    Expired,
    Archived
}

public enum OfferType
{
    Coupon,
    Discount,
    FreeItem,
    Upgrade,
    Other
}

public class BusinessOffer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BusinessEventId { get; set; }
    public BusinessEvent BusinessEvent { get; set; } = null!;

    public OfferType OfferType { get; set; } = OfferType.Coupon;

    [Required, MaxLength(AppConstants.MaxBusinessOfferTitleLength)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(AppConstants.MaxBusinessOfferDescriptionLength)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? CouponCode { get; set; }

    public int? ClaimLimit { get; set; }

    public DateTime? ExpiryDate { get; set; }

    [MaxLength(1000)]
    public string? RedemptionInstructions { get; set; }

    public BusinessOfferStatus Status { get; set; } = BusinessOfferStatus.Draft;

    [MaxLength(AppConstants.MaxRejectionReasonLength)]
    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<CouponClaim> Claims { get; set; } = new();
}
