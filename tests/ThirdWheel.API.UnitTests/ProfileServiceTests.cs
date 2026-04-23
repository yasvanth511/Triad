using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Helpers;
using ThirdWheel.API.Services;
using ThirdWheel.API.Tests;

namespace ThirdWheel.API.UnitTests;

public class ProfileServiceTests
{
    [Fact]
    public async Task DeletePhotoAsync_RestoresDefaultPhoto_WhenLastCustomPhotoIsRemoved()
    {
        await using var testDb = await SqliteTestDb.CreateAsync();
        await using var db = testDb.CreateContext();

        var user = TestData.CreateUser("Ava");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new ProfileService(db);
        var photo = await service.AddPhotoAsync(user.Id, "/uploads/ava.jpg");

        var deletedUrl = await service.DeletePhotoAsync(user.Id, photo.Id);

        Assert.Equal("/uploads/ava.jpg", deletedUrl);

        var photos = await db.UserPhotos
            .Where(p => p.UserId == user.Id)
            .OrderBy(p => p.SortOrder)
            .ToListAsync();

        Assert.Single(photos);
        Assert.Equal(DefaultProfilePhoto.DataUrl, photos[0].Url);
        Assert.Equal(0, photos[0].SortOrder);
    }

    [Fact]
    public async Task SetVideoBioUrlAsync_KeepsVideoCollectionInSync()
    {
        await using var testDb = await SqliteTestDb.CreateAsync();
        await using var db = testDb.CreateContext();

        var user = TestData.CreateUser("Milo");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new ProfileService(db);

        var created = await service.SetVideoBioUrlAsync(user.Id, "/uploads/video/intro.mp4");
        Assert.Equal("/uploads/video/intro.mp4", created.Profile.VideoBioUrl);
        Assert.Single(await db.UserVideos.Where(v => v.UserId == user.Id).ToListAsync());

        var replaced = await service.SetVideoBioUrlAsync(user.Id, "/uploads/video/updated.mp4");
        Assert.Equal("/uploads/video/intro.mp4", replaced.OldVideoBioUrl);
        Assert.Equal("/uploads/video/updated.mp4", replaced.Profile.VideoBioUrl);

        var removed = await service.SetVideoBioUrlAsync(user.Id, null);
        Assert.Equal("/uploads/video/updated.mp4", removed.OldVideoBioUrl);
        Assert.Null(removed.Profile.VideoBioUrl);
        Assert.Empty(await db.UserVideos.Where(v => v.UserId == user.Id).ToListAsync());
    }
}
