using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Data;

namespace ThirdWheel.API.Services.Verification;

public sealed class CoupleVerifiedMethod : SessionVerificationMethodBase
{
    private const string MissingPartnerReason = "Couple verification requires a valid acknowledged partner in the same couple.";

    public CoupleVerifiedMethod(AppDbContext db, ISessionVerificationVendor vendor)
        : base(db, vendor)
    {
    }

    protected override string SessionPrefix => "couple";
    protected override string FailureReason => "Couple verification failed.";

    public override VerificationMethodDefinition Definition { get; } = new(
        "couple_verified",
        "Couple Verified",
        ["badge", "couple"]);

    public override async Task<VerificationEligibilityResult> EvaluateEligibilityAsync(
        VerificationEligibilityContext context,
        CancellationToken cancellationToken = default)
    {
        var user = await Db.Users
            .AsNoTracking()
            .Where(u => u.Id == context.UserId)
            .Select(u => new { u.Id, u.IsBanned, u.CoupleId })
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null || user.IsBanned)
        {
            return new VerificationEligibilityResult(false, "User is not eligible.");
        }

        if (!user.CoupleId.HasValue)
        {
            return new VerificationEligibilityResult(false, "User is not in a couple.");
        }

        var couple = await Db.Couples
            .AsNoTracking()
            .Where(c => c.Id == user.CoupleId.Value)
            .Select(c => new
            {
                c.IsComplete,
                MemberCount = c.Members.Count
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (couple == null || !couple.IsComplete || couple.MemberCount < 2)
        {
            return new VerificationEligibilityResult(false, "Couple is not complete.");
        }

        return new VerificationEligibilityResult(true);
    }

    public override async Task<VerificationProviderResult> CompleteAsync(
        VerificationCompletionContext context,
        CancellationToken cancellationToken = default)
    {
        var providerResult = await base.CompleteAsync(context, cancellationToken);
        if (!string.Equals(providerResult.Decision, "verified", StringComparison.OrdinalIgnoreCase))
        {
            return providerResult;
        }

        if (!Guid.TryParse(context.Input.PartnerUserId, out var partnerUserId) || partnerUserId == context.UserId)
        {
            return CreateFailedResult(providerResult, context.Input.PartnerUserId, MissingPartnerReason);
        }

        var users = await Db.Users
            .AsNoTracking()
            .Where(u => u.Id == context.UserId || u.Id == partnerUserId)
            .Select(u => new { u.Id, u.IsBanned, u.CoupleId })
            .ToListAsync(cancellationToken);

        var currentUser = users.FirstOrDefault(u => u.Id == context.UserId);
        var partnerUser = users.FirstOrDefault(u => u.Id == partnerUserId);
        if (currentUser == null ||
            currentUser.IsBanned ||
            !currentUser.CoupleId.HasValue ||
            partnerUser == null ||
            partnerUser.IsBanned ||
            partnerUser.CoupleId != currentUser.CoupleId)
        {
            return CreateFailedResult(providerResult, context.Input.PartnerUserId, MissingPartnerReason);
        }

        var isComplete = await Db.Couples
            .AsNoTracking()
            .Where(c => c.Id == currentUser.CoupleId.Value)
            .Select(c => c.IsComplete && c.Members.Count >= 2)
            .FirstOrDefaultAsync(cancellationToken);

        return isComplete
            ? providerResult with
            {
                ResultJson = VerificationService.SerializePayload(new
                {
                    decision = providerResult.Decision,
                    providerReference = providerResult.ProviderReference,
                    partnerUserId = context.Input.PartnerUserId
                })
            }
            : CreateFailedResult(providerResult, context.Input.PartnerUserId, MissingPartnerReason);
    }

    private static VerificationProviderResult CreateFailedResult(
        VerificationProviderResult providerResult,
        string? partnerUserId,
        string failureReason)
    {
        return providerResult with
        {
            Decision = "failed",
            FailureReason = failureReason,
            ResultJson = VerificationService.SerializePayload(new
            {
                decision = "failed",
                providerReference = providerResult.ProviderReference,
                partnerUserId,
                failureReason
            })
        };
    }
}
