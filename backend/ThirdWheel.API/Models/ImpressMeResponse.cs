using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class ImpressMeResponse
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SignalId { get; set; }
    public ImpressMeSignal Signal { get; set; } = null!;

    [Required, MaxLength(1000)]
    public string TextContent { get; set; } = string.Empty;

    // Extensible for voice / photo / short-video in a future sprint
    [MaxLength(512)]
    public string? MediaUrl { get; set; }

    [MaxLength(20)]
    public string? MediaType { get; set; } // "audio" | "photo" | "video"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
