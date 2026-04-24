using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public enum BusinessEventStatus
{
    Draft,
    PendingApproval,
    Approved,
    Rejected,
    Published,
    Cancelled,
    Archived
}

public class BusinessEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BusinessPartnerId { get; set; }
    public BusinessPartner BusinessPartner { get; set; } = null!;

    [Required, MaxLength(AppConstants.MaxBusinessEventTitleLength)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(AppConstants.MaxBusinessEventDescriptionLength)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Location { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? State { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public int? Capacity { get; set; }

    public decimal? Price { get; set; }

    [MaxLength(500)]
    public string? ExternalTicketUrl { get; set; }

    public BusinessEventStatus Status { get; set; } = BusinessEventStatus.Draft;

    [MaxLength(AppConstants.MaxRejectionReasonLength)]
    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<BusinessEventImage> Images { get; set; } = new();
    public List<BusinessOffer> Offers { get; set; } = new();
    public EventChallenge? Challenge { get; set; }
    public List<EventLike> Likes { get; set; } = new();
    public List<EventSave> Saves { get; set; } = new();
    public List<EventRegistration> Registrations { get; set; } = new();
}
