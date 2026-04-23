using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;

namespace ThirdWheel.API.Tests;

internal sealed class SqliteTestDb : IAsyncDisposable
{
    private readonly SqliteConnection _connection;

    private SqliteTestDb(SqliteConnection connection)
    {
        _connection = connection;
    }

    public static async Task<SqliteTestDb> CreateAsync()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        await using var context = CreateContext(connection);
        await context.Database.EnsureCreatedAsync();

        return new SqliteTestDb(connection);
    }

    public AppDbContext CreateContext()
    {
        return CreateContext(_connection);
    }

    public async ValueTask DisposeAsync()
    {
        await _connection.DisposeAsync();
    }

    private static AppDbContext CreateContext(SqliteConnection connection)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .EnableSensitiveDataLogging()
            .Options;

        return new AppDbContext(options);
    }
}
