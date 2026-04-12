<!-- BEGIN swamp managed section - DO NOT EDIT -->
# Project

This repository is managed with [swamp](https://github.com/systeminit/swamp).

## Rules

1. **Search before you build.** When automating AWS, APIs, or any external service: (a) search local types with `swamp model type search <query>`, (b) search community extensions with `swamp extension search <query>`, (c) if a community extension exists, install it with `swamp extension pull <package>` instead of building from scratch, (d) only create a custom extension model in `extensions/models/` if nothing exists. Use the `swamp-extension-model` skill for guidance. The `command/shell` model is ONLY for ad-hoc one-off shell commands, NEVER for wrapping CLI tools or building integrations.
2. **Extend, don't be clever.** When a model covers the domain but lacks the method you need, extend it with `export const extension` — don't bypass it with shell scripts, CLI tools, or multi-step hacks. One method, one purpose. Use `swamp model type describe <type> --json` to check available methods.
3. **Use the data model.** Once data exists in a model (via `lookup`, `start`, `sync`, etc.), reference it with CEL expressions. Don't re-fetch data that's already available.
4. **CEL expressions everywhere.** Wire models together with CEL expressions. Always prefer `data.latest("<name>", "<dataName>").attributes.<field>` over the deprecated `model.<name>.resource.<spec>.<instance>.attributes.<field>` pattern.
5. **Verify before destructive operations.** Always `swamp model get <name> --json` and verify resource IDs before running delete/stop/destroy methods.
6. **Prefer fan-out methods over loops.** When operating on multiple targets, use a single method that handles all targets internally (factory pattern) rather than looping N separate `swamp model method run` calls against the same model. Multiple parallel calls against the same model contend on the per-model lock, causing timeouts. A single fan-out method acquires the lock once and produces all outputs in one execution. Check `swamp model type describe` for methods that accept filters or produce multiple outputs.
7. **Extension npm deps are bundled, not lockfile-tracked.** Swamp's bundler inlines all npm packages (except zod) into extension bundles at bundle time. `deno.lock` and `package.json` do NOT cover extension model dependencies — this is by design. Always pin explicit versions in `npm:` import specifiers (e.g., `npm:lodash-es@4.17.21`).
8. **Reports for reusable data pipelines.** When the task involves building a repeatable pipeline to transform, aggregate, or analyze model output (security reports, cost analysis, compliance checks, summaries), create a report extension. Use the `swamp-report` skill for guidance.

## Skills

**IMPORTANT:** Always load swamp skills, even when in plan mode. The skills provide
essential context for working with this repository.

- `swamp-model` - Work with swamp models (creating, editing, validating)
- `swamp-workflow` - Work with workflows (creating, editing, running)
- `swamp-vault` - Manage secrets and credentials
- `swamp-data` - Manage model data lifecycle
- `swamp-report` - Create and run reports for models and workflows
- `swamp-repo` - Repository management
- `swamp-extension-model` - Create custom TypeScript models
- `swamp-extension-driver` - Create custom execution drivers
- `swamp-extension-datastore` - Create custom datastore backends
- `swamp-extension-vault` - Create custom vault providers
- `swamp-issue` - Submit bug reports and feature requests
- `swamp-troubleshooting` - Debug and diagnose swamp issues

## Getting Started

Always start by using the `swamp-model` skill to work with swamp models.

## Commands

Use `swamp --help` to see available commands.
<!-- END swamp managed section -->

# CLAUDE.md — Tarot API

## Mandatory Workflow

You MUST follow this sequence for every task. No shortcuts.

### 0. Environment Setup
```bash
export PATH="/home/node/.openclaw/bin:/home/node/.local/bin:$PATH"
```

### 1. Governance and Repo Control Plane
Decapod is the primary governance runtime for this repository. You must respect it first.

```bash
decapod version
decapod activate 2>/dev/null || true
decapod todo list 2>/dev/null || true
decapod workspace status 2>/dev/null || true
```

If a task is inference-heavy, policy-sensitive, or touches interfaces, resolve context through Decapod before implementation.

### 2. Agent-Native Automation Layer
Swamp is part of the standard toolchain for Claude Code in this repository.

Use Swamp when the work benefits from typed models, workflows, durable artifacts, reports, secrets handling, or reusable automation.

Before building new automation:
- Search existing Swamp model types
- Search community extensions
- Prefer extending a model over shell hacks
- Prefer workflows and reports over throwaway scripts when the behavior should persist

### 3. Spec and Planning Layer
OpenSpec is part of the expected planning stack for non-trivial work.

For features, architecture changes, or multi-step work:
- inspect the OpenSpec state if present
- prefer spec-first thinking before implementation
- keep your plan concrete: files, tests, edge cases, constraints

Use the local binary when available:
`/home/node/.openclaw/npm-global/bin/openspec`

### 4. Cook
Cook is part of the broader local SDLC stack. If the task or repo already uses Cook conventions, logs, or runtime support, follow them rather than ignoring them.

If Cook-specific project state is present, treat it as part of the workflow, not incidental clutter.

### 5. TDD (Tests First)
- Write failing tests FIRST
- Commit the failing tests: `git commit -m "test: add failing tests for <feature>"`
- THEN implement until tests pass
- Commit the implementation separately

### 6. Self-Review
Before your final commit, re-read your entire diff and report:
1. Three things that could break or that you're uncertain about
2. Any edge cases you didn't test
3. Whether you actually followed TDD (tests committed before implementation)

### 7. Validate
```bash
# Run project tests
bun test

# Run decapod validation
decapod validate 2>/dev/null || echo "decapod validate skipped"

# If OpenSpec is in use for the task, update or validate the relevant spec state

# If UI changes made, use playwright-cli
if git diff HEAD~1 --name-only | grep -qE "\.(html|css|ts|tsx)$"; then
  # Start dev server first, then:
  playwright-cli open http://localhost:3000
  playwright-cli screenshot
fi
```

### 8. Branch Discipline
- Create a feature branch: `git checkout -b feat/<task-name>`
- Do NOT work on main
- Do NOT push, only commit locally
- The orchestrator will review, merge, and push

## Tool Priority
1. Decapod for governance, context, workspace control, and validation
2. Swamp for durable automation, models, workflows, vaults, and reports
3. OpenSpec for spec-first planning and change definition
4. Cook when repo or workflow context indicates it is active
5. Native project tools for build, test, and runtime verification

## Project Info
- **Stack:** Bun + Elysia + SQLite
- **Tests:** `bun test`
- **Build:** `bun run build`
- **Decapod:** `/home/node/.openclaw/bin/decapod`
- **OpenSpec:** `/home/node/.openclaw/npm-global/bin/openspec`
- **Swamp:** `/home/node/.local/bin/swamp`
- **Playwright CLI:** `/home/node/.openclaw/bin/playwright-cli`
