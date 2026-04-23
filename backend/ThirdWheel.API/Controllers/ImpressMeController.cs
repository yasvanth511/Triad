using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
[Route("api/impress-me")]
public class ImpressMeController : BaseController
{
    private readonly ImpressMeService _service;

    public ImpressMeController(ImpressMeService service)
        => _service = service;

    /// <summary>Send an Impress Me signal to another user (pre- or post-match).</summary>
    [HttpPost]
    public async Task<ActionResult<ImpressMeSignalResponse>> Send([FromBody] SendImpressMeRequest req)
    {
        try
        {
            var result = await _service.SendAsync(GetUserId(), req);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException)         { return NotFound(); }
    }

    /// <summary>Get inbox (received + sent) for the current user.</summary>
    [HttpGet("inbox")]
    public async Task<ActionResult<ImpressMeInboxResponse>> GetInbox()
        => Ok(await _service.GetInboxAsync(GetUserId()));

    /// <summary>Get badge-style summary counts for the current user.</summary>
    [HttpGet("summary")]
    public async Task<ActionResult<ImpressMeSummaryResponse>> GetSummary()
        => Ok(await _service.GetSummaryAsync(GetUserId()));

    /// <summary>Get a single signal by ID (marks received signal as viewed).</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ImpressMeSignalResponse>> Get(Guid id)
    {
        try   { return Ok(await _service.GetAsync(GetUserId(), id)); }
        catch (KeyNotFoundException)          { return NotFound(); }
        catch (UnauthorizedAccessException)   { return Forbid(); }
    }

    /// <summary>Receiver submits a text response to the prompt.</summary>
    [HttpPost("{id:guid}/respond")]
    public async Task<ActionResult<ImpressMeSignalResponse>> Respond(
        Guid id, [FromBody] ImpressMeRespondRequest req)
    {
        try
        {
            var result = await _service.RespondAsync(GetUserId(), id, req);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException)          { return NotFound(); }
        catch (UnauthorizedAccessException)   { return Forbid(); }
    }

    /// <summary>Sender marks the response as reviewed (transitions Responded → Viewed).</summary>
    [HttpPost("{id:guid}/review")]
    public async Task<ActionResult<ImpressMeSignalResponse>> Review(Guid id)
    {
        try
        {
            var result = await _service.ReviewAsync(GetUserId(), id);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException)          { return NotFound(); }
        catch (UnauthorizedAccessException)   { return Forbid(); }
    }

    /// <summary>Sender accepts the response — creates a match for pre-match flow.</summary>
    [HttpPost("{id:guid}/accept")]
    public async Task<ActionResult<ImpressMeSignalResponse>> Accept(Guid id)
    {
        try
        {
            var result = await _service.AcceptAsync(GetUserId(), id);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException)          { return NotFound(); }
        catch (UnauthorizedAccessException)   { return Forbid(); }
    }

    /// <summary>Sender declines the response.</summary>
    [HttpPost("{id:guid}/decline")]
    public async Task<ActionResult<ImpressMeSignalResponse>> Decline(Guid id)
    {
        try
        {
            var result = await _service.DeclineAsync(GetUserId(), id);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException)          { return NotFound(); }
        catch (UnauthorizedAccessException)   { return Forbid(); }
    }
}
