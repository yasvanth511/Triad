using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ThirdWheel.API.Data;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public partial class AntiSpamService
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;

    // Blocked keywords (case-insensitive)
    private static readonly string[] SpamKeywords =
        ["onlyfans", "of link", "telegram", "cashapp", "cash app", "venmo", "paypal", "snapchat"];

    public AntiSpamService(AppDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task CheckMessageAsync(Guid userId, Guid matchId, string content, bool? isUserBanned = null)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("antispam.check_message");
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.match.id", matchId);

        try
        {
            if (isUserBanned == true)
                throw new InvalidOperationException("Account has been suspended.");

            if (isUserBanned == null)
            {
                var userExists = await _db.Users
                    .AsNoTracking()
                    .Where(u => u.Id == userId)
                    .Select(u => new { u.IsBanned })
                    .FirstOrDefaultAsync()
                    ?? throw new KeyNotFoundException("User not found.");

                if (userExists.IsBanned)
                    throw new InvalidOperationException("Account has been suspended.");
            }

            if (ContainsLink(content))
            {
                Telemetry.SafetyOperations.Add(1,
                    new KeyValuePair<string, object?>("operation", "message_link_block"),
                    new KeyValuePair<string, object?>("outcome", "blocked"));
                throw new InvalidOperationException("External links are not allowed.");
            }

            var lowerContent = content.ToLowerInvariant();
            var detectedKeyword = SpamKeywords.FirstOrDefault(k => lowerContent.Contains(k));

            if (detectedKeyword != null)
            {
                await HandleSpamDetection(userId, $"Keyword detected: {detectedKeyword}");
            }

            var contentHash = Convert.ToHexString(System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes(content)));
            var cacheKey = $"antispam:recent:{userId}:{contentHash}";
            if (_cache.TryGetValue(cacheKey, out int repeatCount) && repeatCount >= AppConstants.RepeatedMessageThreshold)
            {
                await HandleSpamDetection(userId, "Repeated messages detected");
            }
            _cache.Set(cacheKey, (repeatCount) + 1, TimeSpan.FromMinutes(AppConstants.RepeatedMessageWindowMinutes));

            Telemetry.MarkSuccess(activity);
        }
        catch (Exception ex)
        {
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public void ValidateProfileContent(string? bio)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("antispam.validate_profile");

        try
        {
            if (bio != null && ContainsLink(bio))
            {
                Telemetry.SafetyOperations.Add(1,
                    new KeyValuePair<string, object?>("operation", "profile_link_block"),
                    new KeyValuePair<string, object?>("outcome", "blocked"));
                throw new InvalidOperationException("External links are not allowed in profiles.");
            }

            Telemetry.MarkSuccess(activity);
        }
        catch (Exception ex)
        {
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    private async Task HandleSpamDetection(Guid userId, string reason)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("antispam.handle_detection");
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.spam.reason", reason);

        try
        {
            var warnings = await _db.SpamWarnings
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var currentLevel = warnings.Count > 0 ? warnings[0].Level + 1 : 1;
            activity?.SetTag("triad.spam.level", currentLevel);

            var warning = new SpamWarning
            {
                UserId = userId,
                Reason = reason,
                Level = currentLevel
            };

            _db.SpamWarnings.Add(warning);

            if (currentLevel >= AppConstants.SpamStrikesBeforeBan)
            {
                var user = await _db.Users.FindAsync(userId);
                if (user != null) user.IsBanned = true;
                await _db.SaveChangesAsync();
                Telemetry.SafetyOperations.Add(1,
                    new KeyValuePair<string, object?>("operation", "spam_detection"),
                    new KeyValuePair<string, object?>("outcome", "ban"));
                throw new InvalidOperationException("Account has been suspended due to repeated violations.");
            }

            await _db.SaveChangesAsync();

            Telemetry.SafetyOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "spam_detection"),
                new KeyValuePair<string, object?>("outcome", currentLevel == 1 ? "warn" : "throttle"));

            if (currentLevel == 1)
                throw new InvalidOperationException("Warning: Your message contains prohibited content.");
            else
                throw new InvalidOperationException("Your messaging has been throttled due to violations.");
        }
        catch (Exception ex)
        {
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    private static bool ContainsLink(string text)
    {
        return LinkRegex().IsMatch(text);
    }

    [GeneratedRegex(@"(https?://|www\.|\.com|\.net|\.org|\.io|t\.me|bit\.ly)", RegexOptions.IgnoreCase)]
    private static partial Regex LinkRegex();
}
