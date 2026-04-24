using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class BusinessProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BusinessPartnerId { get; set; }
    public BusinessPartner BusinessPartner { get; set; } = null!;

    [Required, MaxLength(AppConstants.MaxBusinessNameLength)]
    public string BusinessName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(AppConstants.MaxBusinessDescriptionLength)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(AppConstants.MaxBusinessWebsiteLength)]
    public string? Website { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(100)]
    public string? ContactEmail { get; set; }

    [MaxLength(30)]
    public string? ContactPhone { get; set; }

    [MaxLength(300)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? State { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
