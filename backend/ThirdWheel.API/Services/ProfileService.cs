using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Helpers;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class ProfileService
{
    private readonly AppDbContext _db;

    public ProfileService(AppDbContext db) => _db = db;

    public async Task<UserProfileResponse> GetProfileAsync(Guid userId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("profile.get");
        activity?.SetTag("enduser.id", userId);

        try
        {
            var user = await _db.Users
                .Include(u => u.Photos)
                .Include(u => u.Interests)
                .Include(u => u.Couple)
                    .ThenInclude(c => c!.Members)
                .FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new KeyNotFoundException("User not found.");

            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "get"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return UserMapper.ToProfileResponse(user);
        }
        catch (Exception ex)
        {
            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "get"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task<UserProfileResponse> GetPublicProfileAsync(Guid viewerId, Guid userId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("profile.get_public");
        activity?.SetTag("enduser.id", viewerId);
        activity?.SetTag("triad.target_user.id", userId);

        try
        {
            var isBlocked = await _db.Blocks.AnyAsync(b =>
                (b.BlockerUserId == viewerId && b.BlockedUserId == userId) ||
                (b.BlockerUserId == userId && b.BlockedUserId == viewerId));
            if (isBlocked)
                throw new KeyNotFoundException("User not found.");

            var user = await _db.Users
                .Include(u => u.Photos)
                .Include(u => u.Interests)
                .Include(u => u.Couple)
                    .ThenInclude(c => c!.Members)
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsBanned)
                ?? throw new KeyNotFoundException("User not found.");

            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "get_public"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return UserMapper.ToProfileResponse(user);
        }
        catch (Exception ex)
        {
            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "get_public"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task<UserProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest req)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("profile.update");
        activity?.SetTag("enduser.id", userId);

        try
        {
            var user = await _db.Users
                .Include(u => u.Photos)
                .Include(u => u.Interests)
                .Include(u => u.Couple)
                    .ThenInclude(c => c!.Members)
                .FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new KeyNotFoundException("User not found.");

            if (req.Bio != null) user.Bio = req.Bio;
            if (req.AgeMin.HasValue) user.AgeMin = req.AgeMin.Value;
            if (req.AgeMax.HasValue) user.AgeMax = req.AgeMax.Value;
            if (req.Intent != null) user.Intent = req.Intent;
            if (req.LookingFor != null) user.LookingFor = req.LookingFor;

            if (req.Latitude.HasValue && req.Longitude.HasValue)
            {
                user.Latitude = Math.Round(req.Latitude.Value, 2);
                user.Longitude = Math.Round(req.Longitude.Value, 2);
            }

            if (req.City != null) user.City = req.City;
            if (req.State != null) user.State = req.State;
            if (req.ZipCode != null) user.ZipCode = req.ZipCode;
            if (req.RadiusMiles.HasValue) user.RadiusMiles = req.RadiusMiles.Value;

            if (req.Interests != null)
            {
                _db.UserInterests.RemoveRange(user.Interests);
                var newInterests = req.Interests.Select(t => new UserInterest
                {
                    UserId = userId,
                    Tag = t
                }).ToList();
                _db.UserInterests.AddRange(newInterests);
                user.Interests = newInterests;
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "update"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return UserMapper.ToProfileResponse(user);
        }
        catch (Exception ex)
        {
            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "update"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task DeleteAccountAsync(Guid userId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("profile.delete");
        activity?.SetTag("enduser.id", userId);

        try
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("User not found.");

            if (user.CoupleId.HasValue)
            {
                var couple = await _db.Couples
                    .Include(c => c.Members)
                    .FirstOrDefaultAsync(c => c.Id == user.CoupleId.Value);

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
            }

            await _db.Database.ExecuteSqlInterpolatedAsync($"""
                DELETE FROM "Messages"
                WHERE "MatchId" IN (
                    SELECT "Id"
                    FROM "Matches"
                    WHERE "User1Id" = {userId} OR "User2Id" = {userId}
                )
                """);

            await _db.Database.ExecuteSqlInterpolatedAsync($"""
                DELETE FROM "Matches"
                WHERE "User1Id" = {userId} OR "User2Id" = {userId}
                """);

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            await _db.Database.ExecuteSqlRawAsync(@"
                DELETE FROM ""Couples""
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM ""Users""
                    WHERE ""Users"".""CoupleId"" = ""Couples"".""Id""
                )
            ");

            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "delete"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
        }
        catch (Exception ex)
        {
            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "delete"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }
}
