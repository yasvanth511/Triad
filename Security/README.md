# Triad — Security Documentation

This folder contains the security posture documentation and remediation backlog for the Triad platform, structured for SOC 2 Type II readiness.

---

## Folder Structure

```
Security/
├── README.md                          ← This index
├── Soc-2-compliant/
│   ├── Data-Security.md               ← Data classification, encryption, retention, access controls
│   └── Platform-Security.md          ← Auth, authorization, infra, secrets, monitoring, change management
└── TODO/
    ├── SEC_001_Fix_Admin_AllowAnonymous.md
    ├── SEC_002_Secrets_Vault_Management.md
    ├── SEC_003_Remove_Hardcoded_Credentials.md
    ├── SEC_004_Account_Lockout.md
    ├── SEC_005_Session_Revocation_Logout.md
    ├── SEC_006_Replace_MD5_AntiSpam.md
    ├── SEC_007_Immutable_Audit_Log.md
    ├── SEC_008_Field_Level_Encryption_PII.md
    ├── SEC_009_JWT_SignalR_Header_Auth.md
    ├── SEC_010_Enable_Verification_Providers.md
    ├── SEC_011_Email_Verification_Registration.md
    ├── SEC_012_Password_Strength_Policy.md
    ├── SEC_013_Per_Endpoint_Rate_Limiting.md
    ├── SEC_014_Ban_Review_Workflow.md
    ├── SEC_015_Docker_Health_Checks_And_Hardening.md
    ├── SEC_016_Authenticated_Media_Access.md
    ├── SEC_017_Input_Validation_Framework.md
    ├── SEC_018_Data_Retention_Policy.md
    ├── SEC_019_Secrets_Rotation_Mechanism.md
    ├── SEC_020_Incident_Response_Plan.md
    └── SEC_021_SAST_And_Dependency_Scanning.md
```

---

## SOC 2 Gap Summary

Based on the codebase assessment dated 2026-04-24.

### CRITICAL — Must Fix Before Any Production Launch

| ID | Issue | SOC 2 Criteria |
|---|---|---|
| SEC_001 | Admin read endpoints are `[AllowAnonymous]` — anyone can enumerate users and view moderation data | CC6.1 |
| SEC_002 | Secrets (DB password, JWT key) present in version-controlled files | CC6.1 |
| SEC_003 | Hardcoded admin password and PII email in source code | CC6.1, CC6.3 |

### HIGH — Required for SOC 2 Certification

| ID | Issue | SOC 2 Criteria |
|---|---|---|
| SEC_004 | No account lockout after failed login attempts | CC6.1, CC6.6 |
| SEC_005 | No session revocation or logout endpoint | CC6.2, CC6.3 |
| SEC_007 | No immutable audit log for security events and admin data access | CC4.1, CC7.1 |
| SEC_008 | PII (email, phone) stored in plaintext in database | CC6.1, C1.1 |
| SEC_010 | All verification methods in mock mode — badges meaningless in production | CC6.2, PI1.2 |
| SEC_013 | No per-endpoint rate limiting — login/register endpoints are brute-forceable | CC6.6 |
| SEC_016 | Uploaded media served without authentication — files publicly guessable | CC6.1, CC6.8 |
| SEC_018 | No data retention policy or purge jobs | C1.2 |
| SEC_019 | No secrets rotation mechanism | CC6.1, CC9.1 |
| SEC_020 | No incident response plan | CC7.3, CC7.4, CC7.5 |

### MEDIUM — Important for Posture and Auditor Confidence

| ID | Issue | SOC 2 Criteria |
|---|---|---|
| SEC_006 | MD5 used for message fingerprinting in AntiSpamService | CC6.6 |
| SEC_009 | JWT passed in query string for SignalR (appears in logs and browser history) | CC6.7 |
| SEC_011 | No email verification on registration | CC6.2 |
| SEC_012 | No password strength policy | CC6.1 |
| SEC_014 | Automatic account ban without human review (ban-by-proxy attack vector) | CC5.1, CC7.2 |
| SEC_015 | No Docker health checks or container hardening | CC7.1, A1.1 |
| SEC_017 | Input validation coverage not fully audited | CC5.1, PI1.2 |
| SEC_021 | No SAST, dependency scanning, or secrets detection in CI | CC8.1, CC4.1 |

---

## SOC 2 Trust Service Criteria Coverage

| Criteria | Description | Current Status |
|---|---|---|
| CC1 — Control Environment | Security governance and policies | No formal policy documented |
| CC2 — Communication | Security policies communicated | `AGENTS.md` has rules; no formal policy doc |
| CC3 — Risk Assessment | Formal risk register | Not performed |
| CC4 — Monitoring | Security monitoring and review | Telemetry present; no security alerting |
| CC5 — Control Activities | Controls are defined and operating | Many controls present; several critical gaps |
| CC6 — Logical Access | Access restricted to authorized users | **BROKEN** — admin endpoints unauthenticated |
| CC7 — System Operations | Security events detected and responded to | No incident response plan |
| CC8 — Change Management | Changes authorized, tested, deployed | No CI/CD pipeline |
| CC9 — Risk Mitigation | Third-party and vendor risk managed | No vendor DPAs or security reviews documented |
| C1 — Confidentiality | Confidential data protected | PII in plaintext; no retention policy |
| A1 — Availability | Uptime commitments met | No SLA or availability targets defined |

---

## How to Use This Documentation

1. **Before any production launch**: address all CRITICAL items (SEC_001, SEC_002, SEC_003).
2. **For SOC 2 readiness audit**: address all HIGH items.
3. **For a clean audit report**: address all MEDIUM items.
4. Each `TODO/SEC_NNN_*.md` file contains: the problem, root cause, step-by-step fix, files to edit, and verification steps.
5. After fixing an item: update its status field to `Resolved`, add the resolution date, and reference the PR or commit.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | Security Engineering | Initial assessment and documentation |
