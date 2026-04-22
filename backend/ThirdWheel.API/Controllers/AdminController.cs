using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class AdminController : BaseController
{
    private readonly AppDbContext _db;
    private readonly AuthService _authService;
    private const string SeedAdminEmail = "yasvanth@live.in";

    public AdminController(AppDbContext db, AuthService authService)
    {
        _db = db;
        _authService = authService;
    }

    // DELETE /api/admin/seed-users
    // Removes every user except the demo admin account and any dangling couple records.
    [HttpDelete("seed-users")]
    public async Task<IActionResult> PurgeSeedUsers()
    {
        EnsureSeedAdminAccess();

        // Messages have no direct cascade from User — delete via Matches first
        await _db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""Messages""
            WHERE ""MatchId"" IN (
                SELECT ""Id"" FROM ""Matches""
                WHERE ""User1Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> 'yasvanth@live.in')
                   OR ""User2Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> 'yasvanth@live.in')
            )
        ");

        // Match has no cascade from User — delete explicitly
        await _db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""Matches""
            WHERE ""User1Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> 'yasvanth@live.in')
               OR ""User2Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> 'yasvanth@live.in')
        ");

        // Delete users (Photos, Interests, Likes, Blocks, SpamWarnings, EventInterests cascade)
        var deletedUsers = await _db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""Users"" WHERE LOWER(""Email"") <> 'yasvanth@live.in'
        ");

        var deletedCouples = await _db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""Couples""
            WHERE NOT EXISTS (
                SELECT 1
                FROM ""Users""
                WHERE ""Users"".""CoupleId"" = ""Couples"".""Id""
            )
        ");

        return Ok(new
        {
            deletedUsers,
            deletedCouples,
            message = "Demo users were purged. Only yasvanth@live.in was preserved."
        });
    }

    // DELETE /api/admin/seed-events
    // Removes all events (EventInterests cascade).
    [HttpDelete("seed-events")]
    public async Task<IActionResult> PurgeSeedEvents()
    {
        EnsureSeedAdminAccess();

        var deleted = await _db.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Events""");
        return Ok(new { deleted, message = "Events purged." });
    }

    // POST /api/admin/seed-user
    // Registers a demo user without going through the public auth route.
    [DisableRateLimiting]
    [HttpPost("seed-user")]
    public async Task<ActionResult<AuthResponse>> CreateSeedUser([FromBody] RegisterRequest req)
    {
        EnsureSeedAdminAccess();

        try
        {
            var result = await _authService.RegisterAsync(req);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private void EnsureSeedAdminAccess()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        if (!string.Equals(email, SeedAdminEmail, StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("Only the demo admin account can run seed operations.");
    }
}
