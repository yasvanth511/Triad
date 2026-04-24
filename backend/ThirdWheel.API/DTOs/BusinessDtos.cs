using System.ComponentModel.DataAnnotations;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.DTOs;

// ── Auth ─────────────────────────────────────────────────────────────────────

public record RegisterBusinessRequest(
    [Required, MaxLength(50)] string Username,
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(8), MaxLength(128)] string Password
);

public record BusinessCategoryResponse(
    Guid Id,
    string Key,
    string DisplayName,
    int SortOrder
);

// ── Business Partner ─────────────────────────────────────────────────────────

public record BusinessPartnerResponse(
    Guid Id,
    Guid UserId,
    string Username,
    string Email,
    BusinessVerificationStatus Status,
    string? RejectionReason,
    DateTime CreatedAt,
    BusinessProfileResponse? Profile
);

public record BusinessProfileResponse(
    Guid Id,
    string BusinessName,
    string Category,
    string Description,
    string? Website,
    string? LogoUrl,
    string? ContactEmail,
    string? ContactPhone,
    string? Address,
    string? City,
    string? State,
    DateTime UpdatedAt
);

public record UpsertBusinessProfileRequest(
    [Required, MaxLength(AppConstants.MaxBusinessNameLength)] string BusinessName,
    [Required, MaxLength(50)] string Category,
    [MaxLength(AppConstants.MaxBusinessDescriptionLength)] string? Description,
    [MaxLength(AppConstants.MaxBusinessWebsiteLength)] string? Website,
    [MaxLength(100)] string? ContactEmail,
    [MaxLength(30)] string? ContactPhone,
    [MaxLength(300)] string? Address,
    [MaxLength(100)] string? City,
    [MaxLength(100)] string? State
);

// ── Business Event ────────────────────────────────────────────────────────────

public record CreateBusinessEventRequest(
    [Required, MaxLength(AppConstants.MaxBusinessEventTitleLength)] string Title,
    [MaxLength(AppConstants.MaxBusinessEventDescriptionLength)] string? Description,
    [MaxLength(100)] string? Category,
    [MaxLength(300)] string? Location,
    [MaxLength(100)] string? City,
    [MaxLength(100)] string? State,
    double? Latitude,
    double? Longitude,
    DateTime? StartDate,
    DateTime? EndDate,
    int? Capacity,
    decimal? Price,
    [MaxLength(500)] string? ExternalTicketUrl
);

public record UpdateBusinessEventRequest(
    [MaxLength(AppConstants.MaxBusinessEventTitleLength)] string? Title,
    [MaxLength(AppConstants.MaxBusinessEventDescriptionLength)] string? Description,
    [MaxLength(100)] string? Category,
    [MaxLength(300)] string? Location,
    [MaxLength(100)] string? City,
    [MaxLength(100)] string? State,
    double? Latitude,
    double? Longitude,
    DateTime? StartDate,
    DateTime? EndDate,
    int? Capacity,
    decimal? Price,
    [MaxLength(500)] string? ExternalTicketUrl
);

public record BusinessEventImageResponse(Guid Id, string Url, int SortOrder);

