using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class RewardClaim
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid EventChallengeId { get; set; }
    public EventChallenge EventChallenge { get; set; } = null!;

    public Guid ChallengeResponseId { get; set; }
    public ChallengeResponse ChallengeResponse { get; set; } = null!;

    [MaxLength(500)]
    public string? RewardCode { get; set; }

    [MaxLength(500)]
    public string? RewardNote { get; set; }

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
}
