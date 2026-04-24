# AI Docs Maintenance

Keep these files small, current, and useful for future AI sessions.

## Update `AGENTS.md` When

- The architecture, app boundaries, canonical commands, testing expectations, or guardrails change.
- A new app/service becomes active.
- A risky area or avoid-edit rule is discovered.
- Tool-neutral instructions need to change for all agents.

## Update `docs/ai/context.md` When

- A major feature is added, removed, or substantially completed.
- API route families, data models, deployment status, or current gaps change.
- A partial implementation becomes production-ready.
- A key assumption is confirmed or invalidated.

## Update `docs/ai/file-map.md` When

- Important folders/files move.
- A new test, script, deploy, or app location becomes important.
- Generated, secret, or caution areas change.

## Update `docs/ai/prompt-library.md` When

- A recurring prompt pattern proves useful.
- A new app/workflow needs a reusable prompt.
- Existing prompts become stale or too broad.

## Keep AI Docs Small

- Prefer summaries and file paths over copied code.
- Link to canonical files instead of duplicating content.
- Remove stale details when adding new ones.
- Keep each doc focused on its purpose.

## Do Not Store

- Secrets, tokens, passwords, connection strings, admin bearer tokens, signing details, or private data.
- Huge file trees, generated command output, logs, screenshots, or full API schemas.
- Temporary plans that belong in an issue, PR, or working note.
- Tool-specific instructions that should live in a thin tool entrypoint.

## Prevent Stale Documentation

- Update AI docs in the same PR as durable architecture or workflow changes.
- During review, check whether changed commands, routes, models, or app boundaries affect `docs/ai/*`.
- Prefer "current as of" notes for context docs.
- If unsure, add a short assumption or open question rather than over-documenting.
