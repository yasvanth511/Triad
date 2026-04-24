namespace ThirdWheel.API.Models;

public class CouponClaim
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid BusinessOfferId { get; set; }
    public BusinessOffer BusinessOffer { get; set; } = null!;

    public DateTime ClaimedAt { get; set; } = DateTime.UtcNow;

    public bool IsRedeemed { get; set; }
    public DateTime? RedeemedAt { get; set; }
}
