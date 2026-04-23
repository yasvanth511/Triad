using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Bio { get; set; } = string.Empty;

    [MaxLength(512)]
    public string? AudioBioUrl { get; set; }

    [MaxLength(512)]
    public string? VideoBioUrl { get; set; }

    public int AgeMin { get; set; }
    public int AgeMax { get; set; }

    [MaxLength(50)]
    public string Intent { get; set; } = string.Empty;

    [MaxLength(20)]
    public string LookingFor { get; set; } = string.Empty; // "single" | "couple"

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(100)]
    public string State { get; set; } = string.Empty;

    [MaxLength(10)]
    public string ZipCode { get; set; } = string.Empty;

    public int? RadiusMiles { get; set; }

    // Dating Preferences
    [MaxLength(100)]
    public string? InterestedIn { get; set; }

    [MaxLength(150)]
    public string? Neighborhood { get; set; }

    [MaxLength(100)]
    public string? Ethnicity { get; set; }

    [MaxLength(100)]
    public string? Religion { get; set; }

    [MaxLength(100)]
    public string? RelationshipType { get; set; }

    [MaxLength(20)]
    public string? Height { get; set; }

    [MaxLength(100)]
    public string? Children { get; set; }

    [MaxLength(100)]
    public string? FamilyPlans { get; set; }

    [MaxLength(100)]
    public string? Drugs { get; set; }

    [MaxLength(100)]
    public string? Smoking { get; set; }

    [MaxLength(100)]
    public string? Marijuana { get; set; }

    [MaxLength(100)]
    public string? Drinking { get; set; }

    [MaxLength(100)]
    public string? Politics { get; set; }

    [MaxLength(100)]
    public string? EducationLevel { get; set; }

    [MaxLength(20)]
    public string? Weight { get; set; }

    [MaxLength(100)]
    public string? Physique { get; set; }

    [MaxLength(100)]
    public string? SexualPreference { get; set; }

    [MaxLength(100)]
    public string? ComfortWithIntimacy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsBanned { get; set; }

    // Navigation
    public List<UserPhoto> Photos { get; set; } = new();
    public List<UserVideo> Videos { get; set; } = new();
    public List<UserInterest> Interests { get; set; } = new();
    public List<UserRedFlag> RedFlags { get; set; } = new();
    public Guid? CoupleId { get; set; }
    public Couple? Couple { get; set; }
    public List<Like> LikesSent { get; set; } = new();
    public List<Like> LikesReceived { get; set; } = new();
    public List<Block> BlocksSent { get; set; } = new();
    public List<Block> BlocksReceived { get; set; } = new();
    public List<Report> ReportsSent { get; set; } = new();
}
