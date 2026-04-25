# SEC_020 — Create Incident Response and Breach Notification Plan

**Severity:** HIGH  
**SOC 2 Criteria:** CC7.3, CC7.4, CC7.5  
**Status:** Open  
**Effort:** Medium (2–3 days to write; ongoing to maintain)

---

## Problem

No incident response (IR) plan exists in the repository or organizational documentation. SOC 2 CC7.3–CC7.5 requires:

- Security incidents be identified and contained.
- Incidents be analyzed to determine root cause and impact.
- Affected parties be notified per legal requirements.
- Post-incident reviews be conducted.

Without a plan, the team has no playbook when an incident occurs — increasing response time, worsening impact, and likely violating breach notification laws (GDPR requires notification within 72 hours; several US states have similar requirements).

## Required Plan Components

### 1. Incident Classification

| Severity | Definition | Example |
|---|---|---|
| **P0 — Critical** | Active exploitation, data breach, full service compromise | Database dump exfiltrated, JWT key leaked |
| **P1 — High** | Suspected breach, partial compromise, significant data exposure | Unauthenticated admin endpoint accessed by external actor |
| **P2 — Medium** | Security control failure, no confirmed exploitation | Rate limiter bypass, verification mock mode in production |
| **P3 — Low** | Security hygiene issue, no user impact | Dependency with known CVE, weak config |

### 2. Response Playbooks (Required for SOC 2)

Create a separate runbook for each scenario:

#### Playbook A — Database Credential Compromise
1. Immediately rotate database password (SEC_019 procedure).
2. Rotate JWT signing key (SEC_019 procedure) — assume attacker may have issued forged JWTs.
3. Review database query logs for the suspected exposure window.
4. Assess which data was accessible (all tables if credentials were for the application DB user).
5. Determine breach scope: was PII accessed?
6. If PII accessed: proceed to breach notification procedure.

#### Playbook B — JWT Key Compromise
1. Immediately rotate JWT key using dual-key procedure (SEC_019).
2. Add all active JTIs to deny-list (SEC_005) if JTI tracking is implemented.
3. Force all users to re-authenticate (if JTI tracking not yet implemented, display in-app prompt).
4. Review for forged admin JWTs: check admin endpoint access logs.

#### Playbook C — Unauthenticated Data Exposure
1. Deploy fix immediately (e.g., remove `[AllowAnonymous]` — SEC_001).
2. Capture server access logs for the exposure window.
3. Identify which endpoint was exposed and what data it returned.
4. Assess if data was accessed: look for unusual request patterns in access logs.
5. Determine breach scope.

#### Playbook D — CSAM / Illegal Content Report
1. Immediately remove content from the platform.
2. Preserve evidence without further viewing.
3. Report to NCMEC (US) within 24 hours — legally required under 18 U.S.C. § 2258A.
4. Cooperate with law enforcement.
5. Do not destroy evidence.

### 3. Breach Notification Thresholds

| Jurisdiction | Notification Requirement | Timeline |
|---|---|---|
| GDPR (EU/UK) | Notify supervisory authority if risk to individuals | 72 hours from discovery |
| GDPR | Notify affected individuals if high risk | Without undue delay |
| US — California (CCPA/CPRA) | Notify affected CA residents | Expedient — no specific timeline but "without delay" |
| US — Various states | 30+ states have breach notification laws | Varies; typically 30–90 days |

### 4. Communication Templates

Prepare template notifications:
- User notification email: "We detected unauthorized access to data that may include your [email / profile information]. Here is what we know and what you should do."
- Regulatory notification: Format per the applicable authority's template.
- Internal status page update.

### 5. Post-Incident Review

Within 5 business days of resolution:
- Root cause analysis (5 Whys or similar).
- Timeline of detection, containment, and remediation.
- Controls that failed and remediation items.
- Updated SOC 2 risk register.

## Immediate Action

Create the `Security/Incident-Response/` directory with:
- `IR-Plan.md` — this plan expanded into a full document
- `Playbook-A-Database-Breach.md`
- `Playbook-B-JWT-Compromise.md`
- `Playbook-C-Data-Exposure.md`
- `Playbook-D-CSAM.md`
- `Breach-Notification-Templates.md`
- `Contact-List.md` — escalation contacts, legal, DPA authority contacts

## Ongoing Maintenance

- Review IR plan every 6 months or after any P0/P1 incident.
- Conduct a tabletop exercise annually.
- Document evidence of reviews for SOC 2 auditors.

## Fix Prompt

```
Create the directory Security/Incident-Response/ and the following files:

IR-Plan.md — include:
- Incident classification table (P0–P3 with definitions and examples from this doc).
- Response phases: Detect → Contain → Eradicate → Recover → Review.
- Breach notification thresholds table (GDPR 72h, CCPA, US state laws).
- Post-incident review checklist (root cause, timeline, failed controls, risk register update).
- Link to each playbook file.

Playbook-A-Database-Breach.md — numbered steps:
1. Rotate DB password immediately (link to SEC_019 procedure).
2. Rotate JWT signing key (link to SEC_019 procedure).
3. Review DB query logs for the exposure window.
4. Assess PII scope; if PII accessed proceed to breach notification.

Playbook-B-JWT-Compromise.md — numbered steps:
1. Rotate JWT key (SEC_019 dual-key procedure).
2. Add all active JTIs to deny-list (SEC_005 procedure).
3. Review admin endpoint access logs for forged tokens.
4. Force re-authentication in-app.

Playbook-C-Data-Exposure.md — numbered steps:
1. Deploy fix immediately (e.g., SEC_001 AllowAnonymous removal).
2. Capture server access logs for exposure window.
3. Identify data returned and assess breach scope.

Playbook-D-CSAM.md — numbered steps:
1. Remove content immediately.
2. Preserve evidence without further viewing.
3. Report to NCMEC within 24 hours (18 U.S.C. § 2258A).
4. Cooperate with law enforcement; do not destroy evidence.

Breach-Notification-Templates.md — two templates:
- User notification email (subject, body with [TBD] placeholders for incident details).
- GDPR DPA notification (Article 33 required fields).

Contact-List.md — table with columns: Role | Name | Contact with [TBD] for each row.
Rows: Incident Lead, Legal Counsel, DPA Authority (Ireland/UK/etc.), NCMEC (1-800-843-5678).
```
