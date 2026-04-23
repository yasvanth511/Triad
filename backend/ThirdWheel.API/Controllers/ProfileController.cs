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
    private readonly ImageService _imageService;

    public ProfileController(ProfileService profileService, AntiSpamService antiSpam, ImageService imageService)
    {
        _profileService = profileService;
        _antiSpam = antiSpam;
        _imageService = imageService;
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
    public async Task<ActionResult<PhotoResponse>> UploadPhoto(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        string? url = null;
        try
        {
            url = await _imageService.SavePhotoAsync(file.OpenReadStream(), file.FileName);
            var photo = await _profileService.AddPhotoAsync(GetUserId(), url);
            return Ok(photo);
        }
        catch (InvalidOperationException ex)
        {
            _imageService.DeletePhoto(url);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("photos/{photoId}")]
    public async Task<IActionResult> DeletePhoto(Guid photoId)
    {
        try
        {
            var deletedUrl = await _profileService.DeletePhotoAsync(GetUserId(), photoId);
            _imageService.DeletePhoto(deletedUrl);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Upload an audio bio file (mp3, m4a, aac, wav). Max 10 MB.
    /// Replaces any existing audio bio.
    /// </summary>
    [HttpPost("audio-bio")]
    [RequestSizeLimit(AppConstants.MaxAudioBioSizeMb * 1024 * 1024 + 4096)]
    public async Task<ActionResult<UploadAudioBioResponse>> UploadAudioBio(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        try
        {
            var url = await _imageService.SaveAudioBioAsync(
                file.OpenReadStream(),
                file.ContentType,
                file.Length);

            var (oldUrl, _) = await _profileService.SetAudioBioUrlAsync(GetUserId(), url);
            _imageService.DeleteAudioBio(oldUrl);

            return Ok(new UploadAudioBioResponse(url));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Remove the current user's audio bio.
    /// </summary>
    [HttpDelete("audio-bio")]
    public async Task<IActionResult> DeleteAudioBio()
    {
        try
        {
            var (oldUrl, _) = await _profileService.SetAudioBioUrlAsync(GetUserId(), null);
            _imageService.DeleteAudioBio(oldUrl);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Upload a video bio file (mp4, mov, m4v). Max 50 MB, up to 60 seconds.
    /// Replaces any existing video bio.
    /// </summary>
    [HttpPost("video-bio")]
    [RequestSizeLimit(AppConstants.MaxVideoBioSizeMb * 1024 * 1024 + 4096)]
    public async Task<ActionResult<UploadVideoBioResponse>> UploadVideoBio(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        try
        {
            var url = await _imageService.SaveVideoBioAsync(
                file.OpenReadStream(),
                file.ContentType,
                file.Length);

            var (oldUrl, _) = await _profileService.SetVideoBioUrlAsync(GetUserId(), url);
            _imageService.DeleteVideoBio(oldUrl);

            return Ok(new UploadVideoBioResponse(url));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Remove the current user's video bio.
    /// </summary>
    [HttpDelete("video-bio")]
    public async Task<IActionResult> DeleteVideoBio()
    {
        try
        {
            var (oldUrl, _) = await _profileService.SetVideoBioUrlAsync(GetUserId(), null);
            _imageService.DeleteVideoBio(oldUrl);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("videos")]
    [RequestSizeLimit(AppConstants.MaxVideoBioSizeMb * 1024 * 1024 + 4096)]
    public async Task<ActionResult<VideoResponse>> UploadVideo(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        string? url = null;
        try
        {
            url = await _imageService.SaveVideoBioAsync(
                file.OpenReadStream(),
                file.ContentType,
                file.Length);
            var video = await _profileService.AddVideoAsync(GetUserId(), url);
            return Ok(video);
        }
        catch (InvalidOperationException ex)
        {
            _imageService.DeleteVideo(url);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("videos/{videoId}")]
    public async Task<IActionResult> DeleteVideo(Guid videoId)
    {
        try
        {
            var deletedUrl = await _profileService.DeleteVideoAsync(GetUserId(), videoId);
            _imageService.DeleteVideo(deletedUrl);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
