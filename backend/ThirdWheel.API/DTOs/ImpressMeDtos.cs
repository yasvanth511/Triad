using System.ComponentModel.DataAnnotations;

namespace ThirdWheel.API.DTOs;

// ── Requests ──────────────────────────────────────────────────────────────────

/// <summary>Sent by User A to open an Impress Me signal.</summary>
public record SendImpressMeRequest(
    [Required] Guid TargetUserId,
    Guid? MatchId              // null = pre-match, set = post-match
);

/// <summary>Sent by User B to reply to the generated prompt.</summary>
public record ImpressMeRespondRequest(
    [Required, MaxLength(1000)] string TextContent
);

// ── Responses ─────────────────────────────────────────────────────────────────

public record ImpressMePromptResponse(
    Guid Id,
    string Category,
    string PromptText,
    string? SenderContext
);

public record ImpressMeResponseResponse(
    Guid Id,
    string TextContent,
    string? MediaUrl,
    string? MediaType,
    DateTime CreatedAt
);

public record ImpressMeSignalResponse(
    Guid Id,
    Guid SenderId,
    string SenderUsername,
    string? SenderPhotoUrl,
    Guid ReceiverId,
    string ReceiverUsername,
    string? ReceiverPhotoUrl,
    Guid? MatchId,
    string Flow,           // "PreMatch" | "PostMatch"
    string Status,         // "Sent" | "Responded" | "Viewed" | "Accepted" | "Declined" | "Expired"
    ImpressMePromptResponse Prompt,
    ImpressMeResponseResponse? Response,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    DateTime? RespondedAt,
    DateTime? ViewedAt,
    DateTime? ResolvedAt
);

public record ImpressMeInboxResponse(
    List<ImpressMeSignalResponse> Received,
    List<ImpressMeSignalResponse> Sent,
    int UnreadCount
);

public record ImpressMeSummaryResponse(
    int ReceivedUnreadCount,
    int SentNeedsReviewCount
);
