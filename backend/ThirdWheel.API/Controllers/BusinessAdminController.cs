using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize(Policy = AppPolicies.Admin)]
[Route("api/admin/business")]
public class BusinessAdminController : BaseController
{
    private readonly BusinessAdminService _adminService;

    public BusinessAdminController(BusinessAdminService adminService)
    {
        _adminService = adminService;
    }

    // ── Partners ──────────────────────────────────────────────────────────────

    // GET /api/admin/business/partners
    [HttpGet("partners")]
    public async Task<ActionResult<List<AdminBusinessPartnerSummary>>> GetPendingPartners()
    {
        return Ok(await _adminService.GetPendingPartnersAsync());
    }

    // POST /api/admin/business/partners/{id}/approve
    [HttpPost("partners/{id:guid}/approve")]
    public async Task<IActionResult> ApprovePartner(Guid id, [FromBody] AdminReviewRequest req)
    {
        try
        {
            await _adminService.ApprovePartnerAsync(id, req, TryGetUserId());
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

    // POST /api/admin/business/partners/{id}/reject
    [HttpPost("partners/{id:guid}/reject")]
    public async Task<IActionResult> RejectPartner(Guid id, [FromBody] AdminReviewRequest req)
    {
        try
        {
            await _adminService.RejectPartnerAsync(id, req, TryGetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // POST /api/admin/business/partners/{id}/suspend
    [HttpPost("partners/{id:guid}/suspend")]
    public async Task<IActionResult> SuspendPartner(Guid id, [FromBody] AdminReviewRequest req)
    {
        try
        {
            await _adminService.SuspendPartnerAsync(id, req, TryGetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // ── Events ────────────────────────────────────────────────────────────────

    // GET /api/admin/business/events
    [HttpGet("events")]
    public async Task<ActionResult<List<AdminBusinessEventSummary>>> GetPendingEvents()
    {
        return Ok(await _adminService.GetPendingEventsAsync());
    }

    // POST /api/admin/business/events/{id}/approve
    [HttpPost("events/{id:guid}/approve")]
    public async Task<IActionResult> ApproveEvent(Guid id, [FromBody] AdminReviewRequest req)
    {
        try
        {
            await _adminService.ApproveEventAsync(id, req, TryGetUserId());
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

    // POST /api/admin/business/events/{id}/reject
    [HttpPost("events/{id:guid}/reject")]
    public async Task<IActionResult> RejectEvent(Guid id, [FromBody] AdminReviewRequest req)
    {
        try
        {
            await _adminService.RejectEventAsync(id, req, TryGetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // ── Offers ────────────────────────────────────────────────────────────────

    // GET /api/admin/business/offers
    [HttpGet("offers")]
    public async Task<ActionResult<List<AdminBusinessOfferSummary>>> GetPendingOffers()
    {
        return Ok(await _adminService.GetPendingOffersAsync());
    }

    // POST /api/admin/business/offers/{id}/approve
    [HttpPost("offers/{id:guid}/approve")]
    public async Task<IActionResult> ApproveOffer(Guid id, [FromBody] AdminReviewRequest req)
    {
        try
        {
            await _adminService.ApproveOfferAsync(id, req, TryGetUserId());
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

    // POST /api/admin/business/offers/{id}/reject
    [HttpPost("offers/{id:guid}/reject")]
    public async Task<IActionResult> RejectOffer(Guid id, [FromBody] AdminReviewRequest req)
    {
        try
        {
            await _adminService.RejectOfferAsync(id, req, TryGetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // ── Challenges ────────────────────────────────────────────────────────────

    // GET /api/admin/business/challenges
    [HttpGet("challenges")]
    public async Task<ActionResult<List<AdminChallengeSummary>>> GetPendingChallenges()
    {
        return Ok(await _adminService.GetPendingChallengesAsync());
    }

    // POST /api/admin/business/challenges/{id}/approve
    [HttpPost("challenges/{id:guid}/approve")]
    public async Task<IActionResult> ApproveChallenge(Guid id, [FromBody] AdminReviewRequest req)
    {
        try
        {
            await _adminService.ApproveChallengeAsync(id, req, TryGetUserId());
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

    // POST /api/admin/business/challenges/{id}/reject
    [HttpPost("challenges/{id:guid}/reject")]
    public async Task<IActionResult> RejectChallenge(Guid id, [FromBody] AdminReviewRequest req)
    {
        try
        {
            await _adminService.RejectChallengeAsync(id, req, TryGetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // POST /api/admin/business/challenges/{id}/suspend
    [HttpPost("challenges/{id:guid}/suspend")]
    public async Task<IActionResult> SuspendChallenge(Guid id, [FromBody] AdminReviewRequest req)
    {
        try
        {
            await _adminService.SuspendChallengeAsync(id, req, TryGetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // ── Audit ─────────────────────────────────────────────────────────────────

    // GET /api/admin/business/audit
    [HttpGet("audit")]
    public async Task<ActionResult<List<BusinessAuditLogItem>>> GetAuditLog(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        return Ok(await _adminService.GetAuditLogAsync(skip, take));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Guid? TryGetUserId()
    {
        try { return GetUserId(); }
        catch { return null; }
    }
}
