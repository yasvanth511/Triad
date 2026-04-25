# SEC-013: Minimize Sensitive Telemetry and Exception Detail

## Risk Level
Medium

## Security Area
Data Security

## Problem
Telemetry records exception messages and several user or file identifiers. OpenTelemetry logging is configured to include formatted messages, scopes, and parsed state values.

## Why This Matters
Telemetry pipelines often leave the application trust boundary. Exception messages, usernames, user IDs, target IDs, match IDs, report reasons, and uploaded filenames can expose sensitive operational or personal data.

## Evidence From Code
- `backend/ThirdWheel.API/Telemetry.cs`
  - `RecordException` calls `activity.SetStatus(ActivityStatusCode.Error, exception.Message)`.
  - `activity.RecordException(exception)`.
- `backend/ThirdWheel.API/Program.cs`
  - OpenTelemetry logging sets `IncludeFormattedMessage = true`, `IncludeScopes = true`, and `ParseStateValues = true`.
  - ASP.NET Core instrumentation uses `RecordException = true`.
- Examples of sensitive tags:
  - `AuthService.cs`: `enduser.alias` from registration username.
  - `ProfileService.cs`, `MatchingService.cs`, `SafetyService.cs`, `MessagingService.cs`: user IDs and target IDs.
  - `ImageService.cs`: uploaded original file name, content type, and size.
  - `SafetyService.cs`: report reason.

## Recommended Fix
Define a telemetry data classification policy and remove or hash sensitive identifiers. Avoid using raw exception messages as span status descriptions in production.

## Implementation Steps
1. Inventory telemetry tags and classify each as safe, sensitive, or prohibited.
2. Remove raw usernames, uploaded filenames, report reasons, and unnecessary target identifiers.
3. Hash or otherwise pseudonymize required correlation IDs.
4. Change exception status descriptions to generic values in production.
5. Configure OpenTelemetry logging to avoid formatted message/scope/state capture if it can include sensitive data.

## Acceptance Criteria
- Telemetry does not contain raw usernames, uploaded filenames, report details, tokens, or precise private profile details.
- Exception messages are not exported as raw status descriptions in production.
- Required correlation IDs are minimized or pseudonymized.
- OpenTelemetry logging configuration matches the data classification policy.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
This task is code/config hardening for telemetry privacy and secret leakage reduction.
