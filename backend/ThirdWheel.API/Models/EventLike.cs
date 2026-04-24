namespace ThirdWheel.API.Models;

public class EventLike
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid BusinessEventId { get; set; }
    public BusinessEvent BusinessEvent { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
