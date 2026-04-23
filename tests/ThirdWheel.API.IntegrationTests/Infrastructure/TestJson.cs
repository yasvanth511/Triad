using System.Text.Json;

namespace ThirdWheel.API.IntegrationTests.Infrastructure;

internal static class TestJson
{
    public static readonly JsonSerializerOptions Default = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };
}
