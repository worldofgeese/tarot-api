<!-- Swamp: managed instructions live in CLAUDE.md. See .swamp.yaml for config. -->

# AGENTS.md — Universal Agent Contract

This is a Decapod-managed repository. **Strict Dependency: you are bound to the Decapod control plane.**
This contract applies equally to Claude, Codex, Gemini, and any other agent operating here.

## Mandatory Initialization

```bash
export PATH="/home/node/.openclaw/bin:/home/node/.openclaw/npm-global/bin:/home/node/.local/bin:$PATH"
cargo install decapod

decapod version || echo "⚠️ decapod not on PATH — check /home/node/.openclaw/bin/"
decapod docs ingest 2>/dev/null || true
decapod validate 2>/dev/null || true
decapod session acquire 2>/dev/null || true
decapod workspace status 2>/dev/null || true
decapod todo add "<task>" 2>/dev/null || true
decapod todo claim --id <task-id> 2>/dev/null || true
```

## Control Stack

The expected stack in this repository is:
- **Decapod** for governance, context resolution, workspace control, and validation
- **Swamp** for repo-local agent automation and durable artifacts
- **OpenSpec** for spec-first planning of non-trivial changes
- **Cook** for repo-local work/review/gate orchestration when `.cook/config.json` is present

## Golden Rules

1. Never work on main/master. Use `.decapod/workspaces/*`.
2. `.decapod files are accessed only via decapod CLI`.
3. Never claim done without `decapod validate` passing.
4. Never invent capabilities not exposed by the binary.
5. Stop if requirements conflict, intent is ambiguous, or policy boundaries are unclear.
6. Respect the Interface abstraction boundary.

## Safety Invariants

- ✅ Router pointer: `core/DECAPOD.md`
- ✅ Validation gate: `decapod validate`
- ✅ Constitution ingestion gate: `decapod docs ingest`
- ✅ Workspace status gate: `decapod workspace status`
- ✅ Claim-before-work gate: `decapod todo claim --id <task-id>`
- ✅ Session auth gate: `DECAPOD_SESSION_PASSWORD`
- ✅ Workspace gate: Docker git workspaces
- ✅ Privilege gate: request elevated permissions before Docker/container workspace commands

## Operating Notes

- Use `decapod docs show core/DECAPOD.md` and `decapod docs show core/INTERFACES.md` for binding contracts.
- Use `decapod capabilities --format json` as the authority surface.
- Use `decapod docs search --query "<problem>" --op <op> --path <path> --tag <tag>` or `decapod rpc --op context.scope --params '{"query":"..."}'` for scoped context.
- Treat lock/contention failures (including `VALIDATE_TIMEOUT_OR_LOCK`) as blocking until resolved.

## SDLC Pipeline

- **OpenSpec comes first** for non-trivial features / API changes.
- **Immediately after OpenSpec, use the `tdd` skill** (upstream: `https://github.com/mfranzon/tdd`) as the canonical red-green-refactor loop for implementation work.
- **TDD is non-negotiable.** Write failing tests first, then implement, then keep test and implementation commits separate.
- **Dispatch via ACP** with `streamTo: "parent"` for visibility. One task per agent, branch per task.
- **Gate stack:** Gate 0 (lint) → Gate 0.5 (Architect Lens + Decapod preflight) → Gate 1 (structural) → Manual exercise → Gate 2 (judge) → Gate 2.5 (Architect Lens full) → Gate 3 (CI) → Gate 4 (Council Review for non-trivial merges).
- **Deliverable report** required on every completed task.

## Five SDLC Experiments

All validation scripts are Python (`.decapod/scripts/` or `scripts/`). Shell scripts are policy violations.

- **EX-005 Impact Map** — template: `.decapod/templates/impact-map.md`, validate with `python scripts/check_impact_map.py TASK.md`
- **EX-006 Design Boundaries** — template: `.decapod/templates/design-boundaries.md`, validate with `python scripts/check_design_boundaries.py TASK.md`
- **EX-007 Completion Checklist** — template: `.decapod/templates/completion-checklist.md`, validate with `python scripts/check_completion.py TASK.md`
- **EX-012 Behavioral Review** — script: `python scripts/behavioral_review.py`, reports written under `reports/`
- **EX-014 Resource Headroom** — template: `.decapod/templates/resource-headroom.md`

Cook orchestration lives in `.cook/config.json`. Detailed workflow notes live in `docs/workflow/sdlc-experiments.md`.

<!-- decapod-validator-anchors
stop if
-->


<!-- decapod-validator-anchors
Strict Dependency: You are strictly bound to the Decapod control plane
-->
