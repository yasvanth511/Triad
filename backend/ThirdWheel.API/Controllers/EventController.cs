using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class EventController : BaseController
{
    private readonly EventService _eventService;

    public EventController(EventService eventService)
    {
        _eventService = eventService;
    }

    // GET /api/event — upcoming events filtered by user's radius
    [HttpGet]
    public async Task<IActionResult> GetEvents([FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var userId = GetUserId();
        var events = await _eventService.GetEventsAsync(userId, skip, take);
        return Ok(events);
    }

    // POST /api/event/{eventId}/interest — toggle interested
    [HttpPost("{eventId:guid}/interest")]
    public async Task<IActionResult> ToggleInterest(Guid eventId)
    {
        var userId = GetUserId();
        try
        {
            var result = await _eventService.ToggleInterestAsync(userId, eventId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // POST /api/event — create event (admin/seed use only)
    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _eventService.CreateEventAsync(req);
        return Ok(result);
    }

    // DELETE /api/event/cleanup — remove duplicate-titled events (dev only)
    [HttpDelete("cleanup")]
    public async Task<IActionResult> CleanupDuplicates()
    {
        await _eventService.CleanupDuplicateEventsAsync();
        return Ok(new { message = "Duplicates removed." });
    }

    // DELETE /api/event/{id} — delete a specific event (dev only)
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        var deleted = await _eventService.DeleteEventAsync(id);
        return deleted ? Ok(new { message = "Deleted." }) : NotFound();
    }
}
