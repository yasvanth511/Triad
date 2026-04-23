namespace ThirdWheel.API.Models;

public enum ImpressMeStatus
{
    Sent = 0,
    Responded = 1,
    Viewed = 2,
    Accepted = 3,
    Declined = 4,
    Expired = 5
}

public enum ImpressMeFlow
{
    PreMatch = 0,
    PostMatch = 1
}

public class ImpressMeSignal
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SenderId { get; set; }
    public User Sender { get; set; } = null!;

    public Guid ReceiverId { get; set; }
    public User Receiver { get; set; } = null!;

    /// <summary>null = pre-match flow; set = post-match flow</summary>
    public Guid? MatchId { get; set; }

    public ImpressMeFlow Flow { get; set; } = ImpressMeFlow.PreMatch;
    public ImpressMeStatus Status { get; set; } = ImpressMeStatus.Sent;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime? ViewedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }

    // Navigation
    public ImpressMePrompt Prompt { get; set; } = null!;
    public ImpressMeResponse? Response { get; set; }
}
