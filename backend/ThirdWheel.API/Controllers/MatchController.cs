using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class MatchController : BaseController
{
    private readonly MatchingService _matchingService;

    public MatchController(MatchingService matchingService) => _matchingService = matchingService;

    [HttpPost("like")]
    public async Task<ActionResult> LikeUser([FromBody] LikeRequest req)
    {
        try
        {
            var match = await _matchingService.LikeUserAsync(GetUserId(), req.TargetUserId);
            if (match != null)
                return Ok(new { matched = true, match });
            return Ok(new { matched = false });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<MatchResponse>>> GetMatches()
    {
        var matches = await _matchingService.GetMatchesAsync(GetUserId());
        return Ok(matches);
    }

    [HttpDelete("{matchId}")]
    public async Task<IActionResult> Unmatch(Guid matchId)
    {
        try
        {
            await _matchingService.UnmatchAsync(GetUserId(), matchId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
