using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class CoupleService
{
    private readonly AppDbContext _db;

    public CoupleService(AppDbContext db) => _db = db;

    public async Task<CreateCoupleResponse> CreateCoupleAsync(Guid userId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("couple.create");
        activity?.SetTag("enduser.id", userId);

        try
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("User not found.");

            if (user.CoupleId != null)
                throw new InvalidOperationException("You are already in a couple.");

            var couple = new Couple
            {
                InviteCode = GenerateInviteCode(),
                CreatedByUserId = userId
            };

            _db.Couples.Add(couple);
            user.CoupleId = couple.Id;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            Telemetry.CoupleOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "create"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return new CreateCoupleResponse(couple.Id, couple.InviteCode);
        }
        catch (Exception ex)
        {
            Telemetry.CoupleOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "create"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task<CreateCoupleResponse> JoinCoupleAsync(Guid userId, string inviteCode)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("couple.join");
        activity?.SetTag("enduser.id", userId);

        try
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("User not found.");

            if (user.CoupleId != null)
                throw new InvalidOperationException("You are already in a couple.");

            var couple = await _db.Couples
                .Include(c => c.Members)
                .FirstOrDefaultAsync(c => c.InviteCode == inviteCode)
                ?? throw new KeyNotFoundException("Invalid invite code.");

            if (couple.IsComplete)
                throw new InvalidOperationException("This couple already has two members.");

            if (couple.Members.Count >= 2)
                throw new InvalidOperationException("This couple already has two members.");

            user.CoupleId = couple.Id;
            user.UpdatedAt = DateTime.UtcNow;
            couple.IsComplete = true;

            await _db.SaveChangesAsync();

            Telemetry.CoupleOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "join"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return new CreateCoupleResponse(couple.Id, couple.InviteCode);
        }
        catch (Exception ex)
        {
            Telemetry.CoupleOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "join"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task LeaveCoupleAsync(Guid userId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("couple.leave");
        activity?.SetTag("enduser.id", userId);

        try
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("User not found.");

            if (user.CoupleId == null)
                throw new InvalidOperationException("You are not in a couple.");

            var couple = await _db.Couples
                .Include(c => c.Members)
                .FirstOrDefaultAsync(c => c.Id == user.CoupleId)!;

            user.CoupleId = null;
            user.UpdatedAt = DateTime.UtcNow;

            if (couple != null && couple.Members.Count <= 1)
            {
                _db.Couples.Remove(couple);
            }
            else if (couple != null)
            {
                couple.IsComplete = false;
            }

            await _db.SaveChangesAsync();
            Telemetry.CoupleOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "leave"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
        }
        catch (Exception ex)
        {
            Telemetry.CoupleOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "leave"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    private static string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return new string(Enumerable.Range(0, 8)
            .Select(_ => chars[RandomNumberGenerator.GetInt32(chars.Length)])
            .ToArray());
    }
}
