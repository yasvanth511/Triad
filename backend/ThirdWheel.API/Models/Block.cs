namespace ThirdWheel.API.Models;

public class Block
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BlockerUserId { get; set; }
    public User BlockerUser { get; set; } = null!;

    public Guid BlockedUserId { get; set; }
    public User BlockedUser { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
