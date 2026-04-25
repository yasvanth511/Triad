# SEC_021 — Add SAST and Dependency Vulnerability Scanning to CI/CD

**Severity:** MEDIUM  
**SOC 2 Criteria:** CC8.1, CC4.1  
**Status:** Open  
**Effort:** Medium (1–2 days)

---

## Problem

No CI/CD pipeline exists in the repository. There are no automated checks for:

- Static application security testing (SAST) — code-level vulnerability detection.
- Known CVEs in third-party dependencies (NuGet, npm, Swift packages).
- Secrets accidentally committed to version control.

SOC 2 CC8.1 requires that changes are authorized and tested before deployment. Without automated security gates, insecure code can be shipped without review.

## Fix

### 1. GitHub Actions Pipeline (Recommended)

Create `.github/workflows/security.yml` that runs on every pull request and push to `main`:

```yaml
name: Security Checks

on: [push, pull_request]

jobs:
  backend-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Dependency vulnerability scan
      - name: .NET dependency audit
        run: dotnet list backend/ThirdWheel.API/ThirdWheel.API.csproj package --vulnerable --include-transitive

      # SAST — CodeQL
      - uses: github/codeql-action/init@v3
        with:
          languages: csharp
      - name: Build for CodeQL
        run: dotnet build backend/ThirdWheel.API
      - uses: github/codeql-action/analyze@v3

  frontend-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }

      # npm audit for each web app
      - run: cd web/triad-web && npm ci && npm audit --audit-level=high
      - run: cd web/triad-business && npm ci && npm audit --audit-level=high
      - run: cd admin/nextjs-admin && npm ci && npm audit --audit-level=high

  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      # Scan for accidentally committed secrets
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Secrets Scanning — gitleaks

Run `gitleaks detect --source . --verbose` locally before every push. Add it as a git pre-commit hook:

```bash
# .git/hooks/pre-commit
gitleaks protect --staged --verbose
```

Or use `pre-commit` framework with the `gitleaks` hook.

### 3. Container Image Scanning

Add Trivy to the Docker build pipeline:

```bash
# scripts/deploy/backend-api.sh — add before push
trivy image --exit-code 1 --severity HIGH,CRITICAL \
  --ignore-unfixed $IMAGE_TAG
```

### 4. OWASP Dependency-Check (Alternative to npm audit)

For a more thorough multi-ecosystem scan:

```bash
dependency-check.sh --project Triad --scan . \
  --format HTML --out Security/reports/
```

### 5. Semgrep for Custom Rules

Add Semgrep with the `p/owasp-top-ten` and `p/csharp` rulesets to catch platform-specific patterns:
- `[AllowAnonymous]` on controller actions that should be restricted
- `ExecuteSqlRaw` with string interpolation
- MD5 usage
- Hardcoded credentials

```yaml
# .semgrep.yml
rules:
  - id: allowanonymous-on-admin
    pattern: |
      [AllowAnonymous]
      public ... $METHOD(...)
    message: "[AllowAnonymous] found — verify this endpoint should be public"
    severity: WARNING
    languages: [csharp]
```

## Files To Create

- `.github/workflows/security.yml` — CI security pipeline
- `.github/workflows/tests.yml` — CI test pipeline (backend + web lint/typecheck)
- `.gitleaks.toml` — gitleaks config (allow-list for test fixtures)
- `.semgrep.yml` — custom Semgrep rules

## Fix Prompt

```
Create .github/workflows/security.yml with three jobs (trigger: push + pull_request):

  backend-security:
    - actions/checkout@v4
    - run: dotnet list backend/ThirdWheel.API/ThirdWheel.API.csproj package --vulnerable --include-transitive
    - github/codeql-action/init@v3 (languages: csharp)
    - run: dotnet build backend/ThirdWheel.API
    - github/codeql-action/analyze@v3

  frontend-security:
    - actions/checkout@v4 + actions/setup-node@v4 (node 20)
    - run: cd web/triad-web && npm ci && npm audit --audit-level=high
    - run: cd web/triad-business && npm ci && npm audit --audit-level=high
    - run: cd admin/nextjs-admin && npm ci && npm audit --audit-level=high

  secrets-scan:
    - actions/checkout@v4 (fetch-depth: 0)
    - gitleaks/gitleaks-action@v2 (env: GITHUB_TOKEN)

Create .gitleaks.toml:
    title = "Triad gitleaks config"
    [allowlist]
      paths = ["tests/", "Security/TODO/"]  # allow example values in test fixtures

Create .semgrep.yml with rules:
    - id: allowanonymous-admin: flag [AllowAnonymous] on any public method
    - id: raw-sql-interpolation: flag ExecuteSqlRaw with string interpolation ($"{")
    - id: md5-usage: flag MD5.HashData or new MD5CryptoServiceProvider
    - id: hardcoded-password: flag BCrypt.HashPassword("...literal...")

Create scripts/setup/install-git-hooks.sh:
    #!/bin/bash
    echo 'gitleaks protect --staged --verbose' > .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo "pre-commit hook installed."
```
