# CLAUDE.md — Tarot API

Read `AGENTS.md` first.

For repo contracts and governance context, use:
- `decapod docs show core/DECAPOD.md`
- `decapod docs show core/INTERFACES.md`
- `decapod docs show docs/workflow/sdlc-experiments.md` when working on the five SDLC experiments

Mandatory governed execution rules:
- .decapod files are accessed only via decapod CLI.
- Use Docker git workspaces under `.decapod/workspaces/*` for governed work.
- request elevated permissions before Docker/container workspace commands.
- Use `DECAPOD_SESSION_PASSWORD` when the session auth gate applies.
- Create/claim work before acting with `decapod todo add "<task>"` and `decapod todo claim --id <task-id>`.
- Run `decapod docs ingest` for core constitution ingestion when the control plane requires it.
- Do not claim completion without `decapod validate`.
- `cargo install decapod` is the version update step when the binary must be refreshed.

## Claude-specific addendum

- Load the Swamp managed guidance from `.swamp.yaml` and the Claude-specific skill surface under `.claude/`.
- Prefer Claude Code slash commands from `.claude/commands/opsx/` when doing OpenSpec work in this repo.
- Keep Claude-only settings in `.claude/settings.local.json`, not in `AGENTS.md`.
