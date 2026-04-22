using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class Couple
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(20)]
    public string InviteCode { get; set; } = string.Empty;

    public Guid CreatedByUserId { get; set; }

    public bool IsComplete { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public List<User> Members { get; set; } = new();
}
