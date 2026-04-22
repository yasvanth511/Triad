namespace ThirdWheel.API;

/// <summary>Centralised application-wide constants. Keep business rules out of services.</summary>
public static class AppConstants
{
    // Auth
    public const int TokenExpiryDays = 7;

    // Profile
    public const int MaxPhotos = 3;
    public const int MaxImageWidthPx = 1200;

    // Discovery / Matching
    public const int MaxLikesPerDay = 50;

    // Anti-spam
    public const int SpamStrikesBeforeBan = 3;
    public const int RepeatedMessageThreshold = 3;
    public const int RepeatedMessageWindowMinutes = 5;
}
