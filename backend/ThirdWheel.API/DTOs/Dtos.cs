using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.DTOs;

// Auth
public record RegisterRequest(
    [Required, MaxLength(50)] string Username,
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(8), MaxLength(128)] string Password
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(string Token, UserProfileResponse User);

// Profile
public record UpdateProfileRequest(
    [MaxLength(500)] string? Bio,
    int? AgeMin,
    int? AgeMax,
    [MaxLength(50)] string? Intent,
    [MaxLength(20)] string? LookingFor,
    List<string>? Interests,
    double? Latitude,
    double? Longitude,
    [MaxLength(100)] string? City,
    [MaxLength(100)] string? State,
    [MaxLength(10)] string? ZipCode,
    int? RadiusMiles
);

public record UserProfileResponse(
    Guid Id,
    string Username,
    string Bio,
    int AgeMin,
    int AgeMax,
    string Intent,
    string LookingFor,
    List<string> Interests,
    List<PhotoResponse> Photos,
    Guid? CoupleId,
    bool IsCouple,
    string City,
    string State,
    string ZipCode,
    int? RadiusMiles,
    string? CouplePartnerName
);

public record PhotoResponse(Guid Id, string Url, int SortOrder);

// Couple
public record CreateCoupleResponse(Guid CoupleId, string InviteCode);
public record JoinCoupleRequest([Required, MaxLength(20)] string InviteCode);

// Discovery
public record DiscoveryCardResponse(
    Guid UserId,
    string Username,
    string Bio,
    int AgeMin,
    int AgeMax,
    string Intent,
    string LookingFor,
    List<string> Interests,
    List<PhotoResponse> Photos,
    bool IsCouple,
    double? ApproximateDistanceKm,
    string City,
    string State
);

public record DiscoveryFilterRequest(
    string? UserType, // "single" | "couple"
    double? MaxDistanceKm,
    int Skip = 0,
    int Take = 20
);

// Saved Profiles
public record SaveProfileRequest(Guid TargetUserId);

public record SavedProfileResponse(
    Guid UserId,
    string Username,
    string Bio,
    int AgeMin,
    int AgeMax,
    string Intent,
    string LookingFor,
    List<string> Interests,
    List<PhotoResponse> Photos,
    bool IsCouple,
    double? ApproximateDistanceKm,
    string City,
    string State,
    DateTime SavedAt
);

// Like / Match
public record LikeRequest(Guid TargetUserId);

public record ParticipantResponse(
    Guid UserId,
    string Username,
    string Bio,
    List<PhotoResponse> Photos,
    bool IsCouple,
    Guid? CoupleId
);

public record MatchResponse(
    Guid MatchId,
    List<ParticipantResponse> Participants,
    DateTime MatchedAt,
    bool IsGroupChat
);

// Messaging
public record SendMessageRequest([Required, MaxLength(2000)] string Content);
public record MessageResponse(Guid Id, Guid SenderId, string SenderUsername, string? SenderPhotoUrl, string Content, DateTime SentAt, bool IsRead);

// Safety
public record BlockRequest(Guid UserId);
public record ReportRequest(Guid UserId, [Required, MaxLength(50)] string Reason, [MaxLength(500)] string? Details);

// Events
public record EventResponse(
    Guid Id,
    string Title,
    string Description,
    string BannerUrl,
    DateTime EventDate,
    string City,
    string State,
    string Venue,
    double? Latitude,
    double? Longitude,
    double? DistanceKm,
    int InterestedCount,
    bool IsInterested
);

public record EventInterestToggleResponse(bool IsInterested, int InterestedCount);

public record CreateEventRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(1000)] string Description,
    [Required, MaxLength(500)] string BannerUrl,
    DateTime EventDate,
    double? Latitude,
    double? Longitude,
    [MaxLength(100)] string? City,
    [MaxLength(100)] string? State,
    [MaxLength(200)] string? Venue
);
