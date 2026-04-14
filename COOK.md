# COOK.md — Tarot API Agent Instructions

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
