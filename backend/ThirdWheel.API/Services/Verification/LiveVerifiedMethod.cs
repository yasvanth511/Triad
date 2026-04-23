using ThirdWheel.API.Data;

namespace ThirdWheel.API.Services.Verification;

public sealed class LiveVerifiedMethod : SessionVerificationMethodBase
{
    public LiveVerifiedMethod(AppDbContext db, ISessionVerificationVendor vendor)
        : base(db, vendor)
    {
    }

    protected override string SessionPrefix => "live";
    protected override string FailureReason => "Live verification failed.";

    public override VerificationMethodDefinition Definition { get; } = new(
        "live_verified",
        "Live Verified",
        ["badge", "reverification", "expiration"]);
}
