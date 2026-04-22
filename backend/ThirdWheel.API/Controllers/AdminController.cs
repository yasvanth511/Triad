using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class AdminController : BaseController
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db) => _db = db;

    // DELETE /api/admin/seed-users
    // Removes all users seeded via seed.ps1 (@triad.dev emails) and all related data.
    [HttpDelete("seed-users")]
    public async Task<IActionResult> PurgeSeedUsers()
    {
        // Messages have no direct cascade from User — delete via Matches first
        await _db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""Messages""
            WHERE ""MatchId"" IN (
                SELECT ""Id"" FROM ""Matches""
                WHERE ""User1Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE ""Email"" LIKE '%@triad.dev')
                   OR ""User2Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE ""Email"" LIKE '%@triad.dev')
            )
        ");

        // Match has no cascade from User — delete explicitly
        await _db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""Matches""
            WHERE ""User1Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE ""Email"" LIKE '%@triad.dev')
               OR ""User2Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE ""Email"" LIKE '%@triad.dev')
        ");

        // Delete users (Photos, Interests, Likes, Blocks, SpamWarnings, EventInterests cascade)
        var deleted = await _db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""Users"" WHERE ""Email"" LIKE '%@triad.dev'
        ");

        return Ok(new { deleted, message = "Seed users purged." });
    }

    // DELETE /api/admin/seed-events
    // Removes all events (EventInterests cascade).
    [HttpDelete("seed-events")]
    public async Task<IActionResult> PurgeSeedEvents()
    {
        var deleted = await _db.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Events""");
        return Ok(new { deleted, message = "Events purged." });
    }
}
