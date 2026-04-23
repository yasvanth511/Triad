using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ThirdWheel.API.Data;
using ThirdWheel.API.Hubs;

namespace ThirdWheel.API.IntegrationTests.Infrastructure;

public sealed class TestApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const string JwtKey = "0123456789ABCDEF0123456789ABCDEF";
    private const string JwtIssuer = "ThirdWheel.API.Tests";
    private const string JwtAudience = "ThirdWheel.Tests";
    private const string DefaultConnection = "Host=test;Database=test";

    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private readonly string _contentRoot = Path.Combine(Path.GetTempPath(), "triad-api-tests", Guid.NewGuid().ToString("N"));
    private string? _originalJwtKey;
    private string? _originalJwtIssuer;
    private string? _originalJwtAudience;
    private string? _originalDefaultConnection;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseContentRoot(_contentRoot);

        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "0123456789ABCDEF0123456789ABCDEF",
                ["Jwt:Issuer"] = "ThirdWheel.API.Tests",
                ["Jwt:Audience"] = "ThirdWheel.Tests",
                ["ConnectionStrings:DefaultConnection"] = "Host=test;Database=test"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.AddDbContextPool<AppDbContext>(options => options.UseSqlite(_connection));

            services.RemoveAll<IHubContext<ChatHub>>();
            services.AddSingleton<IHubContext<ChatHub>, NullHubContext<ChatHub>>();

            using var provider = services.BuildServiceProvider();
            using var scope = provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }

    public async Task InitializeAsync()
    {
        Directory.CreateDirectory(_contentRoot);
        _originalJwtKey = Environment.GetEnvironmentVariable("Jwt__Key");
        _originalJwtIssuer = Environment.GetEnvironmentVariable("Jwt__Issuer");
        _originalJwtAudience = Environment.GetEnvironmentVariable("Jwt__Audience");
        _originalDefaultConnection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        Environment.SetEnvironmentVariable("Jwt__Key", JwtKey);
        Environment.SetEnvironmentVariable("Jwt__Issuer", JwtIssuer);
        Environment.SetEnvironmentVariable("Jwt__Audience", JwtAudience);
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", DefaultConnection);

        await _connection.OpenAsync();
        await ResetStateAsync();
    }

    public new async Task DisposeAsync()
    {
        await _connection.DisposeAsync();
        Environment.SetEnvironmentVariable("Jwt__Key", _originalJwtKey);
        Environment.SetEnvironmentVariable("Jwt__Issuer", _originalJwtIssuer);
        Environment.SetEnvironmentVariable("Jwt__Audience", _originalJwtAudience);
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", _originalDefaultConnection);

        if (Directory.Exists(_contentRoot))
        {
            Directory.Delete(_contentRoot, recursive: true);
        }
    }

    public async Task ResetStateAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();

        var uploadsPath = Path.Combine(_contentRoot, "uploads");
        if (Directory.Exists(uploadsPath))
        {
            Directory.Delete(uploadsPath, recursive: true);
        }

        Directory.CreateDirectory(uploadsPath);
        Directory.CreateDirectory(Path.Combine(uploadsPath, "audio"));
        Directory.CreateDirectory(Path.Combine(uploadsPath, "video"));
    }

    public async Task<T> WithDbContextAsync<T>(Func<AppDbContext, Task<T>> action)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await action(db);
    }
}
