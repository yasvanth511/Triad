using System.Reflection;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using ThirdWheel.API;
using ThirdWheel.API.Data;
using ThirdWheel.API.Hubs;
using ThirdWheel.API.Services;

var builder = WebApplication.CreateBuilder(args);
var serviceVersion = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0";
var enableConsoleExporter = builder.Environment.IsDevelopment()
    || string.Equals(builder.Configuration["OpenTelemetry:UseConsoleExporter"], "true", StringComparison.OrdinalIgnoreCase);
var hasOtlpEndpoint = !string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"])
    || !string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"])
    || !string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_METRICS_ENDPOINT"])
    || !string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_LOGS_ENDPOINT"]);

var resourceBuilder = ResourceBuilder.CreateDefault()
    .AddService(serviceName: Telemetry.ServiceName, serviceVersion: serviceVersion)
    .AddAttributes(new Dictionary<string, object>
    {
        ["deployment.environment.name"] = builder.Environment.EnvironmentName
    });

// ── Validate required secrets at startup ─────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException(
        "Jwt:Key is missing or too short. Set it via the Jwt__Key environment variable (>= 32 chars).");

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException(
        "DefaultConnection is missing. Set it via ConnectionStrings__DefaultConnection.");

// ── Database (pooled for lower connection-acquisition overhead) ──────────────
builder.Services.AddDbContextPool<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ── JWT Authentication ───────────────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromSeconds(30), // tighten from the default 5 min
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey))
        };

        // SignalR token from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/chat"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("postgres");

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<CoupleService>();
builder.Services.AddScoped<DiscoveryService>();
builder.Services.AddScoped<MatchingService>();
builder.Services.AddScoped<MessagingService>();
builder.Services.AddScoped<SafetyService>();
builder.Services.AddScoped<AntiSpamService>();
builder.Services.AddScoped<EventService>();
builder.Services.AddSingleton<ImageService>();

// Controllers + SignalR
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();

builder.Logging.AddOpenTelemetry(options =>
{
    options.SetResourceBuilder(resourceBuilder);
    options.IncludeFormattedMessage = true;
    options.IncludeScopes = true;
    options.ParseStateValues = true;

    if (enableConsoleExporter)
    {
        options.AddConsoleExporter();
    }

    if (hasOtlpEndpoint)
    {
        options.AddOtlpExporter();
    }
});

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource =>
        resource.AddService(serviceName: Telemetry.ServiceName, serviceVersion: serviceVersion)
            .AddAttributes(new Dictionary<string, object>
            {
                ["deployment.environment.name"] = builder.Environment.EnvironmentName
            }))
    .WithTracing(tracing =>
    {
        tracing
            .AddSource(Telemetry.ActivitySource.Name)
            .AddAspNetCoreInstrumentation(options => options.RecordException = true)
            .AddHttpClientInstrumentation()
            .AddEntityFrameworkCoreInstrumentation();

        if (enableConsoleExporter)
        {
            tracing.AddConsoleExporter();
        }

        if (hasOtlpEndpoint)
        {
            tracing.AddOtlpExporter();
        }
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddMeter(Telemetry.Meter.Name)
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation();

        if (enableConsoleExporter)
        {
            metrics.AddConsoleExporter();
        }

        if (hasOtlpEndpoint)
        {
            metrics.AddOtlpExporter();
        }
    });

// ── CORS (origin-locked) ─────────────────────────────────────────────────────
// Origins are configured via Cors:AllowedOrigins (comma-separated) or env var Cors__AllowedOrigins.
var corsOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("MobileApp", policy =>
    {
        if (builder.Environment.IsDevelopment() || corsOrigins.Length == 0)
        {
            // Development-only: allow any origin so local simulators/Expo tunnels work.
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

// ── Rate Limiting ─────────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    // Global sliding-window: 120 requests / 60 s per IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetSlidingWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromSeconds(60),
                SegmentsPerWindow = 6,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Stricter auth policy: 10 attempts / 60 s per IP (brute-force protection)
    options.AddSlidingWindowLimiter("auth", o =>
    {
        o.PermitLimit = 10;
        o.Window = TimeSpan.FromSeconds(60);
        o.SegmentsPerWindow = 6;
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

var app = builder.Build();

// Auto-migrate in development
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Auto-migration failed — database may be unreachable. App will still start.");
    }
}

// Redirect HTTP → HTTPS in non-development environments
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseRateLimiter();
app.UseCors("MobileApp");
app.UseAuthentication();
app.UseAuthorization();

// Serve uploaded photos (local disk — swap for CDN/blob storage in production)
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.MapHealthChecks("/health", new HealthCheckOptions());
// Apply auth-specific rate limit policy to auth endpoints
app.MapControllers().RequireRateLimiting("auth");
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
