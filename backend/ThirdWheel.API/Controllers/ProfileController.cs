using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class ProfileController : BaseController
{
    private readonly ProfileService _profileService;
    private readonly AntiSpamService _antiSpam;

    public ProfileController(ProfileService profileService, AntiSpamService antiSpam)
    {
        _profileService = profileService;
        _antiSpam = antiSpam;
    }

    [HttpGet]
    public async Task<ActionResult<UserProfileResponse>> GetProfile()
    {
        var profile = await _profileService.GetProfileAsync(GetUserId());
        return Ok(profile);
    }

    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<UserProfileResponse>> GetPublicProfile(Guid userId)
    {
        try
        {
            var profile = await _profileService.GetPublicProfileAsync(GetUserId(), userId);
            return Ok(profile);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut]
    public async Task<ActionResult<UserProfileResponse>> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        try
        {
            _antiSpam.ValidateProfileContent(req.Bio);
            var profile = await _profileService.UpdateProfileAsync(GetUserId(), req);
            return Ok(profile);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteProfile()
    {
        try
        {
            await _profileService.DeleteAccountAsync(GetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("photos")]
    public ActionResult<PhotoResponse> UploadPhoto(IFormFile file)
    {
        return Conflict(new { error = "Custom profile photos are disabled. Triad now uses a shared default profile image." });
    }

    [HttpDelete("photos/{photoId}")]
    public IActionResult DeletePhoto(Guid photoId)
    {
        return Conflict(new { error = "Custom profile photos are disabled. Triad now uses a shared default profile image." });
    }
}
