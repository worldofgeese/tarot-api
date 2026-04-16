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

This contract applies to all agents (Claude Code, OpenCode, Codex, Gemini) working in this repo.
**Read CLAUDE.md for project-specific context (test patterns, error shapes, exact binary paths).**

## Mandatory Session Start

```bash
export PATH="/home/node/.openclaw/bin:/home/node/.openclaw/npm-global/bin:/home/node/.local/bin:$PATH"

# 1. Decapod session init (run in your WORKTREE, not the main project dir)
/home/node/.openclaw/bin/decapod rpc --op agent.init
# Check allowed_next_ops and blocked_by before proceeding

# 2. ByteRover — query existing patterns before planning
/home/node/.openclaw/npm-global/bin/brv query "<feature keyword>"

# 3. RPI plan artifact
/rpi-plan   # creates .rpi/plans/<date>-<feature>.md
```

## Tool Stack (all available, use them)

| Tool | Binary | Purpose |
|------|--------|---------|
| **Decapod** | `/home/node/.openclaw/bin/decapod` | Governance, workspace isolation, validate |
| **RPI** | `/home/node/.local/bin/rpi` | Spec-first planning (`/rpi-plan`, `/rpi-implement`, `/rpi-verify`) |
| **Swamp** | `~/.local/bin/swamp` | Behavioral workflows, durable artifacts |
| **brv** | `/home/node/.openclaw/npm-global/bin/brv` | Long-term memory (`brv query` before, `brv curate` after) |
| **fj-ex** | `/home/node/.openclaw/bin/fj-ex` | Forgejo CI (`fj-ex actions runs --repo kypris/tarot-api`) |

## Golden Rules

1. **Never work on main.** You are always in a worktree on a feature branch.
2. **Never claim done without `decapod validate` passing.**
3. **TDD is non-negotiable.** Failing tests committed before implementation. Separate commits.
4. **Never commit `.db` files.** In-memory DB only for tests.
5. **Additive only.** Don't modify existing routes — append new ones.
6. **Error shape is always** `{ error: "..." }`. Match existing messages exactly (see CLAUDE.md).
7. **brv query before planning. brv curate after push.** Always.

## RPI Slash Commands

```
/rpi-plan        → create implementation plan
/rpi-implement   → execute plan phase by phase
/rpi-verify      → validate implementation against plan
/rpi-diagnose    → root cause analysis on failures
/rpi-commit      → commit completed work with good message
```

## Decapod Key Commands

```bash
/home/node/.openclaw/bin/decapod rpc --op agent.init     # session start
/home/node/.openclaw/bin/decapod validate                # completion proof
/home/node/.openclaw/bin/decapod todo list               # check open tasks
/home/node/.openclaw/bin/decapod workspace status        # worktree health
```

## Swamp Behavioral Review

The `tarot-api-behavioral-review` workflow runs against the live API.
Run it with: `~/.local/bin/swamp workflow run tarot-api-behavioral-review --json`

## Done Signal

Reply: `TASK COMPLETE — <one-line summary>`
Include: test count, `/rpi-verify` status, `decapod validate` status

<!-- decapod-validator-anchors
stop if
-->

<!-- decapod-validator-anchors
Strict Dependency: You are strictly bound to the Decapod control plane
-->
