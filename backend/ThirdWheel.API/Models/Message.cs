using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid MatchId { get; set; }
    public Match Match { get; set; } = null!;

    public Guid SenderId { get; set; }

    [Required, MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; }

    public bool IsFlagged { get; set; }
}
