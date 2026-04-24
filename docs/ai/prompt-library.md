# Prompt Library

Reusable token-efficient prompts. Replace bracketed text before use.

## Analyze One Feature

```text
Read AGENTS.md, docs/ai/context.md, and docs/ai/file-map.md. Analyze only [feature/flow] in [surface]. Inspect relevant source files only. Summarize current behavior, key files, data/API contracts, tests, risks, and recommended next steps. Do not make code changes.
```

## Implement One User Story

```text
Read AGENTS.md plus docs/ai/context.md and docs/ai/file-map.md. Implement this one story: [story]. Scope work to [surface/files]. Preserve existing contracts unless required. Avoid unrelated refactors and secrets/generated/lock files. Add/update relevant tests. Summarize changed files, verification, risks, and follow-up work.
```

## Fix One Bug

```text
Read AGENTS.md and relevant docs/ai files. Fix this bug: [observed], expected: [expected], reproduction: [steps]. Inspect only the likely files for [surface/route/service]. Add a regression test when practical. Avoid unrelated cleanup. Summarize root cause, changed files, checks run, risks, and follow-ups.
```

## Add Tests

```text
Read AGENTS.md and docs/ai/file-map.md. Add focused tests for [behavior] in [test project/location]. Inspect the implementation and nearest existing tests only. Do not change production behavior unless a tiny testability fix is necessary and explain it. Run the narrowest relevant test command and summarize results.
```

## Review PR Changes

```text
Read AGENTS.md. Review the current diff for bugs, regressions, security/privacy issues, contract drift, missing tests, and scope creep. Focus on changed files and nearby contracts/tests only. Findings first with file/line references, then open questions and test gaps. Do not edit files.
```

## Generate Seed Data

```text
Read AGENTS.md, docs/ai/context.md, and seed.ps1. Propose seed data for [scenario] without running destructive commands. Avoid real personal data and secrets. Keep API contracts intact. If edits are requested, change only seed-related files and summarize destructive behavior, env vars, and verification.
```

## Add API Endpoint

```text
Read AGENTS.md, docs/ai/context.md, and docs/ai/file-map.md. Add one API endpoint for [capability]. Inspect relevant controller, service, DTO, model, DbContext, and tests. Keep business logic in services and contracts in DTOs. Update client mirrors only if requested or required. Add tests and summarize route, files, checks, risks.
```

## Add UI Screen

```text
Read AGENTS.md and docs/ai/file-map.md. Add one [consumer web/business/admin] screen for [purpose]. Inspect target route/layout, API services, types, and shared components only. Reuse existing UI patterns. Avoid backend changes unless explicitly required. Run relevant lint/typecheck/build and summarize files, states handled, risks.
```

## Add Mobile Screen

```text
Read AGENTS.md and docs/ai/file-map.md. Add one iOS screen for [purpose]. Inspect relevant SwiftUI views, APIClient, Models, SessionStore, and BrandStyle. Preserve existing navigation/session patterns. Avoid backend/API changes unless explicit. Provide or run the simulator/build check and summarize files, risks, follow-ups.
```

## Add Observability Or Logging

```text
Read AGENTS.md and inspect Program.cs, Telemetry.cs, and the target service/controller. Add observability for [operation] without logging secrets, tokens, media bytes, precise coordinates, or private profile details. Keep OpenTelemetry patterns consistent. Add tests only where behavior changes. Summarize signals, files, and privacy review.
```

## Create Or Update Deployment Script

```text
Read AGENTS.md, README.md deployment notes, docs/ai/file-map.md, and the relevant script. Update deployment automation for [goal]. Do not touch real env files, credentials, production deploys, package manager files, or pipelines unless explicitly asked. Validate with safe shell checks/dry run where possible. Summarize env vars, commands, risks.
```

## Prepare Release Checklist

```text
Read AGENTS.md, docs/ai/context.md, README.md, and scripts/deploy/*.sh. Prepare a release checklist for [scope/version]. Do not run deploys. Include required env vars, build/test commands, migration/seed considerations, rollback notes, and risks. Keep it concise.
```

## Refactor One Module

```text
Read AGENTS.md and docs/ai/file-map.md. Refactor only [module/files] to [goal]. Preserve behavior and public contracts. Avoid unrelated formatting, generated files, migrations, lock files, and deployment config. Run relevant tests before/after when practical. Summarize changed files, verification, and residual risk.
```

## Update Documentation After Implementation

```text
Read AGENTS.md and docs/ai/maintenance.md. Update only the docs affected by [implemented change]. Keep docs concise and tool-neutral. Do not duplicate README into AI docs. Avoid secrets and stale command output. Summarize docs changed and why.
```
