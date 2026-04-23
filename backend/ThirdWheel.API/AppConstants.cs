namespace ThirdWheel.API;

/// <summary>Centralised application-wide constants. Keep business rules out of services.</summary>
public static class AppConstants
{
    // Auth
    public const int TokenExpiryDays = 7;

    // Profile
    public const int MaxPhotos = 5;
    public const int MaxVideos = 3;
    public const int MaxImageWidthPx = 1200;

    // Discovery / Matching
    public const int MaxLikesPerDay = 50;

    // Audio Bio
    public const int MaxAudioBioSizeMb = 10;
    public static readonly string[] AllowedAudioMimeTypes =
    [
        "audio/mpeg", "audio/mp4", "audio/mp4a-latm", "audio/aac",
        "audio/wav", "audio/x-wav", "audio/wave",
        "audio/x-m4a", "audio/m4a"
    ];

    // Video Bio
    public const int MaxVideoBioSizeMb = 50;
    public const int MaxVideoBioDurationSeconds = 60;
    public static readonly string[] AllowedVideoMimeTypes =
    [
        "video/mp4", "video/quicktime", "video/x-m4v",
        "video/mpeg", "video/webm"
    ];

    // Anti-spam
    public const int SpamStrikesBeforeBan = 3;
    public const int RepeatedMessageThreshold = 3;
    public const int RepeatedMessageWindowMinutes = 5;
}
