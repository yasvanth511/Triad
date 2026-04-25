# SEC_002 — Implement Secrets Vault Management

**Severity:** CRITICAL  
**SOC 2 Criteria:** CC6.1, CC6.7, CC9.1  
**Status:** Open  
**Effort:** Medium (2–3 days)

---

## Problem

Production secrets are not managed via a vault or secret store. Current state:

- `Jwt__Key` and `ConnectionStrings__DefaultConnection` (including plaintext DB password) are present in `.env.docker` and `appsettings.Development.json` which are committed to version control.
- Any developer, contractor, or CI runner with repo access can read live database credentials.
- No rotation mechanism exists — if a key is leaked, there is no way to invalidate it quickly.

## Required State for SOC 2

SOC 2 CC6.1 requires that access to sensitive information (including service credentials) is restricted and controlled. Secrets must not live in source code or version-controlled files.

## Fix

### Option A — Environment Variables Only (Minimum Viable)

1. Remove all real credential values from `appsettings.Development.json` and `.env.docker`.
2. Add example placeholder files (`appsettings.Development.json.example`, `.env.docker.example`) with dummy values and instructions.
3. Confirm `.gitignore` covers `.env.docker`, `.env`, `.env.*`, and `appsettings.Development.json` with real values.
4. Inject all secrets via environment variables in Docker Compose using a local `.env.docker` that is never committed.

### Option B — HashiCorp Vault or AWS Secrets Manager (Production Grade)

1. Deploy Vault or configure AWS Secrets Manager / Azure Key Vault for the production environment.
2. At startup, read secrets via `Microsoft.Extensions.Configuration.Vault` or `AWSSDK.SecretsManager` provider.
3. Define a secret rotation schedule:
   - JWT signing key: rotate every 90 days
   - Database password: rotate every 90 days
   - All rotations must be zero-downtime (dual-key overlap window of ≥ 1 JWT expiry period = 7 days)
4. Store Vercel deploy tokens and OCI registry credentials in CI secret management (GitHub Actions secrets or equivalent).

### Immediate Step (Today)

Rotate the Supabase database password and JWT key that are currently committed. Any developer with repo access has those credentials.

## Files To Edit

- `.env.docker` — remove real values, replace with placeholders
- `appsettings.Development.json` — remove real values, replace with placeholders
- `.gitignore` — verify `.env.docker` and any `appsettings.*.json` with secrets are excluded
- `scripts/setup/check-system.sh` — add a check that `Jwt__Key` is not the example default value

## Verification

```bash
# Confirm no real credentials in tracked files
git log --all --oneline -- .env.docker appsettings.Development.json
git grep -i "password" -- "*.json" "*.env*"
```

## Fix Prompt

```
1. In .env.docker, replace every real credential value (DB password, JWT key, API keys) with
   a placeholder like CHANGE_ME or <your-value-here>.
2. In appsettings.Development.json, do the same for Jwt__Key and ConnectionStrings__DefaultConnection.
3. Ensure .gitignore contains entries for .env.docker, .env, .env.*, and appsettings.Development.json
   (the file with real values, not the .example variant).
4. Create .env.docker.example as a copy of .env.docker with placeholder values and a header comment
   explaining how to populate it.
5. In scripts/setup/check-system.sh, add a guard:
     if [ "$JWT_KEY" = "CHANGE_ME" ] || [ -z "$JWT_KEY" ]; then
       echo "ERROR: Jwt__Key is not set"; exit 1
     fi
6. Rotate the Supabase DB password and JWT key that are currently in version control — note the
   new values only in .env.docker (never committed).
```
