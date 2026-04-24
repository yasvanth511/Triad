using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public enum ChallengeResponseStatus
{
    Submitted,
    Winner,
    NotSelected
}

public class ChallengeResponse
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid EventChallengeId { get; set; }
    public EventChallenge EventChallenge { get; set; } = null!;

    [Required, MaxLength(AppConstants.MaxChallengeResponseLength)]
    public string ResponseText { get; set; } = string.Empty;

    public ChallengeResponseStatus Status { get; set; } = ChallengeResponseStatus.Submitted;

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
