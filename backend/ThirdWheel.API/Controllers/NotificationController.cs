using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
[Route("api/notifications")]
public class NotificationController : BaseController
{
    private readonly NotificationService _notifications;

    public NotificationController(NotificationService notifications)
        => _notifications = notifications;

    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        var result = await _notifications.GetNotificationsAsync(GetUserId(), skip, Math.Min(take, 100));
        return Ok(result);
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        await _notifications.MarkReadAsync(GetUserId(), id);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _notifications.MarkAllReadAsync(GetUserId());
        return NoContent();
    }
}
