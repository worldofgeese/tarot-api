# CLAUDE.md — Tarot API Agent Contract

> Read this before touching any code. It is the binding contract for all agents in this repo.

## Project

TypeScript/Bun API. 78 tarot cards, multiple endpoints. SQLite via bun:sqlite.
Live at: `http://localhost:3000`

## Toolchain (exact binary paths)

```bash
# These are the actual paths. Do not guess or install alternatives.
DECAPOD=/home/node/.openclaw/bin/decapod
RPI=/home/node/.local/bin/rpi
SWAMP=~/.local/bin/swamp
BRV=/home/node/.openclaw/npm-global/bin/brv
BUN=/home/node/.openclaw/devbox-env/.devbox/nix/profile/default/bin/bun
SOULFORGE_WRAPPER=/home/node/.openclaw/workspace/scripts/soulforge-copilot
FJ_EX=/home/node/.openclaw/bin/fj-ex

export PATH="/home/node/.openclaw/bin:/home/node/.openclaw/npm-global/bin:/home/node/.local/bin:$PATH"
```

## Mandatory Session Start (every worker, every time)

```bash
# 1. Decapod session init — do this IN THE WORKTREE, not the main project dir
cd <WORKTREE_PATH>
/home/node/.openclaw/bin/decapod rpc --op agent.init
# Read allowed_next_ops and blocked_by before proceeding

# 2. ByteRover — check existing patterns before planning
/home/node/.openclaw/npm-global/bin/brv query "<feature keyword>"

# 3. RPI plan artifact (slash command — only works in Claude Code / OpenCode)
/rpi-plan
```

## TDD — Non-Negotiable

1. Write failing tests → `bun test <file>` → confirm RED
2. Commit: `test: failing tests for <feature> (RED)`
3. Implement → `bun test --timeout 60000` → 0 failures
4. Commit: `feat: <feature> (GREEN)`
5. Run full suite: `bun test --timeout 60000` — must be 0 fail total

**Test pattern (mandatory):**
```ts
import { describe, it, expect, beforeAll } from "bun:test";
import { createApp } from "../src/index";

const app = createApp(":memory:");  // ALWAYS in-memory, never data/tarot.db

describe("GET /api/cards/...", () => {
  it("returns 200 with ...", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/..."));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toMatchObject({ ... });
  });
});
```

**Do not** use `data/tarot.db` in tests. **Do not** start a real server. **Do not** commit `.db` files.

## Error Response Shape

Always `{ error: "..." }`. Existing messages:
- Invalid id → `"Invalid id"` (from validateCardId)
- Card not found → `"Card not found"`
- Invalid suit → `"Invalid suit. Must be one of: wands, cups, swords, pentacles"`
- Invalid arcana → `"Invalid arcana type. Use 'major' or 'minor'"`

## Existing Patterns

- Route validation: use `validateCardId(id)` from `../middleware/validate`
- DB access: `db.query("SELECT * FROM cards WHERE ...").all(param)` — parameterized, no string concat
- Add new routes AFTER existing card routes in `src/routes/api.ts`
- Additive only — never modify existing routes

## RPI Artifacts

```
.rpi/plans/         ← implementation plans (created by /rpi-plan)
.rpi/specs/         ← behavioral specs
.rpi/reviews/       ← verification reports (/rpi-verify writes here)
.rpi/diagnoses/     ← bug postmortems (/rpi-diagnose writes here)
```

## Decapod Completion Proof

```bash
/home/node/.openclaw/bin/decapod validate
# 4 expected failures (pre-existing):
# - AGENTS.md line limit (135 > 100)
# - container workspace isolation (running in /tmp/)
# - SQLite store access
# - spec scaffold drift
# These are governance warnings, not code bugs. Pipeline still passes.
```

## brv Curate (after push)

```bash
/home/node/.openclaw/npm-global/bin/brv curate "<summary of what was built>"
# If auth fails: append to /home/node/.openclaw/workspace/.brv/context-tree/session-log.md
```

## Done Signal

Reply: `TASK COMPLETE — <one-line summary>`
Include: test count, rpi-verify status, decapod validate status
