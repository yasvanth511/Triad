using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize(Policy = AppPolicies.BusinessPartner)]
[Route("api/business")]
public class BusinessController : BaseController
{
    private readonly BusinessPartnerService _partnerService;
    private readonly BusinessEventService _eventService;
    private readonly BusinessOfferService _offerService;
    private readonly BusinessChallengeService _challengeService;
    private readonly BusinessAnalyticsService _analyticsService;
    private readonly ImageService _imageService;

    public BusinessController(
        BusinessPartnerService partnerService,
        BusinessEventService eventService,
        BusinessOfferService offerService,
        BusinessChallengeService challengeService,
        BusinessAnalyticsService analyticsService,
        ImageService imageService)
    {
        _partnerService = partnerService;
        _eventService = eventService;
        _offerService = offerService;
        _challengeService = challengeService;
        _analyticsService = analyticsService;
        _imageService = imageService;
    }

    // ── Partner Profile ───────────────────────────────────────────────────────

    [AllowAnonymous]
    [HttpGet("categories")]
    public async Task<ActionResult<List<BusinessCategoryResponse>>> GetCategories()
    {
        return Ok(await _partnerService.GetCategoriesAsync());
    }

    // GET /api/business/me
    [HttpGet("me")]
    public async Task<ActionResult<BusinessPartnerResponse>> GetMe()
    {
        try
        {
            return Ok(await _partnerService.GetPartnerByUserIdAsync(GetUserId()));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Business account not found. Please complete onboarding." });
        }
    }

