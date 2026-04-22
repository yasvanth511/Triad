namespace ThirdWheel.API.Models;

public class SpamWarning
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Reason { get; set; } = string.Empty;
    public int Level { get; set; } // 1=warn, 2=throttle, 3=block
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
