# CLAUDE.md

Claude-specific entrypoint for this repo.

- Read `AGENTS.md` first. It is the source of truth for all AI coding agents.
- Before large work, read `docs/ai/context.md`, `docs/ai/file-map.md`, and `docs/ai/workflow.md`.
- Use `docs/ai/prompt-library.md` for reusable future prompts.
- Avoid full-repo re-analysis unless the user explicitly asks for it; start from the AI docs and inspect only relevant files.
- Keep context small: prefer `rg`, targeted file reads, and concise summaries.
- Do not duplicate durable project guidance here. Update `AGENTS.md` or `docs/ai/*` instead.
- Treat `.claude/settings.local.json` as local permission state, not shared project documentation.
