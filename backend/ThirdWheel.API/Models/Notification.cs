using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public enum NotificationType
{
    LikeReceived = 0,
    MatchCreated = 1,
    MessageReceived = 2,
    ImpressMeReceived = 3
}

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecipientId { get; set; }
    public Guid? ActorId { get; set; }

    [MaxLength(50)]
    public string? ActorName { get; set; }

    public string? ActorPhotoUrl { get; set; }
    public NotificationType Type { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string Body { get; set; } = string.Empty;

    public Guid? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
