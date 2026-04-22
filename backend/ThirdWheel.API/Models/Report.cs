using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class Report
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ReporterUserId { get; set; }
    public User ReporterUser { get; set; } = null!;

    public Guid ReportedUserId { get; set; }

    [Required, MaxLength(50)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Details { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsResolved { get; set; }
}
