using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Services;
using ThirdWheel.API.Services.Verification;

namespace ThirdWheel.API.Controllers;

[Authorize]
public class AdminController : BaseController
{
    private readonly AppDbContext _db;
    private readonly AuthService _authService;
    private readonly VerificationService _verificationService;
    private const string SeedAdminEmail = "yasvanth@live.in";

    public AdminController(AppDbContext db, AuthService authService, VerificationService verificationService)
    {
        _db = db;
        _authService = authService;
        _verificationService = verificationService;
    }

    // GET /api/admin/users
    // Admin-safe list view with coarse profile and moderation signals only.
    [AllowAnonymous]
    [HttpGet("users")]
    public async Task<IActionResult> ListUsers()
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                DisplayName = u.Username,
                u.IsBanned,
                u.CoupleId,
                u.City,
                u.State
            })
            .ToListAsync();

        if (users.Count == 0)
            return Ok(Array.Empty<object>());

        var userIds = users.Select(u => u.Id).ToArray();

        var blockCounts = await _db.Blocks
            .AsNoTracking()
            .Where(b => userIds.Contains(b.BlockedUserId))
            .GroupBy(b => b.BlockedUserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var reportCounts = await _db.Reports
            .AsNoTracking()
            .Where(r => userIds.Contains(r.ReportedUserId))
            .GroupBy(r => r.ReportedUserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var verificationCounts = await _db.UserVerifications
            .AsNoTracking()
            .Where(v => userIds.Contains(v.UserId) && v.Status != Models.VerificationStatus.Disabled)
            .GroupBy(v => v.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Total = g.Count(),
                Verified = g.Count(v => v.Status == Models.VerificationStatus.Verified),
                Pending = g.Count(v =>
                    v.Status == Models.VerificationStatus.Pending ||
                    v.Status == Models.VerificationStatus.InReview)
            })
            .ToDictionaryAsync(
                x => x.UserId,
                x => new { x.Total, x.Verified, x.Pending });

        return Ok(users.Select(u =>
        {
            blockCounts.TryGetValue(u.Id, out var blockCount);
            reportCounts.TryGetValue(u.Id, out var reportCount);
            verificationCounts.TryGetValue(u.Id, out var verification);

            return new
            {
                id = u.Id,
                displayName = u.DisplayName,
                accountStatus = u.IsBanned ? "Banned" : "Active",
                profileType = u.CoupleId.HasValue ? "couple" : "single",
                verificationSummary = FormatVerificationSummary(
                    verification?.Total ?? 0,
                    verification?.Verified ?? 0,
                    verification?.Pending ?? 0),
                blockCount,
                reportCount,
                onlineStatus = "Unknown",
                geographySummary = BuildGeographySummary(u.City, u.State),
                city = NormalizeGeographyValue(u.City),
                state = NormalizeGeographyValue(u.State)
            };
        }));
    }

    // GET /api/admin/online-users
    // Admin-safe list view for users with an active realtime connection only.
    [AllowAnonymous]
    [HttpGet("online-users")]
    public async Task<IActionResult> ListOnlineUsers()
    {
        var onlineUserIds = OnlineUserPresenceTracker.GetOnlineUserIds();
        if (onlineUserIds.Length == 0)
            return Ok(Array.Empty<object>());

        var users = await _db.Users
            .AsNoTracking()
            .Where(u => onlineUserIds.Contains(u.Id))
            .OrderBy(u => u.Username)
            .Select(u => new
            {
                u.Id,
                DisplayName = u.Username,
                u.IsBanned,
                u.CoupleId,
                u.City,
                u.State
            })
            .ToListAsync();

        if (users.Count == 0)
            return Ok(Array.Empty<object>());

        var userIds = users.Select(u => u.Id).ToArray();

        var verificationCounts = await _db.UserVerifications
            .AsNoTracking()
            .Where(v => userIds.Contains(v.UserId) && v.Status != Models.VerificationStatus.Disabled)
            .GroupBy(v => v.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Total = g.Count(),
                Verified = g.Count(v => v.Status == Models.VerificationStatus.Verified),
                Pending = g.Count(v =>
                    v.Status == Models.VerificationStatus.Pending ||
                    v.Status == Models.VerificationStatus.InReview)
            })
            .ToDictionaryAsync(
                x => x.UserId,
                x => new { x.Total, x.Verified, x.Pending });

        return Ok(users.Select(u =>
        {
            verificationCounts.TryGetValue(u.Id, out var verification);

            return new
            {
                id = u.Id,
                displayName = u.DisplayName,
                accountStatus = u.IsBanned ? "Banned" : "Active",
                profileType = u.CoupleId.HasValue ? "couple" : "single",
                verificationSummary = FormatVerificationSummary(
                    verification?.Total ?? 0,
                    verification?.Verified ?? 0,
                    verification?.Pending ?? 0),
                onlineStatus = "Online",
                geographySummary = BuildGeographySummary(u.City, u.State)
            };
        }));
    }

    // GET /api/admin/moderation-analytics
    // Admin-safe aggregate moderation summary only.
    [AllowAnonymous]
    [HttpGet("moderation-analytics")]
    public async Task<IActionResult> GetModerationAnalytics()
    {
        var totalReports = await _db.Reports
            .AsNoTracking()
            .CountAsync();

        var totalReportedUsers = await _db.Reports
            .AsNoTracking()
            .Select(r => r.ReportedUserId)
            .Distinct()
            .CountAsync();

        var totalBlockRelationships = await _db.Blocks
            .AsNoTracking()
            .CountAsync();

        var totalBlockedUsers = await _db.Blocks
            .AsNoTracking()
            .Select(b => b.BlockedUserId)
            .Distinct()
            .CountAsync();

        var topReportReasons = await _db.Reports
            .AsNoTracking()
            .GroupBy(r => r.Reason)
            .Select(g => new
            {
                Reason = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ThenBy(x => x.Reason)
            .Take(5)
            .ToListAsync();

        var verificationStatusDistribution = await _db.UserVerifications
            .AsNoTracking()
            .Where(v => v.Status != Models.VerificationStatus.Disabled)
            .GroupBy(v => v.Status)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ThenBy(x => x.Status)
            .ToListAsync();

        return Ok(new
        {
            totalReportedUsers,
            totalReports,
            totalBlockedUsers,
            totalBlockRelationships,
            topReportReasons = topReportReasons.Select(x => new
            {
                reason = x.Reason,
                count = x.Count
            }),
            verificationStatusDistribution = verificationStatusDistribution.Select(x => new
            {
                status = FormatVerificationStatus(x.Status.ToString()),
                count = x.Count
            })
        });
    }

    // GET /api/admin/users/{userId}
    // Admin-safe detail view with coarse moderation and verification summaries only.
    [AllowAnonymous]
    [HttpGet("users/{userId:guid}")]
    public async Task<IActionResult> GetUserDetail(Guid userId)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.Id,
                DisplayName = u.Username,
                u.IsBanned,
                u.CoupleId,
                u.City,
                u.State,
                u.CreatedAt
            })
            .SingleOrDefaultAsync();

        if (user is null)
            return NotFound();

        var verificationSummary = await _verificationService.GetMethodsAsync(userId);

        var reportReasons = await _db.Reports
            .AsNoTracking()
            .Where(r => r.ReportedUserId == userId)
            .GroupBy(r => r.Reason)
            .Select(g => new
            {
                Reason = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ThenBy(x => x.Reason)
            .ToListAsync();

        var reportCount = reportReasons.Sum(x => x.Count);

        var blockCount = await _db.Blocks
            .AsNoTracking()
            .CountAsync(b => b.BlockedUserId == userId);

        return Ok(new
        {
            id = user.Id,
            displayName = user.DisplayName,
            accountStatus = user.IsBanned ? "Banned" : "Active",
            profileType = user.CoupleId.HasValue ? "couple" : "single",
            verificationSummary = verificationSummary.Methods.Select(v => new
            {
                method = v.DisplayName,
                status = FormatVerificationStatus(v.Status),
                isEnabled = v.IsEnabled,
                verifiedAt = v.VerifiedAt,
                expiresAt = v.ExpiresAt
            }),
            reportCount,
            reportReasons = reportReasons.Select(r => new
            {
                reason = r.Reason,
                count = r.Count
            }),
            blockCount,
            onlineStatus = "Unknown",
            geographySummary = BuildGeographySummary(user.City, user.State),
            createdAt = user.CreatedAt,
            lastActiveAt = (DateTime?)null
        });
    }

    // DELETE /api/admin/seed-users
    // Removes every user except the demo admin account and any dangling couple records.
    [HttpDelete("seed-users")]
    public async Task<IActionResult> PurgeSeedUsers()
    {
        EnsureSeedAdminAccess();

        const string preservedEmail = "yasvanth@live.in";

        // Impress Me data uses a restrictive FK on ReceiverId, so clear it before users.
        await _db.Database.ExecuteSqlRawAsync($@"
            DELETE FROM ""ImpressMeResponses""
            WHERE ""SignalId"" IN (
                SELECT ""Id"" FROM ""ImpressMeSignals""
                WHERE ""SenderId"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
                   OR ""ReceiverId"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
            )
        ");

        await _db.Database.ExecuteSqlRawAsync($@"
            DELETE FROM ""ImpressMePrompts""
            WHERE ""SignalId"" IN (
                SELECT ""Id"" FROM ""ImpressMeSignals""
                WHERE ""SenderId"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
                   OR ""ReceiverId"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
            )
        ");

        await _db.Database.ExecuteSqlRawAsync($@"
            DELETE FROM ""ImpressMeSignals""
            WHERE ""SenderId"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
               OR ""ReceiverId"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
        ");

        await _db.Database.ExecuteSqlRawAsync($@"
            DELETE FROM ""Notifications""
            WHERE ""RecipientId"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
               OR ""ActorId"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
        ");

        // Messages have no direct cascade from User — delete via Matches first
        await _db.Database.ExecuteSqlRawAsync($@"
            DELETE FROM ""Messages""
            WHERE ""MatchId"" IN (
                SELECT ""Id"" FROM ""Matches""
                WHERE ""User1Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
                   OR ""User2Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
            )
        ");

        // Match has no cascade from User — delete explicitly
        await _db.Database.ExecuteSqlRawAsync($@"
            DELETE FROM ""Matches""
            WHERE ""User1Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
               OR ""User2Id"" IN (SELECT ""Id"" FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}')
        ");

        // Delete users (Photos, Interests, Likes, Blocks, SpamWarnings, EventInterests cascade)
        var deletedUsers = await _db.Database.ExecuteSqlRawAsync($@"
            DELETE FROM ""Users"" WHERE LOWER(""Email"") <> '{preservedEmail}'
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

    private static string FormatVerificationSummary(int total, int verified, int pending)
    {
        if (total == 0)
            return "None";

        if (verified == total)
            return $"Verified ({verified}/{total})";

        if (pending > 0)
            return $"{verified}/{total} verified, {pending} pending";

        return $"{verified}/{total} verified";
    }

    private static string FormatVerificationStatus(string status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return "Unknown";

        var compact = status.Replace("-", string.Empty).Replace("_", string.Empty).Replace(" ", string.Empty).Trim();
        if (compact.Equals("notstarted", StringComparison.OrdinalIgnoreCase))
            return "Not Started";
        if (compact.Equals("inreview", StringComparison.OrdinalIgnoreCase))
            return "In Review";

        var normalized = status.Replace('-', ' ').Replace('_', ' ').Trim();
        var parts = new List<string>();
        var token = new System.Text.StringBuilder();

        foreach (var ch in normalized)
        {
            if (char.IsWhiteSpace(ch))
            {
                if (token.Length > 0)
                {
                    parts.Add(token.ToString());
                    token.Clear();
                }

                continue;
            }

            if (token.Length > 0 && char.IsUpper(ch) && char.IsLower(token[token.Length - 1]))
            {
                parts.Add(token.ToString());
                token.Clear();
            }

            token.Append(ch);
        }

        if (token.Length > 0)
            parts.Add(token.ToString());

        return string.Join(' ', parts.Select(part => char.ToUpperInvariant(part[0]) + part[1..].ToLowerInvariant()));
    }

    private static string? BuildGeographySummary(string? city, string? state)
    {
        var parts = new[] { city, state }
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .Select(part => part!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return parts.Length == 0 ? null : string.Join(", ", parts);
    }

    private static string? NormalizeGeographyValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
