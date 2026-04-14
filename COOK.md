# COOK.md — Tarot API Agent Instructions

## Tools Available in This Repo

```
openspec: /home/node/.openclaw/npm-global/bin/openspec
decapod:  /home/node/.openclaw/bin/decapod
fj-ex:    /home/node/.openclaw/bin/fj-ex
bun:      /home/node/.openclaw/devbox-env/.devbox/nix/profile/default/bin/bun
swamp:    ~/.local/bin/swamp
```

Always use absolute paths for these tools — they may not be in PATH.

**OpenSpec flow (mandatory for any feature/API change):**
1. `/home/node/.openclaw/npm-global/bin/openspec new change "<name>"`
2. `/home/node/.openclaw/npm-global/bin/openspec instructions <artifact> --change <name> --json`
3. Generate each artifact (proposal.md, design.md, tasks.md) following the instructions
4. `/home/node/.openclaw/npm-global/bin/openspec status --change <name>` — confirm ready

Read `.claude/skills/openspec-propose/SKILL.md` for the full flow.

## Loop Context

Step: **${step}** | Iteration: ${iteration}/${maxIterations}

### Task
${prompt}

${lastMessage ? '### Previous Output\n' + lastMessage : ''}

### Session Log
${logFile}

---

## Work Step Instructions

You are implementing a task in the tarot-api project. Follow the SDLC:

1. **Read the task carefully** — if a TASK.md exists, read it first
2. **Tests first (TDD)** — write failing tests before implementation
3. **Implement** — make the tests pass
4. **Run tests** — `bun test --timeout 60000` — all 175+ must pass
5. **Check for duplicate routes** — no two handlers on the same path
6. **No regressions** — the existing API surface must not change

Tools you should use:
- `bun test --timeout 60000` — run all tests
- `bun run src/index.ts` — start server to manually verify
- `/home/node/.openclaw/bin/decapod validate` (from a worktree) — optional deeper check

Do not merge, push, or call sdlc-gate.py — that is handled externally.

---

## Review Step Instructions

Review the work output for:
- **Test coverage**: new logic has tests; no untested paths
- **TDD compliance**: were tests written before implementation?
- **API correctness**: response shapes match INTERFACES.md spec
- **No regressions**: existing 175 tests still pass
- **Code quality**: no dead code, no TODO comments left in, no console.logs

Output severity-tagged issues:
- `High:` — must fix before DONE (broken tests, regressions, missing coverage)
- `Medium:` — should fix (style, clarity, minor gaps)
- `Low:` — optional improvement

---

## Gate Step Instructions

Based on the review, respond with exactly **DONE** or **ITERATE**.

**DONE** if:
- All tests pass (175+)
- No High severity issues remain
- The task requirement is fully implemented
- No regressions introduced

**ITERATE** if:
- Any tests are failing
- Any High severity issues exist
- The core task requirement is incomplete

Do not hedge. Pick one word.

---

## Iterate Step Instructions

Fix the High severity issues identified in the review. Then re-run `bun test --timeout 60000` to confirm all pass. Output a summary of what you fixed.
