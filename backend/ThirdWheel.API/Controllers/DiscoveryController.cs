using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class DiscoveryController : BaseController
{
    private readonly DiscoveryService _discoveryService;

    public DiscoveryController(DiscoveryService discoveryService) => _discoveryService = discoveryService;

    [HttpGet]
    public async Task<ActionResult<List<DiscoveryCardResponse>>> GetCards(
        [FromQuery] string? userType,
        [FromQuery] double? maxDistanceKm,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20)
    {
        take = Math.Clamp(take, 1, 50);
        var filter = new DiscoveryFilterRequest(userType, maxDistanceKm, skip, take);
        var cards = await _discoveryService.GetDiscoveryCardsAsync(GetUserId(), filter);
        return Ok(cards);
    }
}