public record BusinessEventResponse(
    Guid Id,
    Guid BusinessPartnerId,
    string BusinessName,
    string Title,
    string Description,
    string Category,
    string? Location,
    string? City,
    string? State,
    double? Latitude,
    double? Longitude,
    DateTime? StartDate,
    DateTime? EndDate,
    int? Capacity,
    decimal? Price,
    string? ExternalTicketUrl,
    BusinessEventStatus Status,
    string? RejectionReason,
    List<BusinessEventImageResponse> Images,
    int LikeCount,
    int SaveCount,
    int RegistrationCount,
    bool? IsLiked,
    bool? IsSaved,
    bool? IsRegistered,
    bool HasChallenge,
    bool HasOffer,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

// ── Business Offer ────────────────────────────────────────────────────────────

public record CreateBusinessOfferRequest(
    OfferType OfferType,
    [Required, MaxLength(AppConstants.MaxBusinessOfferTitleLength)] string Title,
    [MaxLength(AppConstants.MaxBusinessOfferDescriptionLength)] string? Description,
    [MaxLength(50)] string? CouponCode,
    int? ClaimLimit,
    DateTime? ExpiryDate,
    [MaxLength(1000)] string? RedemptionInstructions
);

public record UpdateBusinessOfferRequest(
    OfferType? OfferType,
    [MaxLength(AppConstants.MaxBusinessOfferTitleLength)] string? Title,
    [MaxLength(AppConstants.MaxBusinessOfferDescriptionLength)] string? Description,
    [MaxLength(50)] string? CouponCode,
    int? ClaimLimit,
    DateTime? ExpiryDate,
    [MaxLength(1000)] string? RedemptionInstructions
);

public record BusinessOfferResponse(
    Guid Id,
    Guid BusinessEventId,
    string EventTitle,
    OfferType OfferType,
    string Title,
    string? Description,
    string? CouponCode,
    int? ClaimLimit,
    DateTime? ExpiryDate,
    string? RedemptionInstructions,
    BusinessOfferStatus Status,
    string? RejectionReason,
    int ClaimCount,
    bool? IsClaimed,
    DateTime CreatedAt
);

// ── Event Challenge ───────────────────────────────────────────────────────────

public record CreateEventChallengeRequest(
    [Required, MaxLength(AppConstants.MaxBusinessChallengePromptLength)] string Prompt,
    RewardType RewardType,
    [MaxLength(500)] string? RewardDescription,
    int? MaxWinners,
    DateTime? ExpiryDate
);

public record UpdateEventChallengeRequest(
    [MaxLength(AppConstants.MaxBusinessChallengePromptLength)] string? Prompt,
    RewardType? RewardType,
    [MaxLength(500)] string? RewardDescription,
    int? MaxWinners,
    DateTime? ExpiryDate
);

public record EventChallengeResponse(
    Guid Id,
    Guid BusinessEventId,
    string EventTitle,
    string Prompt,
    RewardType RewardType,
    string? RewardDescription,
    int? MaxWinners,
    DateTime? ExpiryDate,
    ChallengeStatus Status,
    string? RejectionReason,
    int ResponseCount,
    int WinnerCount,
    bool? HasResponded,
    DateTime CreatedAt
);

// ── Challenge Response ────────────────────────────────────────────────────────

public record SubmitChallengeResponseRequest(
    [Required, MaxLength(AppConstants.MaxChallengeResponseLength)] string ResponseText
);

public record ChallengeResponseItem(
    Guid Id,
    Guid UserId,
    string Username,
    string ResponseText,
    ChallengeResponseStatus Status,
    DateTime SubmittedAt
);

public record MarkWinnerRequest(
    [MaxLength(500)] string? RewardCode,
    [MaxLength(500)] string? RewardNote
);

// ── User Engagement ───────────────────────────────────────────────────────────

public record ClaimCouponResponse(
    Guid ClaimId,
    string CouponCode,
    string? RedemptionInstructions,
    DateTime ClaimedAt
);

// ── Admin Review ──────────────────────────────────────────────────────────────

public record AdminReviewRequest(
    [MaxLength(AppConstants.MaxRejectionReasonLength)] string? Reason,
    [MaxLength(200)] string? Note
);

public record AdminBusinessPartnerSummary(
    Guid Id,
    Guid UserId,
    string Username,
    string Email,
    BusinessVerificationStatus Status,
    string? BusinessName,
    string? Category,
    DateTime CreatedAt
);

public record AdminBusinessEventSummary(
    Guid Id,
    Guid BusinessPartnerId,
    string BusinessName,
    string Title,
    string Category,
    BusinessEventStatus Status,
    DateTime? StartDate,
    DateTime CreatedAt
);

public record AdminBusinessOfferSummary(
    Guid Id,
    Guid BusinessEventId,
    string EventTitle,
    string BusinessName,
    OfferType OfferType,
    string Title,
    BusinessOfferStatus Status,
    DateTime CreatedAt
);

public record AdminChallengeSummary(
    Guid Id,
    Guid BusinessEventId,
    string EventTitle,
    string BusinessName,
    string Prompt,
    ChallengeStatus Status,
    DateTime CreatedAt
);

public record BusinessAuditLogItem(
    Guid Id,
    BusinessAuditAction Action,
    Guid? AdminUserId,
    Guid? TargetPartnerId,
    Guid? TargetEventId,
    Guid? TargetOfferId,
    Guid? TargetChallengeId,
    string? Reason,
    string? Note,
    DateTime CreatedAt
);

// ── Analytics ────────────────────────────────────────────────────────────────

public record BusinessAnalyticsResponse(
    int TotalEvents,
    int PublishedEvents,
    int TotalLikes,
    int TotalSaves,
    int TotalRegistrations,
    int TotalOffers,
    int TotalCouponClaims,
    int TotalChallenges,
    int TotalChallengeResponses,
    int TotalWinners,
    List<EventAnalyticsItem> EventBreakdown
);

public record EventAnalyticsItem(
    Guid EventId,
    string EventTitle,
    BusinessEventStatus Status,
    int Likes,
    int Saves,
    int Registrations,
    int ChallengeResponses,
    int Winners,
    int CouponClaims
);
