# SEC_017 — Audit and Enforce Input Validation Across All Endpoints

**Severity:** MEDIUM  
**SOC 2 Criteria:** CC5.1, PI1.2  
**Status:** Open  
**Effort:** Medium (2 days)

---

## Problem

Input validation relies on ASP.NET Core model binding and Data Annotations, but a full audit of DTO validation coverage has not been performed. Known gaps from the code scan:

1. No password strength validation visible in DTOs (covered separately in SEC_012).
2. No validation of `matchId` format before parsing in ChatHub (line 84 of ChatHub.cs).
3. No CAPTCHA on registration, login, or verification endpoints.
4. No defense against Unicode normalization attacks (e.g., homoglyph substitution in usernames and bio text).
5. File upload endpoints do not validate MIME type against the actual file magic bytes (the file extension and Content-Type header alone are not reliable).

## Fix

### 1. DTO Annotation Audit

For every DTO in `backend/ThirdWheel.API/DTOs/`:

- Confirm `[Required]` on all non-optional fields.
- Add `[MaxLength]` on all string fields (use `AppConstants` values where applicable).
- Add `[MinLength(8)]` on password fields.
- Add `[EmailAddress]` on email fields.
- Add `[Range]` on numeric fields (age, radius, etc.).
- Ensure `[ApiController]` is on all base controllers so model validation is automatic.

### 2. ChatHub Input Validation

```csharp
// ChatHub.cs — before parsing matchId
if (!Guid.TryParse(matchIdStr, out var matchId))
    throw new HubException("Invalid match ID format");
```

### 3. File MIME Type Validation

Validate uploaded files against their magic bytes, not their declared Content-Type:

```csharp
// ImageService.cs
private static readonly Dictionary<byte[], string> ImageSignatures = new() {
    { new byte[] { 0xFF, 0xD8, 0xFF }, "image/jpeg" },
    { new byte[] { 0x89, 0x50, 0x4E, 0x47 }, "image/png" },
    { new byte[] { 0x47, 0x49, 0x46 }, "image/gif" },
};

public bool IsValidImage(Stream fileStream)
{
    var header = new byte[8];
    fileStream.Read(header, 0, 8);
    fileStream.Seek(0, SeekOrigin.Begin);
    return ImageSignatures.Any(sig => header.Take(sig.Key.Length).SequenceEqual(sig.Key));
}
```

### 4. Username / Bio Sanitization

- Normalize all user-authored text to Unicode NFC form before storage.
- Strip or reject Zero Width characters (`​`, `‌`, `‍`, `﻿`).
- Apply consistently in `ProfileService` before saving bio, username, and interests.

### 5. CAPTCHA (Optional, Low Priority)

Add hCaptcha or Cloudflare Turnstile to registration and password reset flows to prevent automated attacks. Gate this on a config flag so it can be disabled in development.

## Files To Edit

- `backend/ThirdWheel.API/DTOs/*.cs` — add missing Data Annotations
- `backend/ThirdWheel.API/Hubs/ChatHub.cs` — add `Guid.TryParse` guard
- `backend/ThirdWheel.API/Services/ImageService.cs` — add magic byte validation
- `backend/ThirdWheel.API/Services/ProfileService.cs` — add Unicode normalization

## Verification

```bash
# Oversized bio should be rejected
curl -X PUT http://localhost:5127/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bio\": \"$(python3 -c 'print("a"*501)')\"}"
# Expected: 400

# Non-image file uploaded as photo should be rejected
curl -X POST http://localhost:5127/api/profile/photos \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@malicious.js;type=image/jpeg"
# Expected: 400
```

## Fix Prompt

```
In backend/ThirdWheel.API/Hubs/ChatHub.cs, find the line where matchIdStr is parsed to Guid and add:
    if (!Guid.TryParse(matchIdStr, out var matchId))
        throw new HubException("Invalid match ID format.");

In backend/ThirdWheel.API/DTOs/ (audit every .cs file):
- Add [Required] to all non-optional fields.
- Add [MaxLength(500)] to Bio, [MaxLength(50)] to Username, [MaxLength(128)] to Password (upper bound).
- Add [MinLength(8)] to Password.
- Add [EmailAddress] to all Email fields.
- Add [Range(18, 120)] to Age fields if present.

In backend/ThirdWheel.API/Services/ImageService.cs, add before accepting upload:
    private static bool HasValidImageHeader(Stream s) {
        Span<byte> h = stackalloc byte[8];
        s.Read(h); s.Seek(0, SeekOrigin.Begin);
        return (h[0]==0xFF && h[1]==0xD8 && h[2]==0xFF)       // JPEG
            || (h[0]==0x89 && h[1]==0x50 && h[2]==0x4E && h[3]==0x47) // PNG
            || (h[0]==0x47 && h[1]==0x49 && h[2]==0x46);      // GIF
    }
Return 400 if HasValidImageHeader returns false.

In backend/ThirdWheel.API/Services/ProfileService.cs, before saving bio/username/interests:
    text = text.Normalize(NormalizationForm.FormC);
    text = Regex.Replace(text, @"[​‌‍﻿]", string.Empty);
```
