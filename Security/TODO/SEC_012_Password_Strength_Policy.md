# SEC_012 — Enforce Password Strength Policy

**Severity:** MEDIUM  
**SOC 2 Criteria:** CC6.1, CC6.2  
**Status:** Open  
**Effort:** Small (< 1 day)

---

## Problem

The registration endpoint accepts any password without a strength requirement. No minimum length, no complexity requirement, and no check against known-breached passwords is visible in the current codebase. This allows:

- Trivially guessable passwords (`123456`, `password`).
- Passwords that are immediately crackable if the password hash is ever exposed.

## Fix

### Minimum Requirements (NIST SP 800-63B Baseline)

| Rule | Value |
|---|---|
| Minimum length | 8 characters (NIST minimum; 12 recommended) |
| Maximum length | 128 characters |
| No character-set composition rules (NIST) | Do not require uppercase + number + symbol — length matters more |
| Breach check | Check against HaveIBeenPwned (HIBP) k-anonymity API |
| Common password blocklist | Reject top-1000 most common passwords |

### Implementation

1. Add a `PasswordPolicy` class with a `Validate(string password)` method.
2. Inject into `AuthService.RegisterAsync` — return a `400 Bad Request` with a descriptive message on failure.
3. For the HIBP check: use the k-anonymity API (send first 5 chars of SHA-1 hash, not the full password):
   ```csharp
   var sha1 = SHA1.HashData(Encoding.UTF8.GetBytes(password));
   var prefix = Convert.ToHexString(sha1)[..5];
   // GET https://api.pwnedpasswords.com/range/{prefix}
   // Check if full hash suffix appears in response
   ```
4. The HIBP check is optional (can be disabled via config) for environments without outbound internet access.

### DTO Validation

Also add `[MinLength(8)]` and `[MaxLength(128)]` Data Annotations to the `RegisterRequest.Password` DTO field so ASP.NET Core model binding rejects clearly invalid requests before they reach the service layer.

## Files To Edit

- `backend/ThirdWheel.API/DTOs/AuthDtos.cs` (or equivalent) — add length annotations
- `backend/ThirdWheel.API/Services/PasswordPolicyService.cs` — new service
- `backend/ThirdWheel.API/Services/AuthService.cs` — call policy on registration and password change
- `IOSNative/ThirdWheelNative/AuthView.swift` — surface password strength hint in UI
- `web/triad-web/src/features/auth/` — surface password strength hint in UI

## Verification

```bash
# Weak password should be rejected
curl -X POST http://localhost:5127/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"123"}'
# Expected: 400

# Strong password should succeed
curl -X POST http://localhost:5127/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"correct-horse-battery-staple"}'
# Expected: 201 or 202
```

## Fix Prompt

```
Create backend/ThirdWheel.API/Services/PasswordPolicyService.cs:
    public record PasswordValidationResult(bool IsValid, string? Error);
    public class PasswordPolicyService {
        private static readonly HashSet<string> CommonPasswords = new() { "password","123456","12345678",... }; // embed top-100 list
        public PasswordValidationResult Validate(string password) {
            if (password.Length < 8) return new(false, "Password must be at least 8 characters.");
            if (password.Length > 128) return new(false, "Password must not exceed 128 characters.");
            if (CommonPasswords.Contains(password.ToLower())) return new(false, "Password is too common.");
            return new(true, null);
        }
    }

In backend/ThirdWheel.API/DTOs/AuthDtos.cs (or equivalent RegisterRequest DTO):
- Add [MinLength(8), MaxLength(128)] to the Password property.

In backend/ThirdWheel.API/Services/AuthService.cs:
- In RegisterAsync and ChangePasswordAsync, call passwordPolicyService.Validate(password);
  if !IsValid return a 400 with the Error message.

Register PasswordPolicyService as scoped in Program.cs.

In IOSNative/ThirdWheelNative/AuthView.swift and web/triad-web/src/features/auth/:
- Show a password strength hint (length bar or message) as the user types, using client-side rules
  mirroring the 8-char minimum.
```
