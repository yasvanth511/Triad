# Code-Level Security Scrutiny

This folder contains actionable security implementation tasks created from code and configuration evidence in the Triad repository. The review focused on code security, authentication token security, cryptography, secrets management, API/data security, database/data protection, input validation, secure configuration, frontend token handling, backend hardening, and dependency/supply-chain hardening.

Total task files created: 14

## Risk Summary

- Critical: 2
- High: 6
- Medium: 5
- Low: 1

## Security Areas Reviewed

- Token Security
- Cryptography
- Secrets
- API Security
- Data Security
- Frontend Security
- Backend Security
- Database Security
- Dependency Security

## Tasks Grouped By Risk Level

### Critical

- `SEC-001-exposed-development-secrets.md` - Exposed development database credentials and JWT key.
- `SEC-002-admin-endpoints-authorization.md` - Anonymous admin read endpoints and weak seed endpoint authorization.

### High

- `SEC-003-event-mutation-endpoints-admin-policy.md` - Legacy event mutation routes need admin/development-only protection.
- `SEC-004-jwt-session-revocation-and-refresh.md` - Seven-day stateless JWTs lack refresh rotation and revocation.
- `SEC-005-browser-token-storage.md` - Consumer, business, and admin browser clients store bearer tokens in `localStorage`.
- `SEC-006-cors-fail-open-production.md` - CORS allows any origin if allowed origins are missing.
- `SEC-007-verification-sensitive-json-storage.md` - Verification provider tokens and identity/contact data can be stored in plaintext JSON.
- `SEC-008-public-profile-sensitive-data-minimization.md` - Public profile responses reuse the private profile DTO.

### Medium

- `SEC-009-photo-upload-size-and-content-validation.md` - Photo upload endpoints lack request size/content validation before image decode.
- `SEC-010-security-headers-and-hsts.md` - Backend lacks HSTS and baseline security headers.
- `SEC-011-jwt-claims-pii-minimization.md` - JWTs include email and username claims.
- `SEC-012-auth-rate-limiting-hardening.md` - Auth endpoints lack credential-aware rate limiting.
- `SEC-013-sensitive-telemetry-minimization.md` - Telemetry can capture exception messages and sensitive identifiers.

### Low

- `SEC-014-dependency-version-pinning.md` - Direct dependencies use floating versions or wildcard ranges.

## Tasks Grouped By Security Area

### Token Security

- `SEC-004-jwt-session-revocation-and-refresh.md`
- `SEC-011-jwt-claims-pii-minimization.md`

### Cryptography

- No standalone cryptography task was created for password hashing because `AuthService` uses `BCrypt.Net.BCrypt.HashPassword` and `Verify`.
- Cryptographic handling is still relevant to `SEC-004` and `SEC-007` for refresh token hashing and sensitive verification payload protection.

### Secrets

- `SEC-001-exposed-development-secrets.md`
- `SEC-013-sensitive-telemetry-minimization.md`

### API Security

- `SEC-002-admin-endpoints-authorization.md`
- `SEC-003-event-mutation-endpoints-admin-policy.md`
- `SEC-009-photo-upload-size-and-content-validation.md`
- `SEC-012-auth-rate-limiting-hardening.md`

### Data Security

- `SEC-007-verification-sensitive-json-storage.md`
- `SEC-008-public-profile-sensitive-data-minimization.md`
- `SEC-013-sensitive-telemetry-minimization.md`

### Frontend Security

- `SEC-005-browser-token-storage.md`

### Backend Security

- `SEC-006-cors-fail-open-production.md`
- `SEC-010-security-headers-and-hsts.md`

### Database Security

- `SEC-007-verification-sensitive-json-storage.md`
- No raw SQL injection task was created. Raw SQL occurrences found during review either used constants or EF interpolated SQL for user input. Admin raw SQL still appears in privileged seed/maintenance code and should remain covered by `SEC-002`.

### Dependency Security

- `SEC-014-dependency-version-pinning.md`

## Recommended Implementation Order

1. `SEC-001-exposed-development-secrets.md`
2. `SEC-002-admin-endpoints-authorization.md`
3. `SEC-006-cors-fail-open-production.md`
4. `SEC-004-jwt-session-revocation-and-refresh.md`
5. `SEC-005-browser-token-storage.md`
6. `SEC-007-verification-sensitive-json-storage.md`
7. `SEC-003-event-mutation-endpoints-admin-policy.md`
8. `SEC-008-public-profile-sensitive-data-minimization.md`
9. `SEC-009-photo-upload-size-and-content-validation.md`
10. `SEC-011-jwt-claims-pii-minimization.md`
11. `SEC-012-auth-rate-limiting-hardening.md`
12. `SEC-013-sensitive-telemetry-minimization.md`
13. `SEC-010-security-headers-and-hsts.md`
14. `SEC-014-dependency-version-pinning.md`

## Items Intentionally Ignored

- Tests
- Deployment
- Product functionality
- UX flows
- Business feature design
- Admin feature design
- Moderation workflow design
- Dating app safety feature design

## Unknowns Or Assumptions

- `.env*` files were intentionally not inspected.
- No password reset or email verification token implementation was found in the reviewed code, so no task was created for missing expiration or token hashing in those flows.
- No refresh token implementation was found; `SEC-004` covers adding secure refresh token handling rather than fixing an existing refresh-token table.
- iOS production token storage uses Keychain. The simulator-only `UserDefaults` fallback was noted but not prioritized as a production task.
- No `dangerouslySetInnerHTML`, `eval`, or `new Function` usage was found in the reviewed frontend paths.
- The review did not run dependency vulnerability scanners; `SEC-014` is based on manifest versioning patterns, not vulnerability scan output.
