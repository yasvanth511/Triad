namespace ThirdWheel.API.DTOs;

public record NotificationResponse(
    Guid Id,
    string Type,
    string Title,
    string Body,
    Guid? ReferenceId,
    Guid? ActorId,
    string? ActorName,
    string? ActorPhotoUrl,
    bool IsRead,
    DateTime CreatedAt
);

public record NotificationListResponse(
    List<NotificationResponse> Notifications,
    int UnreadCount
);
