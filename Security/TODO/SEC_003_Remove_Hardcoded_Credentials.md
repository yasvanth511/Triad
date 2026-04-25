# SEC_003 — Remove Hardcoded Credentials and PII from Source Code

**Severity:** CRITICAL  
**SOC 2 Criteria:** CC6.1, CC6.3  
**Status:** Open  
**Effort:** Small (half day)

---

## Problem

Three pieces of hardcoded sensitive data exist in the committed source:

### 1. Default Admin Password in Program.cs

```csharp
// Program.cs — seed admin block
PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin@123")
```

If EF migrations auto-run against a database that does not yet have this seed row (production bootstrap, restored backup), this creates an account with a known password. Even though it is BCrypt-hashed, the plaintext `admin@123` is public.

### 2. Seed Admin Email in AdminController.cs

```csharp
// AdminController.cs
const string SeedAdminEmail = "yasvanth@live.in";
```

A real user's email address is hardcoded in source and used as an access gate for destructive seed operations. This PII should not be in version control.

### 3. Supabase Credentials in appsettings.Development.json and .env.docker

Covered in SEC_002 but noted here as a separate remediation step.

## Fix

### Default Admin Password

1. Remove the `BCrypt.Net.BCrypt.HashPassword("admin@123")` seed block entirely from `Program.cs`.
2. Replace with a startup check: if no admin user exists, log a warning and require manual admin creation via a one-time provisioning script or an environment variable `SEED_ADMIN_PASSWORD` that is never committed.
3. If seed behavior is required for development, gate it on `IsDevelopment()` and read the password from an environment variable:
   ```csharp
   var seedPassword = builder.Configuration["SeedAdmin:Password"]
       ?? throw new InvalidOperationException("SeedAdmin:Password not set");
   PasswordHash = BCrypt.Net.BCrypt.HashPassword(seedPassword)
   ```

### Seed Admin Email

1. Remove the hardcoded `SeedAdminEmail` constant.
2. Read from configuration: `builder.Configuration["SeedAdmin:Email"]`.
3. This value should be set in the local `.env.docker` (not committed) and in the deployment environment.

## Files To Edit

- `backend/ThirdWheel.API/Program.cs` — remove hardcoded password from seed block
- `backend/ThirdWheel.API/Controllers/AdminController.cs` — remove hardcoded `SeedAdminEmail`
- `.env.docker.example` — add `SeedAdmin__Email=` and `SeedAdmin__Password=` placeholders

## Verification

```bash
# Confirm no hardcoded passwords remain
grep -r "admin@123" backend/
grep -r "yasvanth@live.in" backend/
```

## Fix Prompt

```
In backend/ThirdWheel.API/Program.cs:
- Find the admin seed block containing BCrypt.Net.BCrypt.HashPassword("admin@123").
- Gate the entire block on app.Environment.IsDevelopment().
- Replace the hardcoded password string with:
    builder.Configuration["SeedAdmin:Password"]
        ?? throw new InvalidOperationException("SeedAdmin:Password not set")

In backend/ThirdWheel.API/Controllers/AdminController.cs:
- Replace `const string SeedAdminEmail = "yasvanth@live.in"` with:
    var seedAdminEmail = _configuration["SeedAdmin:Email"]
        ?? throw new InvalidOperationException("SeedAdmin:Email not set");
- Inject IConfiguration via constructor if not already present.

In .env.docker.example (create if absent):
- Add placeholder lines:
    SeedAdmin__Email=admin@example.com
    SeedAdmin__Password=CHANGE_ME

Do not modify any other files.
```
