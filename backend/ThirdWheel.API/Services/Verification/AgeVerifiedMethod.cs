using ThirdWheel.API.Data;

namespace ThirdWheel.API.Services.Verification;

public sealed class AgeVerifiedMethod : SessionVerificationMethodBase
{
    public AgeVerifiedMethod(AppDbContext db, ISessionVerificationVendor vendor)
        : base(db, vendor)
    {
    }

    protected override string SessionPrefix => "age";
    protected override string FailureReason => "Age verification failed.";

    public override VerificationMethodDefinition Definition { get; } = new(
        "age_verified",
        "Age Verified",
        ["badge", "reverification", "expiration"]);
}
