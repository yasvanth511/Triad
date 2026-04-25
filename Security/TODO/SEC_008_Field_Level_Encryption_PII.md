# SEC_008 — Field-Level Encryption for PII

**Severity:** HIGH  
**SOC 2 Criteria:** CC6.1, C1.1  
**Status:** Open  
**Effort:** Large (3–5 days)

---

## Problem

Personally identifiable information (PII) is stored in plaintext in PostgreSQL:

| Field | Table | Risk if DB Compromised |
|---|---|---|
| `Email` | `Users` | Direct identification of all users |
| `Email` | `BusinessPartners` | Direct identification of all business partners |
| Phone number | `VerificationEvents.Data` (JSON) | Phone enumeration |
| Latitude / Longitude | `Users` | Location exposure (partially mitigated by 2 dp rounding) |

If the database is exfiltrated (SQL injection, backup leak, insider threat), all user emails and location data are immediately readable.

## Fix

### Option A — Application-Level Encryption (Recommended)

Use AES-256-GCM to encrypt sensitive fields before persisting:

1. Add a `Data Encryption Key (DEK)` managed via the secrets vault (SEC_002).
2. Create an `EncryptionService` that encrypts/decrypts strings using `AesGcm` from `System.Security.Cryptography`.
3. Wrap `Email` and any phone number storage with `EncryptionService.Encrypt()` before write and `Decrypt()` after read.
4. Store a deterministic HMAC of the email (separate field `EmailHash`) for lookups — encrypted email cannot be directly queried.
5. Update all `Email` lookups (auth, duplicate checks) to use `EmailHash` for comparison.

```csharp
// Example EncryptionService usage
public class UserProfile
{
    // Stored encrypted in DB
    public string EncryptedEmail { get; set; }
    // Stored as HMAC-SHA256(email, lookup_key) for indexed queries
    public string EmailHash { get; set; }
}
```

### Option B — PostgreSQL pgcrypto Extension

Use PostgreSQL's `pgcrypto` extension (`pgp_sym_encrypt` / `pgp_sym_decrypt`) for column-level encryption. This encrypts at the database level but the key must be passed on every query.

### Option C — Supabase / Host-Level Encryption

If Supabase transparent data encryption (TDE) is enabled on the hosted instance, this provides at-rest encryption of the entire database. Verify with Supabase that TDE is active and document it. This is the minimum acceptable baseline.

## Migration Consideration

Adding field-level encryption to existing data requires a data migration:
1. Read all rows in batches.
2. Encrypt the field value.
3. Write back the encrypted value.
4. This is a one-way migration; test thoroughly on a database copy first.

## Files To Edit

- `backend/ThirdWheel.API/Services/EncryptionService.cs` — new
- `backend/ThirdWheel.API/Models/User.cs` — add `EmailHash` field
- `backend/ThirdWheel.API/Services/AuthService.cs` — encrypt on write, use hash on lookup
- `backend/ThirdWheel.API/Data/AppDbContext.cs` — update index to use `EmailHash`
- `backend/ThirdWheel.API/Migrations/` — migration to rename and encrypt existing data

## Verification

- Confirm `SELECT email FROM "Users"` returns ciphertext, not plaintext.
- Confirm login still works after encryption migration.
- Confirm email uniqueness constraint enforced via `EmailHash`.

## Fix Prompt

```
Create backend/ThirdWheel.API/Services/EncryptionService.cs:
- Read key from Configuration["Encryption:DataKey"] (32-byte base64); throw if absent.
- Encrypt(string plaintext) → AES-256-GCM → return base64(nonce + ciphertext + tag).
- Decrypt(string ciphertext) → reverse of above.
- HmacHash(string value) → HMAC-SHA256 with a separate Configuration["Encryption:LookupKey"].

In backend/ThirdWheel.API/Models/User.cs:
- Rename Email → EncryptedEmail (stores ciphertext).
- Add EmailHash string (stores HMAC for indexed lookups).

In backend/ThirdWheel.API/Data/AppDbContext.cs:
- Add unique index on EmailHash instead of Email.

In backend/ThirdWheel.API/Services/AuthService.cs:
- On register/update: store EncryptionService.Encrypt(email) and EncryptionService.HmacHash(email).
- On lookup: query by EmailHash = EncryptionService.HmacHash(inputEmail).
- On read: return EncryptionService.Decrypt(user.EncryptedEmail).

Add Encryption__DataKey= and Encryption__LookupKey= placeholders to .env.docker.example.

Generate EF migration. Write a one-time data migration script (can be a separate console app or
EF migration) that reads existing plaintext Email rows, encrypts them, and back-fills EmailHash.
Test: confirm SELECT "EncryptedEmail" FROM "Users" shows no @ symbols; confirm login still succeeds.
```
