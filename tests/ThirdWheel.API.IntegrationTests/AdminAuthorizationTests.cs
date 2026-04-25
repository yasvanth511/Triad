using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.IntegrationTests.Infrastructure;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.IntegrationTests;

public class AdminAuthorizationTests : IClassFixture<TestApiFactory>
{
    private const string AdminUsername = "auth-test-admin";
    private const string AdminPassword = "Admin@Test123!";

    private readonly TestApiFactory _factory;

    public AdminAuthorizationTests(TestApiFactory factory)
    {
        _factory = factory;
    }

    public static IEnumerable<object[]> AdminRoutesWithoutId =>
    [
        ["/api/admin/users"],
        ["/api/admin/online-users"],
        ["/api/admin/moderation-analytics"],
    ];

    [Theory]
    [MemberData(nameof(AdminRoutesWithoutId))]
    public async Task Admin_Read_Endpoints_Return_401_Without_Token(string route)
    {
        await _factory.ResetStateAsync();

        var client = _factory.CreateClient();
        var response = await client.GetAsync(route);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetUserDetail_Returns_401_Without_Token()
    {
        await _factory.ResetStateAsync();

        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/admin/users/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [MemberData(nameof(AdminRoutesWithoutId))]
    public async Task Admin_Read_Endpoints_Return_200_With_Admin_Jwt(string route)
    {
        await _factory.ResetStateAsync();
        var token = await SeedAdminAndLoginAsync();

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.GetAsync(route);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetUserDetail_Returns_200_With_Admin_Jwt()
    {
        await _factory.ResetStateAsync();

        var registerClient = _factory.CreateClient();
        var registerResponse = await registerClient.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Username: "admindetailtarget",
            Email: "admindetailtarget@example.com",
            Password: "Password123!"));
        registerResponse.EnsureSuccessStatusCode();
        var auth = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>(TestJson.Default);
        Assert.NotNull(auth);

        var token = await SeedAdminAndLoginAsync();

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.GetAsync($"/api/admin/users/{auth.User.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<string> SeedAdminAndLoginAsync()
    {
        await _factory.WithDbContextAsync(async db =>
        {
            db.AdminUsers.Add(new AdminUser
            {
                Username = AdminUsername,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(AdminPassword)
            });
            await db.SaveChangesAsync();
            return 0;
        });

        var loginClient = _factory.CreateClient();
        var loginResponse = await loginClient.PostAsJsonAsync(
            "/api/admin/auth/login",
            new AdminLoginRequest(AdminUsername, AdminPassword));
        loginResponse.EnsureSuccessStatusCode();

        var payload = await loginResponse.Content.ReadFromJsonAsync<AdminLoginPayload>(TestJson.Default);
        Assert.NotNull(payload);
        Assert.False(string.IsNullOrWhiteSpace(payload.Token));
        return payload.Token;
    }

    private sealed record AdminLoginPayload(string Token);
}
