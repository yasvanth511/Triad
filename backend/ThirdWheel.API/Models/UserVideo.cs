using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class UserVideo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    public string Url { get; set; } = string.Empty;

    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
