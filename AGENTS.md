<!-- BEGIN swamp managed section - DO NOT EDIT -->
# Project

This repository is managed with [swamp](https://github.com/systeminit/swamp).

## Rules

1. **Search before you build.** When automating AWS, APIs, or any external service: (a) search local types with `swamp model type search <query>`, (b) search community extensions with `swamp extension search <query>`, (c) if a community extension exists, install it with `swamp extension pull <package>` instead of building from scratch, (d) only create a custom extension model in `extensions/models/` if nothing exists. Read `.agents/skills/swamp-extension-model/SKILL.md` for guidance. The `command/shell` model is ONLY for ad-hoc one-off shell commands, NEVER for wrapping CLI tools or building integrations.
2. **Extend, don't be clever.** When a model covers the domain but lacks the method you need, extend it with `export const extension` — don't bypass it with shell scripts, CLI tools, or multi-step hacks. One method, one purpose. Use `swamp model type describe <type> --json` to check available methods.
3. **Use the data model.** Once data exists in a model (via `lookup`, `start`, `sync`, etc.), reference it with CEL expressions. Don't re-fetch data that's already available.
4. **CEL expressions everywhere.** Wire models together with CEL expressions. Always prefer `data.latest("<name>", "<dataName>").attributes.<field>` over the deprecated `model.<name>.resource.<spec>.<instance>.attributes.<field>` pattern.
5. **Verify before destructive operations.** Always `swamp model get <name> --json` and verify resource IDs before running delete/stop/destroy methods.
6. **Prefer fan-out methods over loops.** When operating on multiple targets, use a single method that handles all targets internally (factory pattern) rather than looping N separate `swamp model method run` calls against the same model. Multiple parallel calls against the same model contend on the per-model lock, causing timeouts. A single fan-out method acquires the lock once and produces all outputs in one execution. Check `swamp model type describe` for methods that accept filters or produce multiple outputs.
7. **Extension npm deps are bundled, not lockfile-tracked.** Swamp's bundler inlines all npm packages (except zod) into extension bundles at bundle time. `deno.lock` and `package.json` do NOT cover extension model dependencies — this is by design. Always pin explicit versions in `npm:` import specifiers (e.g., `npm:lodash-es@4.17.21`).
8. **Reports for reusable data pipelines.** When the task involves building a repeatable pipeline to transform, aggregate, or analyze model output (security reports, cost analysis, compliance checks, summaries), create a report extension. Read `.agents/skills/swamp-report/SKILL.md` for guidance.

## Skills

**IMPORTANT:** Skills are detailed guides stored in `.agents/skills/`. When a task
matches a skill area below, read the corresponding `SKILL.md` file for guidance.

- `.agents/skills/swamp-model/SKILL.md` - Work with swamp models (creating, editing, validating)
- `.agents/skills/swamp-workflow/SKILL.md` - Work with workflows (creating, editing, running)
- `.agents/skills/swamp-vault/SKILL.md` - Manage secrets and credentials
- `.agents/skills/swamp-data/SKILL.md` - Manage model data lifecycle
- `.agents/skills/swamp-report/SKILL.md` - Create and run reports for models and workflows
- `.agents/skills/swamp-repo/SKILL.md` - Repository management
- `.agents/skills/swamp-extension-model/SKILL.md` - Create custom TypeScript models
- `.agents/skills/swamp-extension-driver/SKILL.md` - Create custom execution drivers
- `.agents/skills/swamp-extension-datastore/SKILL.md` - Create custom datastore backends
- `.agents/skills/swamp-extension-vault/SKILL.md` - Create custom vault providers
- `.agents/skills/swamp-issue/SKILL.md` - Submit bug reports and feature requests
- `.agents/skills/swamp-troubleshooting/SKILL.md` - Debug and diagnose swamp issues

## Getting Started

**IMPORTANT:** At the start of every conversation, run
`swamp model search --json`. If no models are returned (empty result), you MUST
immediately read `.agents/skills/swamp-getting-started/SKILL.md` and follow its
instructions. This walks new users through an interactive onboarding tutorial.

If models already exist, start by reading `.agents/skills/swamp-model/SKILL.md`
to work with swamp models.

## Commands

Use `swamp --help` to see available commands.
<!-- END swamp managed section -->

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
