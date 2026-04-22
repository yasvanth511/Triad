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

    public async Task<UserProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest req)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("profile.update");
        activity?.SetTag("enduser.id", userId);

        try
        {
            var user = await _db.Users
                .Include(u => u.Photos)
                .Include(u => u.Interests)
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

    public async Task<PhotoResponse> AddPhotoAsync(Guid userId, string url)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("profile.add_photo");
        activity?.SetTag("enduser.id", userId);

        try
        {
            var photoCount = await _db.UserPhotos.CountAsync(p => p.UserId == userId);
            if (photoCount >= AppConstants.MaxPhotos)
                throw new InvalidOperationException($"Maximum {AppConstants.MaxPhotos} photos allowed.");

            var photo = new UserPhoto
            {
                UserId = userId,
                Url = url,
                SortOrder = photoCount
            };

            _db.UserPhotos.Add(photo);
            await _db.SaveChangesAsync();

            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "add_photo"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return new PhotoResponse(photo.Id, photo.Url, photo.SortOrder);
        }
        catch (Exception ex)
        {
            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "add_photo"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task DeletePhotoAsync(Guid userId, Guid photoId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("profile.delete_photo");
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.photo.id", photoId);

        try
        {
            var photo = await _db.UserPhotos
                .FirstOrDefaultAsync(p => p.Id == photoId && p.UserId == userId)
                ?? throw new KeyNotFoundException("Photo not found.");

            _db.UserPhotos.Remove(photo);
            await _db.SaveChangesAsync();
            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "delete_photo"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
        }
        catch (Exception ex)
        {
            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "delete_photo"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }
}
