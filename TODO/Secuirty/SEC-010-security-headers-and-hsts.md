# SEC-010: Add Backend Security Headers and HSTS

## Risk Level
Medium

## Security Area
Backend Security

## Problem
The backend redirects HTTP to HTTPS outside development, but no HSTS or common security headers are configured in the API pipeline.

## Why This Matters
Security headers reduce exposure to downgrade, MIME sniffing, clickjacking, referrer leakage, and browser feature abuse. HSTS helps ensure clients continue using HTTPS after first contact.

## Evidence From Code
- `backend/ThirdWheel.API/Program.cs`
  - Uses `app.UseHttpsRedirection()` in non-development.
  - No `app.UseHsts()` call found.
  - No middleware found for headers such as `X-Content-Type-Options`, `X-Frame-Options` or CSP/frame-ancestors, `Referrer-Policy`, `Permissions-Policy`, or cache control for sensitive responses.

## Recommended Fix
Add a small, explicit security-header middleware or vetted package appropriate for ASP.NET Core APIs. Enable HSTS in non-development environments.

## Implementation Steps
1. Add `app.UseHsts()` for non-development environments.
2. Add security headers for MIME sniffing, frame embedding, referrer policy, and permissions policy.
3. Ensure Swagger/OpenAPI development behavior remains unaffected.
4. Review static `/uploads` responses for safe content-type and sniffing behavior.
5. Avoid overly broad CSP that would break existing clients unless serving HTML from the API host.

## Acceptance Criteria
- Non-development responses include HSTS.
- API responses include baseline security headers.
- Static upload responses cannot be MIME-sniffed by browsers.
- Development Swagger remains usable.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
This is backend configuration hardening, not deployment/TLS setup.
