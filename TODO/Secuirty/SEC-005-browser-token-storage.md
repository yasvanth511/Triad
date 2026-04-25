# SEC-005: Replace Browser LocalStorage Token Storage

## Risk Level
High

## Security Area
Frontend Security

## Problem
Consumer web, business portal, and admin store bearer tokens in `localStorage`.

## Why This Matters
Any successful XSS or malicious browser extension can read `localStorage` and exfiltrate bearer tokens. Admin token storage in `localStorage` is especially sensitive because it can grant privileged API access.

## Evidence From Code
- `web/triad-web/src/components/providers/session-provider.tsx`: `authTokenKey = "triad.web.auth-token"`.
- `web/triad-web/src/hooks/use-local-storage.ts`: reads and writes `window.localStorage`.
- `web/triad-business/src/components/providers/session-provider.tsx`: `authTokenKey = "triad.business.auth-token"`.
- `web/triad-business/src/hooks/use-local-storage.ts`: reads and writes `window.localStorage`.
- `admin/nextjs-admin/src/lib/api.ts`: `ADMIN_TOKEN_KEY = 'triad.admin.token'`, `saveAdminToken()` writes to `window.localStorage`.

## Recommended Fix
Move browser session credentials to secure, HttpOnly, SameSite cookies where possible, paired with CSRF protection for state-changing requests. If a pure bearer model must remain, use short-lived in-memory access tokens and rotated refresh tokens in HttpOnly cookies.

## Implementation Steps
1. Design a web session model using HttpOnly, Secure, SameSite cookies.
2. Keep access tokens out of persistent JavaScript-readable storage.
3. Add CSRF protection for cookie-authenticated state-changing requests.
4. Update API clients to send credentials through browser cookie mechanics or a secure token broker.
5. Remove `localStorage` persistence for user, business, and admin bearer tokens.
6. Give admin sessions the strictest lifetime and storage controls.

## Acceptance Criteria
- Bearer tokens are not stored in `localStorage` or `sessionStorage`.
- Admin credentials are not readable from JavaScript-accessible persistent storage.
- Browser-authenticated write requests include CSRF protection if cookies are used.
- Existing API calls still attach credentials through the approved secure mechanism.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
iOS uses Keychain for device builds, which is a better storage pattern. Simulator-only `UserDefaults` fallback was noted but not prioritized as a production browser risk.
