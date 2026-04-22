using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class UserInterest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required, MaxLength(50)]
    public string Tag { get; set; } = string.Empty;
}
