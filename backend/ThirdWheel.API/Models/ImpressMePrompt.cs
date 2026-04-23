using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class ImpressMePrompt
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SignalId { get; set; }
    public ImpressMeSignal Signal { get; set; } = null!;

    [Required, MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string PromptText { get; set; } = string.Empty;

    /// <summary>Personalised hint shown to the receiver, e.g. "Alex is really into hiking"</summary>
    [MaxLength(200)]
    public string? SenderContext { get; set; }
}
