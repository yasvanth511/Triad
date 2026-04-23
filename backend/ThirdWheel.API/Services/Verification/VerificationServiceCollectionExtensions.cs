using ThirdWheel.API.Services.Verification;

namespace Microsoft.Extensions.DependencyInjection;

public static class VerificationServiceCollectionExtensions
{
    public static IServiceCollection AddVerificationFramework(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<VerificationOptions>(configuration.GetSection("Verification"));
        services.AddScoped<ISessionVerificationVendor, MockSessionVerificationVendor>();
        services.AddScoped<IVerificationMethod, LiveVerifiedMethod>();
        services.AddScoped<IVerificationMethod, AgeVerifiedMethod>();
        services.AddScoped<IVerificationMethod, PhoneVerifiedMethod>();
        services.AddScoped<IVerificationMethod, CoupleVerifiedMethod>();
        services.AddScoped<IVerificationMethod, PartnerConsentVerifiedMethod>();
        services.AddScoped<IVerificationMethod, IntentVerifiedMethod>();
        services.AddScoped<IVerificationMethod, InPersonVerifiedMethod>();
        services.AddScoped<IVerificationMethod, SocialVerifiedMethod>();
        services.AddScoped<VerificationRegistry>();
        services.AddScoped<VerificationService>();
        return services;
    }
}
