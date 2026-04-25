# SEC-007: Protect Verification Provider Tokens and Sensitive JSON

## Risk Level
High

## Security Area
Data Security

## Problem
Verification attempts and events persist request/result/state JSON as plaintext `text` columns. The completion request can include provider tokens, phone numbers, social account IDs, partner user IDs, and provider references.

## Why This Matters
Verification data can include high-value provider tokens and sensitive identity/contact attributes. Storing raw payloads increases exposure from database read access, backups, logs, exports, and admin tooling.

## Evidence From Code
- `backend/ThirdWheel.API/DTOs/VerificationDtos.cs`
  - `ProviderToken`
  - `PhoneNumber`
  - `PartnerUserId`
  - `SocialAccountId`
  - `ProviderReference`
- `backend/ThirdWheel.API/Models/Verification.cs`
  - `UserVerification.StateJson`
  - `VerificationAttempt.RequestJson`
  - `VerificationAttempt.ResultJson`
  - `VerificationEvent.DataJson`
- `backend/ThirdWheel.API/Data/AppDbContext.cs` maps these fields as `text`.
- `backend/ThirdWheel.API/Services/Verification/VerificationService.cs`
  - `attempt.RequestJson = SerializePayload(request);`
  - `attempt.ResultJson = providerResult.ResultJson;`
  - event `DataJson` receives provider result JSON/state JSON.

## Recommended Fix
Minimize stored verification payloads. Do not persist provider tokens. Encrypt required sensitive verification state at rest with managed keys, or store only normalized non-sensitive status fields and external references.

## Implementation Steps
1. Classify each verification field as required, sensitive, or discardable.
2. Stop storing `ProviderToken` and other one-time tokens in `RequestJson`.
3. Redact or hash sensitive identifiers where exact recovery is not needed.
4. Encrypt any required sensitive JSON payloads using a managed key strategy.
5. Add retention limits for verification attempt/event payloads.
6. Ensure responses do not expose provider tokens or raw provider payloads.

## Acceptance Criteria
- Provider tokens are never stored in plaintext.
- Phone/social/partner identity fields are minimized, redacted, hashed, or encrypted.
- Verification JSON columns contain only approved data classes.
- Sensitive verification payloads have a documented retention strategy.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
This task does not evaluate external verification provider correctness, only local storage/data protection.
