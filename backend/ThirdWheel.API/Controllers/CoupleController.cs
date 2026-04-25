using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class CoupleController : BaseController
{
    private readonly CoupleService _coupleService;

    public CoupleController(CoupleService coupleService) => _coupleService = coupleService;

    [HttpGet]
    public async Task<ActionResult<CoupleStatusResponse>> GetStatus()
    {
        var result = await _coupleService.GetCoupleStatusAsync(GetUserId());
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CreateCoupleResponse>> CreateCouple()
    {
        try
        {
            var result = await _coupleService.CreateCoupleAsync(GetUserId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("join")]
    public async Task<ActionResult<CreateCoupleResponse>> JoinCouple([FromBody] JoinCoupleRequest req)
    {
        try
        {
            var result = await _coupleService.JoinCoupleAsync(GetUserId(), req.InviteCode);
            return Ok(result);
        }
        catch (Exception ex) when (ex is InvalidOperationException or KeyNotFoundException)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete]
    public async Task<IActionResult> LeaveCouple()
    {
        try
        {
            await _coupleService.LeaveCoupleAsync(GetUserId());
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
