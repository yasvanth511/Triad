using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Helpers;

public static class UserMapper
{
    public static UserProfileResponse ToProfileResponse(User user)
    {
        var couplePartnerName = user.Couple?.Members
            .FirstOrDefault(member => member.Id != user.Id)?.Username;

        return new UserProfileResponse(
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
            user.RadiusMiles,
            couplePartnerName,
            user.AudioBioUrl,
            user.VideoBioUrl,
            user.Videos.OrderBy(v => v.SortOrder)
                .Select(v => new VideoResponse(v.Id, v.Url, v.SortOrder)).ToList(),
            user.RedFlags.Select(r => r.Tag).ToList(),
            user.InterestedIn,
            user.Neighborhood,
            user.Ethnicity,
            user.Religion,
            user.RelationshipType,
            user.Height,
            user.Children,
            user.FamilyPlans,
            user.Drugs,
            user.Smoking,
            user.Marijuana,
            user.Drinking,
            user.Politics,
            user.EducationLevel,
            user.Weight,
            user.Physique,
            user.SexualPreference,
            user.ComfortWithIntimacy
        );
    }
}
