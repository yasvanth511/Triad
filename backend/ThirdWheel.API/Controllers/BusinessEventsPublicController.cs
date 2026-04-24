using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Route("api/business-events")]
public class BusinessEventsPublicController : BaseController
{
    private readonly BusinessEventService _eventService;
    private readonly BusinessOfferService _offerService;
    private readonly BusinessChallengeService _challengeService;

    public BusinessEventsPublicController(
        BusinessEventService eventService,
        BusinessOfferService offerService,
        BusinessChallengeService challengeService)
    {
        _eventService = eventService;
        _offerService = offerService;
        _challengeService = challengeService;
    }

    // GET /api/business-events
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<BusinessEventResponse>>> GetEvents(
        [FromQuery] string? city,
        [FromQuery] string? category,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20)
    {
        var userId = base.TryGetUserId();
        return Ok(await _eventService.GetPublishedEventsAsync(userId, city, category, skip, take));
    }

    // GET /api/business-events/{id}
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<BusinessEventResponse>> GetEvent(Guid id)
    {
        try
        {
            var userId = base.TryGetUserId();
            return Ok(await _eventService.GetPublishedEventAsync(id, userId));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // POST /api/business-events/{id}/like
    [Authorize]
    [HttpPost("{id:guid}/like")]
    public async Task<IActionResult> ToggleLike(Guid id)
    {
        try
        {
            await _eventService.ToggleLikeAsync(GetUserId(), id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // POST /api/business-events/{id}/save
    [Authorize]
    [HttpPost("{id:guid}/save")]
    public async Task<IActionResult> ToggleSave(Guid id)
    {
        try
        {
            await _eventService.ToggleSaveAsync(GetUserId(), id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // POST /api/business-events/{id}/register
    [Authorize]
    [HttpPost("{id:guid}/register")]
    public async Task<IActionResult> Register(Guid id)
    {
        try
        {
            await _eventService.RegisterAsync(GetUserId(), id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET /api/business-events/{id}/offers
    [HttpGet("{id:guid}/offers")]
    [AllowAnonymous]
    public async Task<ActionResult<List<BusinessOfferResponse>>> GetOffers(Guid id)
    {
        try
        {
            var userId = base.TryGetUserId();
            return Ok(await _offerService.GetPublishedOffersAsync(id, userId));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // POST /api/business-events/{id}/offers/{offerId}/claim
    [Authorize]
    [HttpPost("{id:guid}/offers/{offerId:guid}/claim")]
    public async Task<ActionResult<ClaimCouponResponse>> ClaimCoupon(Guid id, Guid offerId)
    {
        try
        {
            return Ok(await _offerService.ClaimCouponAsync(GetUserId(), id, offerId));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET /api/business-events/{id}/challenge
    [HttpGet("{id:guid}/challenge")]
    [AllowAnonymous]
    public async Task<ActionResult<EventChallengeResponse>> GetChallenge(Guid id)
    {
        try
        {
            var userId = base.TryGetUserId();
            return Ok(await _challengeService.GetPublicChallengeAsync(id, userId));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // POST /api/business-events/{id}/challenge/respond
    [Authorize]
    [HttpPost("{id:guid}/challenge/respond")]
    public async Task<IActionResult> SubmitChallengeResponse(Guid id, [FromBody] SubmitChallengeResponseRequest req)
    {
        try
        {
            await _challengeService.SubmitResponseAsync(GetUserId(), id, req);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

}
