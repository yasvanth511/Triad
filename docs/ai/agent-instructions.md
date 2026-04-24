# Focused Agent Instructions

Use these scopes for focused AI sessions or sub-agents. Each agent should read `AGENTS.md` first and avoid touching unrelated files.

## Architect Agent

- Responsibility: decide architecture, sequencing, contracts, and risk for a bounded change.
- Inspect first: `AGENTS.md`, `docs/ai/context.md`, `README.md`, relevant app folders, `DTOs/`, `AppDbContext.cs`.
- Expected output: concise plan, impacted files, contract changes, tests, risks.
- Do not touch: secrets, generated files, lock files, migrations unless planning schema work.
- Completion checklist: scope is clear, source of truth identified, verification path named.

## Backend Agent

- Responsibility: API routes, services, DTOs, EF models, business rules, backend tests.
- Inspect first: relevant controller/service/DTO/model, `AppConstants.cs`, `AppDbContext.cs`, matching tests.
- Expected output: focused implementation and xUnit coverage when appropriate.
- Do not touch: client UI, deploy scripts, migrations unless schema is explicitly in scope.
- Completion checklist: contracts preserved or documented, tests run, clients flagged if mirrors need updates.

## Frontend/Web Agent

- Responsibility: consumer web or business portal UI, web API wrappers, web mirrored types.
- Inspect first: target `src/app` route, `src/features` or portal page, `src/lib/api`, `src/lib/types.ts`, shared UI components.
- Expected output: localized UI/API changes and web checks.
- Do not touch: backend behavior, iOS, admin, lock files unless explicitly scoped.
- Completion checklist: lint/typecheck/build considered, no contract drift, responsive states handled.

## iOS/Mobile Agent

- Responsibility: SwiftUI screens, iOS models, API client use, session/location/media behavior.
- Inspect first: relevant Swift view, `APIClient.swift`, `Models.swift`, `SessionStore.swift`, `BrandStyle.swift`.
- Expected output: localized Swift changes and simulator/build guidance.
- Do not touch: backend contracts unless explicitly scoped, Xcode project unless needed.
- Completion checklist: API paths/types match backend, session/token behavior safe, build command named or run.

## Database Agent

- Responsibility: EF entities, relationships, indexes, migrations, seed rules, data integrity.
- Inspect first: target models, `AppDbContext.cs`, migrations, tests, `seed.ps1` only if seed-related.
- Expected output: schema plan or migration-backed change with tests.
- Do not touch: production env, unrelated migrations, seed data unless explicitly scoped.
- Completion checklist: migration generated intentionally, snapshot updated, rollback/compat risk noted.

## Test Agent

- Responsibility: add or improve tests for one behavior.
- Inspect first: changed files, nearest existing tests, `tests/ThirdWheel.API.TestCommon`.
- Expected output: focused tests and commands run.
- Do not touch: production code except tiny testability fixes with approval.
- Completion checklist: tests fail for the old bug when practical, pass now, no new tooling without approval.

## DevOps/Deployment Agent

- Responsibility: Docker, deploy scripts, env templates, local run scripts, release checks.
- Inspect first: `README.md`, `docker-compose.yml`, relevant `Dockerfile`, `scripts/*`, deploy env examples.
- Expected output: script/config/docs change with dry-run or command validation when safe.
- Do not touch: real env files, credentials, production deploys, app behavior.
- Completion checklist: commands documented, env vars named, no secrets, no lock/package-manager churn.

## Security/Privacy Agent

- Responsibility: auth, authorization, CORS, JWT, privacy, upload safety, admin exposure, logging.
- Inspect first: `Program.cs`, auth/safety services, controllers, config templates, affected clients.
- Expected output: findings or targeted fix with tests/checks.
- Do not touch: real secrets, broad feature code, unrelated UX.
- Completion checklist: sensitive data not logged, auth boundaries preserved, privacy behavior noted.

## Product/Story Agent

- Responsibility: translate product intent into scoped engineering stories and acceptance criteria.
- Inspect first: `Product.md`, `docs/ai/context.md`, target UI/API flow.
- Expected output: user story, acceptance criteria, edge cases, affected surfaces.
- Do not touch: code unless explicitly asked to implement.
- Completion checklist: story is testable, scope is one feature, dependencies and risks named.

## Code Review Agent

- Responsibility: review changes for bugs, regressions, tests, security, and scope creep.
- Inspect first: diff, touched files, nearest contracts/tests, `AGENTS.md` guardrails.
- Expected output: findings first with file/line refs, then open questions and test gaps.
- Do not touch: code unless asked to fix findings.
- Completion checklist: severity ordered, no nit-only review, residual risk clear.
