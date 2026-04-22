namespace ThirdWheel.API.Models;

public class Match
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid User1Id { get; set; }
    public Guid User2Id { get; set; }

    public Guid? Couple1Id { get; set; }
    public Guid? Couple2Id { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}
