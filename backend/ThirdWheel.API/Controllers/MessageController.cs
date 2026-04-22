using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class MessageController : BaseController
{
    private readonly MessagingService _messagingService;

    public MessageController(MessagingService messagingService) => _messagingService = messagingService;

    [HttpPost("{matchId}")]
    public async Task<ActionResult<MessageResponse>> SendMessage(Guid matchId, [FromBody] SendMessageRequest req)
    {
        try
        {
            var message = await _messagingService.SendMessageAsync(GetUserId(), matchId, req.Content);
            return Ok(message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{matchId}")]
    public async Task<ActionResult<List<MessageResponse>>> GetMessages(
        Guid matchId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        try
        {
            take = Math.Clamp(take, 1, 100);
            var messages = await _messagingService.GetMessagesAsync(GetUserId(), matchId, skip, take);
            return Ok(messages);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
