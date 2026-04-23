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
                .AsSplitQuery()
                .Include(u => u.Photos)
                .Include(u => u.Videos)
                .Include(u => u.Interests)
                .Include(u => u.RedFlags)
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
                .AsSplitQuery()
                .Include(u => u.Photos)
                .Include(u => u.Videos)
                .Include(u => u.Interests)
                .Include(u => u.RedFlags)
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
                .Include(u => u.Videos)
                .Include(u => u.Interests)
                .Include(u => u.RedFlags)
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

            if (req.RedFlags != null)
            {
                _db.UserRedFlags.RemoveRange(user.RedFlags);
                var newRedFlags = req.RedFlags.Select(t => new UserRedFlag
                {
                    UserId = userId,
                    Tag = t
                }).ToList();
                _db.UserRedFlags.AddRange(newRedFlags);
                user.RedFlags = newRedFlags;
            }

            // Dating Preferences
            if (req.InterestedIn != null) user.InterestedIn = req.InterestedIn.Length == 0 ? null : req.InterestedIn;
            if (req.Neighborhood != null) user.Neighborhood = req.Neighborhood.Length == 0 ? null : req.Neighborhood;
            if (req.Ethnicity != null) user.Ethnicity = req.Ethnicity.Length == 0 ? null : req.Ethnicity;
            if (req.Religion != null) user.Religion = req.Religion.Length == 0 ? null : req.Religion;
            if (req.RelationshipType != null) user.RelationshipType = req.RelationshipType.Length == 0 ? null : req.RelationshipType;
            if (req.Height != null) user.Height = req.Height.Length == 0 ? null : req.Height;
            if (req.Children != null) user.Children = req.Children.Length == 0 ? null : req.Children;
            if (req.FamilyPlans != null) user.FamilyPlans = req.FamilyPlans.Length == 0 ? null : req.FamilyPlans;
            if (req.Drugs != null) user.Drugs = req.Drugs.Length == 0 ? null : req.Drugs;
            if (req.Smoking != null) user.Smoking = req.Smoking.Length == 0 ? null : req.Smoking;
            if (req.Marijuana != null) user.Marijuana = req.Marijuana.Length == 0 ? null : req.Marijuana;
            if (req.Drinking != null) user.Drinking = req.Drinking.Length == 0 ? null : req.Drinking;
            if (req.Politics != null) user.Politics = req.Politics.Length == 0 ? null : req.Politics;
            if (req.EducationLevel != null) user.EducationLevel = req.EducationLevel.Length == 0 ? null : req.EducationLevel;
            if (req.Weight != null) user.Weight = req.Weight.Length == 0 ? null : req.Weight;
            if (req.Physique != null) user.Physique = req.Physique.Length == 0 ? null : req.Physique;
            if (req.SexualPreference != null) user.SexualPreference = req.SexualPreference.Length == 0 ? null : req.SexualPreference;
            if (req.ComfortWithIntimacy != null) user.ComfortWithIntimacy = req.ComfortWithIntimacy.Length == 0 ? null : req.ComfortWithIntimacy;

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

    public async Task<(string? OldAudioBioUrl, UserProfileResponse Profile)> SetAudioBioUrlAsync(Guid userId, string? url)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("profile.set_audio_bio_url");
        activity?.SetTag("enduser.id", userId);

        var user = await _db.Users
            .Include(u => u.Photos)
            .Include(u => u.Videos)
            .Include(u => u.Interests)
            .Include(u => u.RedFlags)
            .Include(u => u.Couple)
                .ThenInclude(c => c!.Members)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        var oldUrl = user.AudioBioUrl;
        user.AudioBioUrl = url;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        Telemetry.ProfileOperations.Add(1,
            new KeyValuePair<string, object?>("operation", "set_audio_bio_url"),
            new KeyValuePair<string, object?>("outcome", "success"));
        Telemetry.MarkSuccess(activity);
        return (oldUrl, UserMapper.ToProfileResponse(user));
    }

    public async Task<(string? OldVideoBioUrl, UserProfileResponse Profile)> SetVideoBioUrlAsync(Guid userId, string? url)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("profile.set_video_bio_url");
        activity?.SetTag("enduser.id", userId);

        var user = await _db.Users
            .Include(u => u.Photos)
            .Include(u => u.Videos)
            .Include(u => u.Interests)
            .Include(u => u.RedFlags)
            .Include(u => u.Couple)
                .ThenInclude(c => c!.Members)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        var orderedVideos = user.Videos
            .OrderBy(v => v.SortOrder)
            .ThenBy(v => v.CreatedAt)
            .ToList();
        var primaryVideo = orderedVideos.FirstOrDefault();
        var oldUrl = primaryVideo?.Url ?? user.VideoBioUrl;

        if (string.IsNullOrWhiteSpace(url))
        {
            if (primaryVideo != null)
            {
                _db.UserVideos.Remove(primaryVideo);
                orderedVideos.Remove(primaryVideo);
            }
        }
        else if (primaryVideo == null)
        {
            primaryVideo = new UserVideo
            {
                UserId = userId,
                Url = url,
                SortOrder = 0
            };
            user.Videos.Add(primaryVideo);
            _db.UserVideos.Add(primaryVideo);
            orderedVideos.Insert(0, primaryVideo);
        }
        else
        {
            primaryVideo.Url = url;
        }

        SyncVideoState(user, orderedVideos);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        Telemetry.ProfileOperations.Add(1,
            new KeyValuePair<string, object?>("operation", "set_video_bio_url"),
            new KeyValuePair<string, object?>("outcome", "success"));
        Telemetry.MarkSuccess(activity);
        return (oldUrl, UserMapper.ToProfileResponse(user));
    }

    public async Task<PhotoResponse> AddPhotoAsync(Guid userId, string url)
    {
        var user = await _db.Users
            .Include(u => u.Photos)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        var customPhotos = user.Photos
            .Where(p => p.Url != DefaultProfilePhoto.DataUrl)
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.CreatedAt)
            .ToList();

        if (customPhotos.Count >= AppConstants.MaxPhotos)
            throw new InvalidOperationException($"You can upload up to {AppConstants.MaxPhotos} profile images.");

        var defaultPhotos = user.Photos.Where(p => p.Url == DefaultProfilePhoto.DataUrl).ToList();
        if (defaultPhotos.Count > 0)
        {
            _db.UserPhotos.RemoveRange(defaultPhotos);
            foreach (var defaultPhoto in defaultPhotos)
            {
                user.Photos.Remove(defaultPhoto);
            }
        }

        for (var index = 0; index < customPhotos.Count; index++)
        {
            customPhotos[index].SortOrder = index;
        }

        var photo = new UserPhoto
        {
            UserId = userId,
            Url = url,
            SortOrder = customPhotos.Count
        };

        user.Photos.Add(photo);
        _db.UserPhotos.Add(photo);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new PhotoResponse(photo.Id, photo.Url, photo.SortOrder);
    }

    public async Task<string?> DeletePhotoAsync(Guid userId, Guid photoId)
    {
        var user = await _db.Users
            .Include(u => u.Photos)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        var photo = user.Photos.FirstOrDefault(p => p.Id == photoId)
            ?? throw new KeyNotFoundException("Photo not found.");

        var deletedUrl = photo.Url == DefaultProfilePhoto.DataUrl ? null : photo.Url;
        _db.UserPhotos.Remove(photo);
        user.Photos.Remove(photo);

        var remainingCustomPhotos = user.Photos
            .Where(p => p.Url != DefaultProfilePhoto.DataUrl)
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.CreatedAt)
            .ToList();

        if (remainingCustomPhotos.Count == 0)
        {
            var defaultPhoto = DefaultProfilePhoto.Create(userId);
            user.Photos.Add(defaultPhoto);
            _db.UserPhotos.Add(defaultPhoto);
        }
        else
        {
            for (var index = 0; index < remainingCustomPhotos.Count; index++)
            {
                remainingCustomPhotos[index].SortOrder = index;
            }
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return deletedUrl;
    }

    public async Task<VideoResponse> AddVideoAsync(Guid userId, string url)
    {
        var user = await _db.Users
            .Include(u => u.Videos)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        var orderedVideos = user.Videos
            .OrderBy(v => v.SortOrder)
            .ThenBy(v => v.CreatedAt)
            .ToList();

        if (orderedVideos.Count >= AppConstants.MaxVideos)
            throw new InvalidOperationException($"You can upload up to {AppConstants.MaxVideos} profile videos.");

        for (var index = 0; index < orderedVideos.Count; index++)
        {
            orderedVideos[index].SortOrder = index;
        }

        var video = new UserVideo
        {
            UserId = userId,
            Url = url,
            SortOrder = orderedVideos.Count
        };

        user.Videos.Add(video);
        _db.UserVideos.Add(video);
        orderedVideos.Add(video);
        SyncVideoState(user, orderedVideos);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new VideoResponse(video.Id, video.Url, video.SortOrder);
    }

    public async Task<string?> DeleteVideoAsync(Guid userId, Guid videoId)
    {
        var user = await _db.Users
            .Include(u => u.Videos)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        var video = user.Videos.FirstOrDefault(v => v.Id == videoId)
            ?? throw new KeyNotFoundException("Video not found.");

        var deletedUrl = video.Url;
        _db.UserVideos.Remove(video);
        user.Videos.Remove(video);

        var orderedVideos = user.Videos
            .OrderBy(v => v.SortOrder)
            .ThenBy(v => v.CreatedAt)
            .ToList();
        SyncVideoState(user, orderedVideos);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return deletedUrl;
    }

    public async Task DeleteAccountAsync(Guid userId)    {
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

    private static void SyncVideoState(User user, List<UserVideo> orderedVideos)
    {
        for (var index = 0; index < orderedVideos.Count; index++)
        {
            orderedVideos[index].SortOrder = index;
        }

        user.VideoBioUrl = orderedVideos.FirstOrDefault()?.Url;
    }
}
