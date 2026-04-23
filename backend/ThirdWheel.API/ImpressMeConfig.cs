namespace ThirdWheel.API;

/// <summary>
/// Feature toggles and limits for "Impress Me".
/// Wire to IConfiguration to let product change values without a redeploy.
/// </summary>
public static class ImpressMeConfig
{
    /// <summary>Hours before an unanswered signal expires.</summary>
    public static int ExpiryHours { get; } = 48;

    /// <summary>Signals a user may send per calendar day.</summary>
    public static int DailyQuotaPerUser { get; } = 5;

    /// <summary>Maximum concurrent outbound signals per user.</summary>
    public static int MaxActiveOutbound { get; } = 10;

    /// <summary>Gate the feature behind a premium plan. Toggle without code change.</summary>
    public static bool RequiresPremium { get; } = false;

    /// <summary>Maximum characters allowed in a response.</summary>
    public static int MaxResponseCharacters { get; } = 1000;

    /// <summary>
    /// When a pre-match signal is accepted, automatically create the match record
    /// if one doesn't already exist.
    /// </summary>
    public static bool AutoCreateMatchOnAccept { get; } = true;
}
