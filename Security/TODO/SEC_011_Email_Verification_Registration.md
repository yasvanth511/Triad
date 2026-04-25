# SEC_011 — Require Email Verification on Registration

**Severity:** MEDIUM  
**SOC 2 Criteria:** CC6.2, PI1.2  
**Status:** Open  
**Effort:** Medium (1–2 days)

---

## Problem

Users can register with any email address and immediately gain full API access. There is no confirmation that the email address is owned by the registrant. This enables:

- Mass fake account creation with harvested or fictional email addresses.
- Impersonation of another person's email address.
- Circumvention of ban (register a new account with a different email immediately after ban).
- Invalid contact information for support and breach notification.

## Fix

### Flow

1. On `POST /api/auth/register`:
   - Create the user account with `IsEmailVerified = false`.
   - Issue a short-lived (24-hour) signed email verification token.
   - Send a verification email with a link: `https://<app>/verify-email?token=<token>`.
   - Return a `202 Accepted` response telling the client to check their email.
   - **Do not issue a login JWT until email is verified.**

2. Add `GET /api/auth/verify-email?token=<token>`:
   - Validate the token (HMAC-signed, not expired).
   - Set `IsEmailVerified = true` on the user.
   - Redirect to the app with a success indicator (or return JSON for mobile).

3. Add `POST /api/auth/resend-verification`:
   - Rate-limited to 3 requests per hour per email.
   - Resends the verification email.

4. Add `IsEmailVerified = false` check to `POST /api/auth/login`:
   - If `IsEmailVerified` is false, return `403` with a message instructing the user to verify their email.

### Email Sending

Use an email service provider:
- **SendGrid** (`SendGrid__ApiKey`) — recommended
- **AWS SES** (`AWS__SesRegion`, `AWS__AccessKeyId`, `AWS__SecretAccessKey`)
- **Mailgun** (`Mailgun__ApiKey`)

Store credentials in the secrets vault (SEC_002).

### Token Generation

Use a cryptographically secure token: `Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))`.  
Store the token hash (SHA-256) in the database with expiry, not the plaintext token.

## Files To Edit

- `backend/ThirdWheel.API/Models/User.cs` — add `IsEmailVerified`, `EmailVerificationTokenHash`, `EmailVerificationTokenExpiry`
- `backend/ThirdWheel.API/Controllers/AuthController.cs` — add verify-email and resend endpoints
- `backend/ThirdWheel.API/Services/AuthService.cs` — add verification token generation and email dispatch
- `backend/ThirdWheel.API/Services/EmailService.cs` — new service for sending emails
- `backend/ThirdWheel.API/Migrations/` — migration for new fields
- `IOSNative/ThirdWheelNative/AuthView.swift` — handle 202 response, show verify-email state
- `web/triad-web/src/features/auth/` — handle verify-email flow

## Fix Prompt

```
In backend/ThirdWheel.API/Models/User.cs, add:
    public bool IsEmailVerified { get; set; } = false;
    public string? EmailVerificationTokenHash { get; set; }
    public DateTimeOffset? EmailVerificationTokenExpiry { get; set; }

Create backend/ThirdWheel.API/Services/EmailService.cs:
- Inject IConfiguration; read Configuration["SendGrid:ApiKey"].
- SendVerificationEmailAsync(string toEmail, string verificationUrl).

In backend/ThirdWheel.API/Services/AuthService.cs RegisterAsync:
- Set IsEmailVerified = false.
- Generate token: Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).
- Store SHA-256 hash of token + expiry (now + 24h).
- Call EmailService.SendVerificationEmailAsync with link https://<baseUrl>/verify-email?token=<token>.
- Return 202 (do not issue JWT yet).

In LoginAsync: if (!user.IsEmailVerified) return AuthResult.EmailNotVerified → caller returns 403.

In backend/ThirdWheel.API/Controllers/AuthController.cs, add:
- GET /api/auth/verify-email?token= → hash token, find user, check expiry, set IsEmailVerified = true, return 200.
- POST /api/auth/resend-verification → rate-limited (3/hr per email), regenerate token, resend email.

Generate EF migration.
Add SendGrid__ApiKey= placeholder to .env.docker.example.

In IOSNative/ThirdWheelNative/AuthView.swift: on 202 from register, show "Check your email" view.
In web/triad-web/src/features/auth/: handle 202 register response and add /verify-email page.
```
