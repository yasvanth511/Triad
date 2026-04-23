using ThirdWheel.API.Helpers;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Tests;

internal static class TestData
{
    public static User CreateUser(
        string username,
        string? email = null,
        string bio = "Ready to meet people.",
        IEnumerable<string>? interests = null,
        Guid? coupleId = null,
        bool includeDefaultPhoto = true)
    {
        var user = new User
        {
            Username = username,
            Email = email ?? $"{username.ToLowerInvariant()}@example.com",
            PasswordHash = "hashed-password",
            Bio = bio,
            AgeMin = 25,
            AgeMax = 35,
            Intent = "Dating",
            LookingFor = "single",
            City = "Detroit",
            State = "MI",
            ZipCode = "48201",
            RadiusMiles = 25,
            CoupleId = coupleId
        };

        if (includeDefaultPhoto)
        {
            user.Photos.Add(DefaultProfilePhoto.Create(user.Id));
        }

        foreach (var interest in interests ?? Array.Empty<string>())
        {
            user.Interests.Add(new UserInterest
            {
                UserId = user.Id,
                Tag = interest
            });
        }

        return user;
    }
}
