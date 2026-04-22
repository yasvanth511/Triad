using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class SafetyController : BaseController
{
    private readonly SafetyService _safetyService;

    public SafetyController(SafetyService safetyService) => _safetyService = safetyService;

    [HttpPost("block")]
    public async Task<IActionResult> BlockUser([FromBody] BlockRequest req)
    {
        try
        {
            await _safetyService.BlockUserAsync(GetUserId(), req.UserId);
            return Ok(new { message = "User blocked." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("block/{userId}")]
    public async Task<IActionResult> UnblockUser(Guid userId)
    {
        try
        {
            await _safetyService.UnblockUserAsync(GetUserId(), userId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("report")]
    public async Task<IActionResult> ReportUser([FromBody] ReportRequest req)
    {
        try
        {
            await _safetyService.ReportUserAsync(GetUserId(), req);
            return Ok(new { message = "Report submitted." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
