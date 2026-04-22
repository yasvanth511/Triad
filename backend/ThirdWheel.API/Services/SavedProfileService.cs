using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Helpers;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class SavedProfileService
{
    private readonly AppDbContext _db;

    public SavedProfileService(AppDbContext db) => _db = db;

    public async Task SaveProfileAsync(Guid userId, Guid targetUserId)
    {
        if (userId == targetUserId)
            throw new InvalidOperationException("Cannot save yourself.");

        var isBlocked = await _db.Blocks.AnyAsync(b =>
            (b.BlockerUserId == userId && b.BlockedUserId == targetUserId) ||
            (b.BlockerUserId == targetUserId && b.BlockedUserId == userId));
        if (isBlocked)
            throw new InvalidOperationException("Cannot interact with this user.");

        var targetExists = await _db.Users.AnyAsync(u => u.Id == targetUserId && !u.IsBanned);
        if (!targetExists)
            throw new KeyNotFoundException("User not found.");

        var alreadyLiked = await _db.Likes.AnyAsync(l => l.FromUserId == userId && l.ToUserId == targetUserId);
        if (alreadyLiked)
            throw new InvalidOperationException("Profile already liked.");

        var existingSave = await _db.SavedProfiles
            .AnyAsync(s => s.UserId == userId && s.SavedUserId == targetUserId);
        if (existingSave)
            throw new InvalidOperationException("Profile already saved.");

        _db.SavedProfiles.Add(new SavedProfile
        {
            UserId = userId,
            SavedUserId = targetUserId
        });

        await _db.SaveChangesAsync();
    }

    public async Task<List<SavedProfileResponse>> GetSavedProfilesAsync(Guid userId)
    {
        var currentUser = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        var blockedIds = await _db.Blocks
            .Where(b => b.BlockerUserId == userId || b.BlockedUserId == userId)
            .Select(b => b.BlockerUserId == userId ? b.BlockedUserId : b.BlockerUserId)
            .ToListAsync();

        var savedProfiles = await _db.SavedProfiles
            .Where(s => s.UserId == userId && !blockedIds.Contains(s.SavedUserId) && !s.SavedUser.IsBanned)
            .Include(s => s.SavedUser)
                .ThenInclude(u => u.Photos)
            .Include(s => s.SavedUser)
                .ThenInclude(u => u.Interests)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return savedProfiles.Select(saved =>
        {
            var profile = saved.SavedUser;
            double? distance = null;

            if (currentUser.Latitude.HasValue && currentUser.Longitude.HasValue
                && profile.Latitude.HasValue && profile.Longitude.HasValue)
            {
                distance = GeoUtils.DistanceKm(
                    currentUser.Latitude.Value, currentUser.Longitude.Value,
                    profile.Latitude.Value, profile.Longitude.Value);
            }

            return new SavedProfileResponse(
                profile.Id,
                profile.Username,
                profile.Bio,
                profile.AgeMin,
                profile.AgeMax,
                profile.Intent,
                profile.LookingFor,
                profile.Interests.Select(i => i.Tag).ToList(),
                profile.Photos.OrderBy(p => p.SortOrder)
                    .Select(p => new PhotoResponse(p.Id, p.Url, p.SortOrder))
                    .ToList(),
                profile.CoupleId != null,
                distance.HasValue ? Math.Round(distance.Value, 0) : null,
                profile.City,
                profile.State,
                saved.CreatedAt
            );
        }).ToList();
    }

    public async Task RemoveSavedProfileAsync(Guid userId, Guid targetUserId)
    {
        var savedProfile = await _db.SavedProfiles
            .FirstOrDefaultAsync(s => s.UserId == userId && s.SavedUserId == targetUserId);

        if (savedProfile == null)
            return;

        _db.SavedProfiles.Remove(savedProfile);
        await _db.SaveChangesAsync();
    }
}
