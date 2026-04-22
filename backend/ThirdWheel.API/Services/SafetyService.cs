using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class SafetyService
{
    private readonly AppDbContext _db;

    public SafetyService(AppDbContext db) => _db = db;

    public async Task BlockUserAsync(Guid blockerId, Guid blockedId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("safety.block");
        activity?.SetTag("enduser.id", blockerId);
        activity?.SetTag("triad.target_user.id", blockedId);

        try
        {
            if (blockerId == blockedId)
                throw new InvalidOperationException("Cannot block yourself.");

            var exists = await _db.Blocks
                .AnyAsync(b => b.BlockerUserId == blockerId && b.BlockedUserId == blockedId);
            if (exists)
                throw new InvalidOperationException("User already blocked.");

            _db.Blocks.Add(new Block
            {
                BlockerUserId = blockerId,
                BlockedUserId = blockedId
            });

            var matches = await _db.Matches
                .Where(m => (m.User1Id == blockerId && m.User2Id == blockedId)
                         || (m.User1Id == blockedId && m.User2Id == blockerId))
                .ToListAsync();

            foreach (var match in matches) match.IsActive = false;

            await _db.SaveChangesAsync();
            Telemetry.SafetyOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "block"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
        }
        catch (Exception ex)
        {
            Telemetry.SafetyOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "block"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task UnblockUserAsync(Guid blockerId, Guid blockedId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("safety.unblock");
        activity?.SetTag("enduser.id", blockerId);
        activity?.SetTag("triad.target_user.id", blockedId);

        try
        {
            var block = await _db.Blocks
                .FirstOrDefaultAsync(b => b.BlockerUserId == blockerId && b.BlockedUserId == blockedId)
                ?? throw new KeyNotFoundException("Block not found.");

            _db.Blocks.Remove(block);
            await _db.SaveChangesAsync();
            Telemetry.SafetyOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "unblock"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
        }
        catch (Exception ex)
        {
            Telemetry.SafetyOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "unblock"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task ReportUserAsync(Guid reporterId, ReportRequest req)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("safety.report");
        activity?.SetTag("enduser.id", reporterId);
        activity?.SetTag("triad.target_user.id", req.UserId);
        activity?.SetTag("triad.report.reason", req.Reason);

        try
        {
            if (reporterId == req.UserId)
                throw new InvalidOperationException("Cannot report yourself.");

            _db.Reports.Add(new Report
            {
                ReporterUserId = reporterId,
                ReportedUserId = req.UserId,
                Reason = req.Reason,
                Details = req.Details
            });

            await _db.SaveChangesAsync();
            Telemetry.SafetyOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "report"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
        }
        catch (Exception ex)
        {
            Telemetry.SafetyOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "report"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }
}
