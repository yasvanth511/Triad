using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class BusinessEventImage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BusinessEventId { get; set; }
    public BusinessEvent BusinessEvent { get; set; } = null!;

    [Required]
    public string Url { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
