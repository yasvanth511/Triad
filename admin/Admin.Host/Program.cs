using System.Net;
using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient("AdminApiProxy");

var app = builder.Build();

var apiBaseUrl = ResolveApiBaseUrl(app.Configuration, app.Environment);

app.MapMethods("/api/{**path}", new[] { "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" }, async (
    HttpContext context,
    IHttpClientFactory httpClientFactory,
    string? path) =>
{
    using var requestMessage = CreateProxyRequest(context, apiBaseUrl, path);
    var client = httpClientFactory.CreateClient("AdminApiProxy");

    try
    {
        using var responseMessage = await client.SendAsync(
            requestMessage,
            HttpCompletionOption.ResponseHeadersRead,
            context.RequestAborted);

        await CopyProxyResponse(context, responseMessage);
    }
    catch (HttpRequestException)
    {
        context.Response.StatusCode = StatusCodes.Status502BadGateway;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            error = "Admin API proxy could not reach the backend API."
        });
    }
});

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        context.Context.Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        context.Context.Response.Headers.Pragma = "no-cache";
        context.Context.Response.Headers.Expires = "0";
    }
});
app.MapFallbackToFile("index.html");

app.Run();

static string ResolveApiBaseUrl(IConfiguration configuration, IWebHostEnvironment environment)
{
    var configured = configuration["Admin:ApiBaseUrl"];
    if (!string.IsNullOrWhiteSpace(configured))
    {
        return configured.TrimEnd('/');
    }

    return environment.IsDevelopment()
        ? "http://localhost:5127"
        : "http://api:5000";
}

static HttpRequestMessage CreateProxyRequest(HttpContext context, string apiBaseUrl, string? path)
{
    var pathAndQuery = string.IsNullOrWhiteSpace(path)
        ? context.Request.QueryString.Value ?? string.Empty
        : $"/{path}{context.Request.QueryString.Value}";

    var targetUri = new Uri($"{apiBaseUrl}/api{pathAndQuery}");
    var requestMessage = new HttpRequestMessage(new HttpMethod(context.Request.Method), targetUri);

    if (context.Request.ContentLength > 0 || context.Request.Headers.ContainsKey("Transfer-Encoding"))
    {
        requestMessage.Content = new StreamContent(context.Request.Body);

        if (!string.IsNullOrWhiteSpace(context.Request.ContentType))
        {
            requestMessage.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(context.Request.ContentType);
        }
    }

    foreach (var header in context.Request.Headers)
    {
        if (header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase))
        {
            continue;
        }

        if (!requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()))
        {
            requestMessage.Content?.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }
    }

    return requestMessage;
}

static async Task CopyProxyResponse(HttpContext context, HttpResponseMessage responseMessage)
{
    context.Response.StatusCode = (int)responseMessage.StatusCode;

    foreach (var header in responseMessage.Headers)
    {
        context.Response.Headers[header.Key] = header.Value.ToArray();
    }

    foreach (var header in responseMessage.Content.Headers)
    {
        context.Response.Headers[header.Key] = header.Value.ToArray();
    }

    context.Response.Headers.Remove("transfer-encoding");
    await responseMessage.Content.CopyToAsync(context.Response.Body);
}
