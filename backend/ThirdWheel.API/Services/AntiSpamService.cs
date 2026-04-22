using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public partial class AntiSpamService
{
    private readonly AppDbContext _db;

    // Blocked keywords (case-insensitive)
    private static readonly string[] SpamKeywords =
        ["onlyfans", "of link", "telegram", "cashapp", "cash app", "venmo", "paypal", "snapchat"];

    public AntiSpamService(AppDbContext db) => _db = db;

    public async Task CheckMessageAsync(Guid userId, Guid matchId, string content)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("antispam.check_message");
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.match.id", matchId);

        try
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("User not found.");

            if (user.IsBanned)
                throw new InvalidOperationException("Account has been suspended.");

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

            // Count identical messages at the DB level — avoids pulling all message
            // content into memory on every send.
            var cutoff = DateTime.UtcNow.AddMinutes(-AppConstants.RepeatedMessageWindowMinutes);
            var repeatedCount = await _db.Messages
                .CountAsync(m => m.SenderId == userId
                              && m.SentAt > cutoff
                              && m.Content == content);

            if (repeatedCount >= AppConstants.RepeatedMessageThreshold)
            {
                await HandleSpamDetection(userId, "Repeated messages detected");
            }

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
