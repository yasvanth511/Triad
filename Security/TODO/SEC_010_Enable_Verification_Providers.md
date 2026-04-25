# SEC_010 — Enable Production Verification Providers

**Severity:** HIGH  
**SOC 2 Criteria:** CC6.2, PI1.2  
**Status:** Open  
**Effort:** Large (varies by provider — 1–2 weeks per method)

---

## Problem

All eight verification methods are currently configured in mock mode:

```json
// appsettings.json
"VerificationMethods": {
  "live_verified":           { "Enabled": true, "Settings": { "mode": "mock" } },
  "age_verified":            { "Enabled": true, "Settings": { "mode": "mock" } },
  "phone_verified":          { "Enabled": true, "Settings": { "mode": "mock" } },
  "couple_verified":         { "Enabled": true, "Settings": { "mode": "mock" } },
  "partner_consent_verified":{ "Enabled": true, "Settings": { "mode": "mock" } },
  "intent_verified":         { "Enabled": true, "Settings": { "mode": "mock" } },
  "in_person_verified":      { "Enabled": true, "Settings": { "mode": "mock" } },
  "social_verified":         { "Enabled": true, "Settings": { "mode": "mock" } }
}
```

In mock mode, any verification attempt automatically succeeds. This means:

- Verification badges are meaningless in production — any user can claim any badge.
- The trust layer that is central to the product promise is not functioning.
- Age verification, which is a legal compliance requirement for an adult dating app, is not enforced.

## Fix

### Priority Order

1. **Phone verification** — fastest to implement; use Twilio Verify or AWS SNS OTP.
2. **Age verification** — legal requirement; use Onfido, Veriff, or Stripe Identity.
3. **Live verification** (liveness check) — use Jumio or Veriff liveness module.
4. **Social verification** — OAuth integration with a social provider (Instagram, LinkedIn).
5. **Couple / Partner consent** — internal flow; can use email confirmation link.

### Implementation Steps per Method

1. Select a vendor for each method and execute a vendor security review.
2. Store vendor API keys in the secrets vault (SEC_002), not in `appsettings.json`.
3. Implement the real provider class (replacing or extending the mock class) using the vendor SDK.
4. Switch `"mode": "mock"` to `"mode": "production"` in production configuration only.
5. Keep `"mode": "mock"` available for development and test environments.
6. Add rate limiting on verification attempt endpoints (currently no per-endpoint limit).
7. Document the vendor as a third-party processor in the Data Security doc.

### Age Verification — Legal Note

If the platform is available in any jurisdiction with an age verification law (e.g., US states with age-gate requirements for adult content, or EU DSA requirements), age verification must be enforced — not optional. Consult legal counsel before shipping.

### Secrets Required (per method)

| Method | Vendor Credential Keys (examples) |
|---|---|
| Phone | `Twilio__AccountSid`, `Twilio__AuthToken`, `Twilio__VerifyServiceSid` |
| Age / Live | `Veriff__ApiKey`, `Veriff__ApiSecret` |
| Social | `OAuth__ClientId`, `OAuth__ClientSecret` |

All must be environment variables only (never in `appsettings.json`).

## Files To Edit

- `backend/ThirdWheel.API/Services/Verification/` — implement real provider classes
- `backend/ThirdWheel.API/appsettings.json` — document `mode` options; default to `disabled` not `mock`
- `.env.docker.example` — add placeholder keys for verification providers
- `Security/Soc-2-compliant/Data-Security.md` — update third-party processor list

## Fix Prompt

```
In backend/ThirdWheel.API/appsettings.json:
- Change every "mode": "mock" to "mode": "disabled" so production cannot accidentally run in mock mode.
- Keep "mode": "mock" only in appsettings.Development.json and appsettings.Test.json.

In backend/ThirdWheel.API/Services/Verification/, implement TwilioPhoneVerificationProvider.cs:
- Read credentials from Configuration["Twilio:AccountSid"], ["Twilio:AuthToken"], ["Twilio:VerifyServiceSid"].
- StartAsync(phoneNumber) → POST to Twilio Verify API to send OTP.
- VerifyAsync(phoneNumber, code) → POST to Twilio Verify check endpoint; return bool.
- Guard: if any Twilio credential is null/empty, throw InvalidOperationException("Twilio not configured").
- Register in DI with mode check: if mode == "production" use TwilioPhoneVerificationProvider,
  else if mode == "mock" use existing MockProvider, else throw.

Add to .env.docker.example:
    Twilio__AccountSid=CHANGE_ME
    Twilio__AuthToken=CHANGE_ME
    Twilio__VerifyServiceSid=CHANGE_ME

In Security/Soc-2-compliant/Data-Security.md, add Twilio to the third-party processor table.
```
