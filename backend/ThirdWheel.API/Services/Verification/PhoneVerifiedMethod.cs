using ThirdWheel.API.Data;

namespace ThirdWheel.API.Services.Verification;

public sealed class PhoneVerifiedMethod : SessionVerificationMethodBase
{
    private const string MissingPhoneNumberReason = "Phone verification requires a phone number.";

    public PhoneVerifiedMethod(AppDbContext db, ISessionVerificationVendor vendor)
        : base(db, vendor)
    {
    }

    protected override string SessionPrefix => "phone";
    protected override string FailureReason => "Phone verification failed.";

    public override VerificationMethodDefinition Definition { get; } = new(
        "phone_verified",
        "Phone Verified",
        ["badge", "phone"]);

    public override async Task<VerificationProviderResult> CompleteAsync(
        VerificationCompletionContext context,
        CancellationToken cancellationToken = default)
    {
        var providerResult = await base.CompleteAsync(context, cancellationToken);
        var phoneNumber = string.IsNullOrWhiteSpace(context.Input.PhoneNumber)
            ? null
            : context.Input.PhoneNumber.Trim();

        if (string.Equals(providerResult.Decision, "verified", StringComparison.OrdinalIgnoreCase) &&
            phoneNumber == null)
        {
            return providerResult with
            {
                Decision = "failed",
                FailureReason = MissingPhoneNumberReason,
                ResultJson = VerificationService.SerializePayload(new
                {
                    decision = "failed",
                    providerReference = providerResult.ProviderReference,
                    phoneNumber,
                    failureReason = MissingPhoneNumberReason
                })
            };
        }

        return providerResult with
        {
            ResultJson = VerificationService.SerializePayload(new
            {
                decision = providerResult.Decision,
                providerReference = providerResult.ProviderReference,
                phoneNumber,
                failureReason = providerResult.FailureReason
            })
        };
    }
}