    // POST /api/business/onboard
    [HttpPost("onboard")]
    public async Task<ActionResult<BusinessPartnerResponse>> Onboard()
    {
        try
        {
            return Ok(await _partnerService.InitializePartnerAsync(GetUserId()));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET /api/business/profile
    [HttpGet("profile")]
    public async Task<ActionResult<BusinessProfileResponse>> GetProfile()
    {
        try
        {
            var partner = await _partnerService.GetPartnerByUserIdAsync(GetUserId());
            if (partner.Profile is null)
                return NotFound(new { error = "Profile not set up yet." });
            return Ok(partner.Profile);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Business account not found." });
        }
    }

    // PUT /api/business/profile
    [HttpPut("profile")]
    public async Task<ActionResult<BusinessProfileResponse>> UpsertProfile([FromBody] UpsertBusinessProfileRequest req)
    {
        try
        {
            return Ok(await _partnerService.UpsertProfileAsync(GetUserId(), req));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // POST /api/business/profile/logo
    [HttpPost("profile/logo")]
    public async Task<IActionResult> UploadLogo(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        string? url = null;
        try
        {
            url = await _imageService.SavePhotoAsync(file.OpenReadStream(), file.FileName);
            var old = await _partnerService.SetLogoAsync(GetUserId(), url);
            if (old is not null)
                _imageService.DeletePhoto(old);
            return Ok(new { url });
        }
        catch (KeyNotFoundException ex)
        {
            if (url is not null) _imageService.DeletePhoto(url);
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            if (url is not null) _imageService.DeletePhoto(url);
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── Events ────────────────────────────────────────────────────────────────

    private async Task<Guid> GetPartnerIdAsync() =>
        await _partnerService.GetPartnerIdAsync(GetUserId());

    // GET /api/business/events
    [HttpGet("events")]
    public async Task<ActionResult<List<BusinessEventResponse>>> GetEvents()
    {
        try
        {
            return Ok(await _eventService.GetMyEventsAsync(await GetPartnerIdAsync()));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    // GET /api/business/events/{id}
    [HttpGet("events/{id:guid}")]
    public async Task<ActionResult<BusinessEventResponse>> GetEvent(Guid id)
    {
        try
        {
            return Ok(await _eventService.GetMyEventAsync(await GetPartnerIdAsync(), id));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // POST /api/business/events
    [HttpPost("events")]
    public async Task<ActionResult<BusinessEventResponse>> CreateEvent([FromBody] CreateBusinessEventRequest req)
    {
        try
        {
            var result = await _eventService.CreateAsync(await GetPartnerIdAsync(), req);
            return CreatedAtAction(nameof(GetEvent), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // PUT /api/business/events/{id}
    [HttpPut("events/{id:guid}")]
    public async Task<ActionResult<BusinessEventResponse>> UpdateEvent(Guid id, [FromBody] UpdateBusinessEventRequest req)
    {
        try
        {
            return Ok(await _eventService.UpdateAsync(await GetPartnerIdAsync(), id, req));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // POST /api/business/events/{id}/submit
    [HttpPost("events/{id:guid}/submit")]
    public async Task<IActionResult> SubmitEventForApproval(Guid id)
    {
        try
        {
            await _eventService.SubmitForApprovalAsync(await GetPartnerIdAsync(), id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // DELETE /api/business/events/{id}
    [HttpDelete("events/{id:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        try
        {
            await _eventService.DeleteAsync(await GetPartnerIdAsync(), id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // POST /api/business/events/{id}/images
    [HttpPost("events/{id:guid}/images")]
    public async Task<ActionResult<BusinessEventImageResponse>> UploadEventImage(Guid id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        string? url = null;
        try
        {
            url = await _imageService.SavePhotoAsync(file.OpenReadStream(), file.FileName);
            var result = await _eventService.AddImageAsync(await GetPartnerIdAsync(), id, url);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            if (url is not null) _imageService.DeletePhoto(url);
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            if (url is not null) _imageService.DeletePhoto(url);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            if (url is not null) _imageService.DeletePhoto(url);
            return BadRequest(new { error = ex.Message });
        }
    }

    // DELETE /api/business/events/{eventId}/images/{imageId}
    [HttpDelete("events/{eventId:guid}/images/{imageId:guid}")]
    public async Task<IActionResult> DeleteEventImage(Guid eventId, Guid imageId)
    {
        try
        {
            var url = await _eventService.DeleteImageAsync(await GetPartnerIdAsync(), eventId, imageId);
            _imageService.DeletePhoto(url);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // ── Offers ────────────────────────────────────────────────────────────────

    // GET /api/business/offers
    [HttpGet("offers")]
    public async Task<ActionResult<List<BusinessOfferResponse>>> GetOffers([FromQuery] Guid? eventId)
    {
        try
        {
            return Ok(await _offerService.GetMyOffersAsync(await GetPartnerIdAsync(), eventId));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    // GET /api/business/offers/{id}
    [HttpGet("offers/{id:guid}")]
    public async Task<ActionResult<BusinessOfferResponse>> GetOffer(Guid id)
    {
        try
        {
            return Ok(await _offerService.GetMyOfferAsync(await GetPartnerIdAsync(), id));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // POST /api/business/events/{eventId}/offers
    [HttpPost("events/{eventId:guid}/offers")]
    public async Task<ActionResult<BusinessOfferResponse>> CreateOffer(Guid eventId, [FromBody] CreateBusinessOfferRequest req)
    {
        try
        {
            var result = await _offerService.CreateAsync(await GetPartnerIdAsync(), eventId, req);
            return CreatedAtAction(nameof(GetOffer), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // PUT /api/business/offers/{id}
    [HttpPut("offers/{id:guid}")]
    public async Task<ActionResult<BusinessOfferResponse>> UpdateOffer(Guid id, [FromBody] UpdateBusinessOfferRequest req)
    {
        try
        {
            return Ok(await _offerService.UpdateAsync(await GetPartnerIdAsync(), id, req));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // POST /api/business/offers/{id}/submit
    [HttpPost("offers/{id:guid}/submit")]
    public async Task<IActionResult> SubmitOfferForApproval(Guid id)
    {
        try
        {
            await _offerService.SubmitForApprovalAsync(await GetPartnerIdAsync(), id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // DELETE /api/business/offers/{id}
    [HttpDelete("offers/{id:guid}")]
    public async Task<IActionResult> DeleteOffer(Guid id)
    {
        try
        {
            await _offerService.DeleteAsync(await GetPartnerIdAsync(), id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── Challenges ────────────────────────────────────────────────────────────

    // GET /api/business/events/{eventId}/challenge
    [HttpGet("events/{eventId:guid}/challenge")]
    public async Task<ActionResult<EventChallengeResponse>> GetChallenge(Guid eventId)
    {
        try
        {
            return Ok(await _challengeService.GetChallengeAsync(await GetPartnerIdAsync(), eventId));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // POST /api/business/events/{eventId}/challenge
    [HttpPost("events/{eventId:guid}/challenge")]
    public async Task<ActionResult<EventChallengeResponse>> CreateChallenge(Guid eventId, [FromBody] CreateEventChallengeRequest req)
    {
        try
        {
            return Ok(await _challengeService.CreateChallengeAsync(await GetPartnerIdAsync(), eventId, req));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // PUT /api/business/challenges/{id}
    [HttpPut("challenges/{id:guid}")]
    public async Task<ActionResult<EventChallengeResponse>> UpdateChallenge(Guid id, [FromBody] UpdateEventChallengeRequest req)
    {
        try
        {
            return Ok(await _challengeService.UpdateChallengeAsync(await GetPartnerIdAsync(), id, req));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // POST /api/business/challenges/{id}/submit
    [HttpPost("challenges/{id:guid}/submit")]
    public async Task<IActionResult> SubmitChallengeForApproval(Guid id)
    {
        try
        {
            await _challengeService.SubmitChallengeForApprovalAsync(await GetPartnerIdAsync(), id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // DELETE /api/business/challenges/{id}
    [HttpDelete("challenges/{id:guid}")]
    public async Task<IActionResult> DeleteChallenge(Guid id)
    {
        try
        {
            await _challengeService.DeleteChallengeAsync(await GetPartnerIdAsync(), id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET /api/business/challenges/{id}/responses
    [HttpGet("challenges/{id:guid}/responses")]
    public async Task<ActionResult<List<ChallengeResponseItem>>> GetChallengeResponses(Guid id)
    {
        try
        {
            return Ok(await _challengeService.GetResponsesAsync(await GetPartnerIdAsync(), id));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // POST /api/business/challenges/{id}/responses/{responseId}/win
    [HttpPost("challenges/{id:guid}/responses/{responseId:guid}/win")]
    public async Task<IActionResult> MarkWinner(Guid id, Guid responseId, [FromBody] MarkWinnerRequest req)
    {
        try
        {
            await _challengeService.MarkWinnerAsync(await GetPartnerIdAsync(), id, responseId, req);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    // GET /api/business/analytics
    [HttpGet("analytics")]
    public async Task<ActionResult<BusinessAnalyticsResponse>> GetAnalytics()
    {
        try
        {
            return Ok(await _analyticsService.GetAnalyticsAsync(await GetPartnerIdAsync()));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
