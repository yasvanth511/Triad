using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class ProfileController : BaseController
{
    private readonly ProfileService _profileService;
    private readonly ImageService _imageService;
    private readonly AntiSpamService _antiSpam;

    public ProfileController(ProfileService profileService, ImageService imageService, AntiSpamService antiSpam)
    {
        _profileService = profileService;
        _imageService = imageService;
        _antiSpam = antiSpam;
    }

    [HttpGet]
    public async Task<ActionResult<UserProfileResponse>> GetProfile()
    {
        var profile = await _profileService.GetProfileAsync(GetUserId());
        return Ok(profile);
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

    [HttpPost("photos")]
    public async Task<ActionResult<PhotoResponse>> UploadPhoto(IFormFile file)
    {
        if (file.Length == 0 || file.Length > 5 * 1024 * 1024)
            return BadRequest(new { error = "Photo must be between 1 byte and 5MB." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { error = "Only JPEG, PNG, and WebP images are allowed." });

        try
        {
            using var stream = file.OpenReadStream();
            var url = await _imageService.SavePhotoAsync(stream, file.FileName);
            var photo = await _profileService.AddPhotoAsync(GetUserId(), url);
            return Ok(photo);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("photos/{photoId}")]
    public async Task<IActionResult> DeletePhoto(Guid photoId)
    {
        try
        {
            await _profileService.DeletePhotoAsync(GetUserId(), photoId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
