namespace ThirdWheel.API.Models;

public class Like
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // "from" can be a user or couple profile
    public Guid FromUserId { get; set; }
    public User FromUser { get; set; } = null!;

    public Guid ToUserId { get; set; }
    public User ToUser { get; set; } = null!;

    public Guid? FromCoupleId { get; set; }
    public Guid? ToCoupleId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
