using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Helpers;

public static class UserMapper
{
    public static UserProfileResponse ToProfileResponse(User user) => new(
        user.Id,
        user.Username,
        user.Bio,
        user.AgeMin,
        user.AgeMax,
        user.Intent,
        user.LookingFor,
        user.Interests.Select(i => i.Tag).ToList(),
        user.Photos.OrderBy(p => p.SortOrder)
            .Select(p => new PhotoResponse(p.Id, p.Url, p.SortOrder)).ToList(),
        user.CoupleId,
        user.CoupleId != null,
        user.City,
        user.State,
        user.ZipCode,
        user.RadiusMiles
    );
}
