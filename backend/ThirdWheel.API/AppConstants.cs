namespace ThirdWheel.API;

public static class AppRoles
{
    public const string User = "User";
    public const string BusinessPartner = "BusinessPartner";
    public const string Admin = "Admin";
}

public static class AppPolicies
{
    public const string BusinessPartner = "RequireBusinessPartner";
    public const string Admin = "RequireAdmin";
}

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

    // Business Partner
    public const int MaxBusinessEventImages = 8;
    public const int MaxBusinessEventTitleLength = 200;
    public const int MaxBusinessEventDescriptionLength = 2000;
    public const int MaxBusinessOfferTitleLength = 200;
    public const int MaxBusinessOfferDescriptionLength = 1000;
    public const int MaxBusinessChallengePromptLength = 500;
    public const int MaxChallengeResponseLength = 1000;
    public const int MaxBusinessNameLength = 200;
    public const int MaxBusinessDescriptionLength = 1000;
    public const int MaxBusinessWebsiteLength = 500;
    public const int MaxRejectionReasonLength = 500;
}
