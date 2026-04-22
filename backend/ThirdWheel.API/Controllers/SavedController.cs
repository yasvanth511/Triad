using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class SavedController : BaseController
{
    private readonly SavedProfileService _savedProfileService;

    public SavedController(SavedProfileService savedProfileService) =>
        _savedProfileService = savedProfileService;

    [HttpPost]
    public async Task<IActionResult> SaveProfile([FromBody] SaveProfileRequest req)
    {
        try
        {
            await _savedProfileService.SaveProfileAsync(GetUserId(), req.TargetUserId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<SavedProfileResponse>>> GetSavedProfiles()
    {
        var savedProfiles = await _savedProfileService.GetSavedProfilesAsync(GetUserId());
        return Ok(savedProfiles);
    }

    [HttpDelete("{targetUserId}")]
    public async Task<IActionResult> RemoveSavedProfile(Guid targetUserId)
    {
        await _savedProfileService.RemoveSavedProfileAsync(GetUserId(), targetUserId);
        return NoContent();
    }
}
