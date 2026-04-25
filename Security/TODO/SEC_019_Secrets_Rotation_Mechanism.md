# SEC_019 — Implement Secrets Rotation Mechanism

**Severity:** HIGH  
**SOC 2 Criteria:** CC6.1, CC9.1  
**Status:** Open  
**Effort:** Medium (2–3 days)

---

## Problem

Secrets (JWT signing key, database password) are static and have no rotation mechanism. If a secret is leaked (via version control exposure, insider threat, or log scraping):

- The JWT signing key compromise allows an attacker to forge valid JWTs for any user indefinitely.
- The database password compromise allows an attacker to query all user data indefinitely.
- There is no way to detect or limit the damage without a full application redeployment and key rotation.

SOC 2 CC6.1 requires that access controls include mechanisms to promptly revoke access when compromised.

## Current Secrets Requiring Rotation

| Secret | Risk if Leaked | Rotation Complexity |
|---|---|---|
| `Jwt__Key` | Forge any user JWT; full platform compromise | Medium — requires overlap window |
| `ConnectionStrings__DefaultConnection` (DB password) | Full database access | Low — rotate at DB level |
| Verification provider API keys (when enabled) | Provider abuse, billing fraud | Low — rotate at vendor |
| Vercel deploy tokens | Deploy arbitrary code | Low — rotate in Vercel |
| OCI registry credentials | Push malicious images | Low — rotate at registry |

## Fix

### JWT Key Rotation (Zero-Downtime)

JWT rotation requires an overlap window because in-flight tokens signed with the old key must remain valid during the transition:

1. **Dual-key support**: Configure the API to accept tokens signed by either `Jwt__Key` (current) or `Jwt__KeyPrevious` (old).
2. **Rotation procedure**:
   a. Generate a new key (`Jwt__Key_new`).
   b. Set `Jwt__KeyPrevious = <current Jwt__Key>`.
   c. Set `Jwt__Key = Jwt__Key_new`.
   d. Deploy. The API now issues tokens with the new key and validates both old and new.
   e. Wait for `TokenExpiryDays` (7 days) — all old tokens expire.
   f. Remove `Jwt__KeyPrevious` from config.

```csharp
// Program.cs — multi-key JWT validation
var validationKeys = new List<SecurityKey> {
    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
};
if (!string.IsNullOrEmpty(jwtKeyPrevious))
    validationKeys.Add(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKeyPrevious)));

options.TokenValidationParameters = new TokenValidationParameters {
    IssuerSigningKeys = validationKeys,
    // ... other params
};
```

### Database Password Rotation

1. Generate a new database password in Supabase / PostgreSQL.
2. Update `ConnectionStrings__DefaultConnection` in the secrets vault.
3. Restart the API container to pick up the new connection string.
4. Revoke the old password at the database level.

### Rotation Schedule (Recommended)

| Secret | Rotation Frequency | Method |
|---|---|---|
| JWT signing key | Every 90 days | Dual-key overlap as above |
| Database password | Every 90 days | DB-level rotation + env update |
| Verification provider keys | Per-vendor recommendation (90–365 days) | Vendor dashboard + env update |
| Deploy tokens | Every 180 days | Platform dashboard |

### Automation

For production environments, use:
- **AWS Secrets Manager** automatic rotation for the database password (native Supabase/RDS integration available).
- A CI/CD pipeline step that checks for expired secrets and alerts on-call.

## Files To Edit

- `backend/ThirdWheel.API/Program.cs` — add dual-key JWT validation support
- `backend/ThirdWheel.API/appsettings.json` — document `Jwt__KeyPrevious` config key
- `.env.docker.example` — add `Jwt__KeyPrevious=` placeholder
- `scripts/` — add a `rotate-jwt-key.sh` helper script that generates a new key and guides the operator through the dual-key transition
- `Security/Soc-2-compliant/Platform-Security.md` — update secrets management section once rotation is live

## Fix Prompt

```
In backend/ThirdWheel.API/Program.cs, find where TokenValidationParameters is set:
- Read jwtKey from Configuration["Jwt:Key"] and optionally jwtKeyPrevious from Configuration["Jwt:KeyPrevious"].
- Build a list of signing keys:
    var signingKeys = new List<SecurityKey> {
        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
    if (!string.IsNullOrWhiteSpace(jwtKeyPrevious))
        signingKeys.Add(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKeyPrevious)));
- Set TokenValidationParameters.IssuerSigningKeys = signingKeys (not IssuerSigningKey).

In backend/ThirdWheel.API/appsettings.json, add a comment/doc entry:
    "Jwt": { "Key": "", "KeyPrevious": "" }  // KeyPrevious used only during rotation overlap

Add to .env.docker.example:
    Jwt__KeyPrevious=

Create scripts/rotate-jwt-key.sh:
    #!/bin/bash
    NEW_KEY=$(openssl rand -base64 48)
    echo "=== JWT Key Rotation Procedure ==="
    echo "1. In your secrets/.env.docker, set Jwt__KeyPrevious to your current Jwt__Key value."
    echo "2. Set Jwt__Key to: $NEW_KEY"
    echo "3. Deploy. Wait 7 days (token expiry) for all old tokens to expire."
    echo "4. Remove Jwt__KeyPrevious from config and redeploy."
Make the script executable (chmod +x).
```
