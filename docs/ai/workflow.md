# AI Workflow

Use this guide to keep future AI sessions small, focused, and easy to review.

## Default Flow

1. Read `AGENTS.md`.
2. Read `docs/ai/context.md` and `docs/ai/file-map.md`.
3. Identify one app/service and one user story or bug.
4. Inspect only relevant controllers/services/DTOs/models/client wrappers/tests.
5. Make the smallest code change that satisfies the request.
6. Run the narrowest useful verification.
7. Summarize changed files, checks, risks, and follow-up work.

## Asking For Feature Work

- Name the surface: backend, iOS, consumer web, business portal, admin, scripts, or docs.
- Name the user flow and expected behavior.
- Provide relevant files or point to route/controller/service names.
- Say whether API contracts may change.
- Ask for tests in the same scope.

Short pattern:

```text
Read AGENTS.md, docs/ai/context.md, and docs/ai/file-map.md. Implement one scoped change: [feature]. Work only in [surface/files]. Preserve existing contracts unless needed. Add/update relevant tests. Avoid unrelated refactors and generated/secret/lock files. Summarize changed files, verification, risks, and follow-ups.
```

## Providing Relevant Files

- Backend feature: controller, service, DTOs, models, `AppDbContext`, tests.
- Web feature: route page, feature screen, API services, types, UI primitives touched.
- iOS feature: screen Swift file, `APIClient`, `SessionStore`, models, style helpers.
- Deployment/script work: exact script, README command section, env example template.
- Database work: model, DbContext mapping, migration history, relevant tests.

## Avoiding Full Repo Re-Reads

- Start from `docs/ai/context.md`.
- Use `rg` for symbols and route names.
- Read nearby files only after finding the relevant entry point.
- Do not ask an agent to "analyze the repo" unless refreshing these docs is the task.

## One Feature At A Time

- Define acceptance criteria.
- Update backend first when behavior or contracts change.
- Then update one client surface at a time.
- Add tests closest to the changed behavior.
- Update `docs/ai/context.md` only if the durable project state changed.

## Bug Fix Workflow

- Provide observed behavior, expected behavior, reproduction steps, and logs if available.
- Ask the agent to identify the smallest failing path.
- Add or update a regression test when practical.
- Avoid opportunistic cleanup outside the bug path.

## Refactor Workflow

- State the module and the exact reason for refactoring.
- Require behavior preservation and relevant tests before/after.
- Exclude migrations, deployment, lock files, generated files, and unrelated UI restyling.
- Prefer small mechanical steps over broad rewrites.

## Test Workflow

- Ask for tests around one behavior or route family.
- Backend: prefer xUnit unit tests for service logic and integration tests for API workflows.
- Web/iOS: no existing test harness was found; ask the agent to explain options before adding new tooling.
- Do not introduce new test frameworks without explicit approval.

## Deployment And Scripts Workflow

- Read `README.md`, `scripts/deploy/*`, and the exact script being changed.
- Do not run production deploy commands unless explicitly requested.
- Do not modify pipeline/deploy behavior for documentation-only tasks.
- Keep env examples free of secrets.

## Updating AI Docs

- Update `AGENTS.md` when durable rules, commands, architecture, or guardrails change.
- Update `docs/ai/context.md` after major features, API additions, deployment changes, or known-gap resolution.
- Update `docs/ai/file-map.md` when important folders/files move.
- Update `docs/ai/prompt-library.md` when a reusable workflow emerges.
