using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class Event
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string BannerUrl { get; set; } = string.Empty;

    public DateTime EventDate { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(100)]
    public string State { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Venue { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public List<EventInterest> Interests { get; set; } = new();
}
