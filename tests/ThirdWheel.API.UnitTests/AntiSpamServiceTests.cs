using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Services;
using ThirdWheel.API.Tests;

namespace ThirdWheel.API.UnitTests;

public class AntiSpamServiceTests
{
    [Fact]
    public async Task CheckMessageAsync_BansUser_AfterThreeSpamStrikes()
    {
        await using var testDb = await SqliteTestDb.CreateAsync();
        await using var db = testDb.CreateContext();

        var user = TestData.CreateUser("Spammer");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new AntiSpamService(db);

        for (var strike = 1; strike <= 3; strike++)
        {
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.CheckMessageAsync(user.Id, Guid.NewGuid(), "DM me on telegram"));

            if (strike == 1)
            {
                Assert.Contains("Warning", exception.Message, StringComparison.OrdinalIgnoreCase);
            }
            else if (strike == 2)
            {
                Assert.Contains("throttled", exception.Message, StringComparison.OrdinalIgnoreCase);
            }
            else
            {
                Assert.Contains("suspended", exception.Message, StringComparison.OrdinalIgnoreCase);
            }
        }

        Assert.Equal(3, await db.SpamWarnings.CountAsync(s => s.UserId == user.Id));
        Assert.True(await db.Users.Where(u => u.Id == user.Id).Select(u => u.IsBanned).SingleAsync());
    }

    [Fact]
    public void ValidateProfileContent_RejectsExternalLinks()
    {
        var service = new AntiSpamService(null!);

        var exception = Assert.Throws<InvalidOperationException>(() =>
            service.ValidateProfileContent("Find me at https://example.com"));

        Assert.Equal("External links are not allowed in profiles.", exception.Message);
    }
}
