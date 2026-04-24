using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.Models;

public class BusinessCategory
{
    public Guid Id { get; set; }

    [Required, MaxLength(50)]
    public string Key { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;
}
