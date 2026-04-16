# CLAUDE.md — Tarot API Agent Contract

> Read this before touching any code. It is the binding contract for all agents in this repo.
> **AGENTS.md exists for other harnesses (Codex, Amp, Cursor) but CLAUDE.md is what Claude Code reads deterministically. Everything critical lives here.**

## Project

TypeScript/Bun API. 78 tarot cards, multiple endpoints. SQLite via bun:sqlite.
Live at: `http://localhost:3000`

## Toolchain (exact binary paths)

```bash
export PATH="/home/node/.openclaw/bin:/home/node/.openclaw/npm-global/bin:/home/node/.local/bin:$PATH"

# Do not guess or install alternatives. These are the actual paths:
DECAPOD=/home/node/.openclaw/bin/decapod
RPI=/home/node/.local/bin/rpi
SWAMP=~/.local/bin/swamp
BRV=/home/node/.openclaw/npm-global/bin/brv
BUN=/home/node/.openclaw/devbox-env/.devbox/nix/profile/default/bin/bun
FJ_EX=/home/node/.openclaw/bin/fj-ex
```

## Mandatory Session Start (every worker, every time)

```bash
# 1. Decapod session init — run IN THE WORKTREE, not the main project dir
/home/node/.openclaw/bin/decapod rpc --op agent.init
# Read allowed_next_ops and blocked_by before proceeding

# 2. ByteRover — check existing patterns before planning
/home/node/.openclaw/npm-global/bin/brv query "<feature keyword>"

# 3. RPI plan artifact
/rpi-plan   # creates .rpi/plans/<date>-<feature>.md
```

## Golden Rules

1. **Never work on main.** You are always in a worktree on a feature branch.
2. **Never claim done without `decapod validate` passing.**
3. **TDD is non-negotiable.** Failing tests committed before implementation. Separate commits.
4. **Never commit `.db` files.** In-memory DB only for tests.
5. **Additive only.** Don't modify existing routes — append new ones.
6. **Error shape is always** `{ error: "..." }`. Match existing messages exactly.
7. **brv query before planning. brv curate after push.** Always.

## RPI Slash Commands

```
/rpi-plan        → create implementation plan
/rpi-implement   → execute plan phase by phase
/rpi-verify      → validate implementation against plan
/rpi-diagnose    → root cause analysis on failures
/rpi-commit      → commit completed work with good message
```

## TDD — Non-Negotiable

1. Write failing tests → `bun test <file>` → confirm RED
2. Commit: `test: failing tests for <feature> (RED)`
3. Implement → `bun test --timeout 60000` → 0 failures
4. Commit: `feat: <feature> (GREEN)`
5. Run full suite: `bun test --timeout 60000` — must be 0 fail total

**Test pattern (mandatory):**
```ts
import { describe, it, expect } from "bun:test";
import { createApp } from "../src/index";

const app = createApp(":memory:");  // ALWAYS in-memory, never data/tarot.db

describe("GET /api/cards/...", () => {
  it("returns 200 with ...", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/..."));
    const data = await res.json();
    expect(res.status).toBe(200);
  });
});
```

**Do not** use `data/tarot.db` in tests. **Do not** start a real server. **Do not** commit `.db` files.

## Error Response Shape

Always `{ error: "..." }`. Existing messages (match exactly):
- Invalid id → `"Invalid id"` (from validateCardId — not "Invalid card id")
- Card not found → `"Card not found"`
- Invalid suit → `"Invalid suit. Must be one of: wands, cups, swords, pentacles"`
- Invalid arcana → `"Invalid arcana type. Use 'major' or 'minor'"`

## Existing Patterns

- Route validation: use `validateCardId(id)` from `../middleware/validate`
- DB access: `db.query("SELECT * FROM cards WHERE ...").all(param)` — parameterized, no string concat
- Add new routes AFTER existing card routes in `src/routes/api.ts`

## Swamp Behavioral Review

```bash
~/.local/bin/swamp workflow run tarot-api-behavioral-review --json
# Runs behavioral checks against the live API. Run after implementing, before pushing.
```

## Decapod Completion Proof

```bash
/home/node/.openclaw/bin/decapod validate
# 4 expected pre-existing failures (not code bugs, pipeline still passes):
# - AGENTS.md line limit, container workspace isolation, SQLite store, spec scaffold drift
```

## brv Curate (after push)

```bash
/home/node/.openclaw/npm-global/bin/brv curate "<summary of what was built>"
# If auth fails: append to /home/node/.openclaw/workspace/.brv/context-tree/session-log.md
```

## Done Signal

Reply: `TASK COMPLETE — <one-line summary>`
Include: test count, /rpi-verify status, decapod validate status
