using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services.Verification;

namespace ThirdWheel.API.Controllers;

[Authorize]
[Route("api/verifications")]
public class VerificationController : BaseController
{
    private readonly VerificationService _verificationService;

    public VerificationController(VerificationService verificationService)
    {
        _verificationService = verificationService;
    }

    [HttpGet]
    public async Task<ActionResult<VerificationListResponse>> GetMethods(CancellationToken cancellationToken)
    {
        var response = await _verificationService.GetMethodsAsync(GetUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpPost("{methodKey}/attempts")]
    public async Task<ActionResult<StartVerificationAttemptResponse>> StartAttempt(
        string methodKey,
        [FromBody] StartVerificationAttemptRequest? request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await _verificationService.StartAttemptAsync(
                GetUserId(),
                methodKey,
                request ?? new StartVerificationAttemptRequest(null),
                cancellationToken);
            return Ok(response);
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

    [HttpPost("{methodKey}/attempts/{attemptId:guid}/complete")]
    public async Task<ActionResult<VerificationAttemptResponse>> CompleteAttempt(
        string methodKey,
        Guid attemptId,
        [FromBody] CompleteVerificationAttemptRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await _verificationService.CompleteAttemptAsync(
                GetUserId(),
                methodKey,
                attemptId,
                request,
                cancellationToken);
            return Ok(response);
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
