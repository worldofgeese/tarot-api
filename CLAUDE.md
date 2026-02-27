# CLAUDE.md — Tarot API

## Environment
- **decapod** is at `/home/node/.openclaw/bin/decapod` or `/home/node/.local/bin/decapod`
- **PATH** should include: `/home/node/.openclaw/bin:/home/node/.local/bin`
- Run: `export PATH="/home/node/.openclaw/bin:/home/node/.local/bin:$PATH"` before using decapod

## Mandatory Workflow

### 0. Initialize Decapod
```bash
export PATH="/home/node/.openclaw/bin:/home/node/.local/bin:$PATH"
decapod version  # verify it works
cd /tmp/tarot-api-spread
decapod activate 2>/dev/null || true  # activate if not already
```

### 1. Plan
Before writing any code, describe your plan:
- What files you'll modify
- What tests you'll write
- What edge cases you see

### 2. TDD (Tests First)
- Write failing tests FIRST
- Run them to confirm they fail: `bun test tests/<name>.test.ts`
- Commit the failing tests: `git add . && git commit -m "test: add failing tests for <feature>"`
- THEN implement until tests pass
- Commit the implementation: `git add . && git commit -m "feat: <description>"`

### 3. Self-Review
Before your final commit, re-read your diff (`git diff HEAD~1`) and report:
1. Three things that could break
2. Any edge cases you didn't test
3. Whether you actually followed TDD

### 4. Validate
```bash
export PATH="/home/node/.openclaw/bin:/home/node/.local/bin:$PATH"
bun test
decapod validate 2>/dev/null || echo "decapod validate skipped"
```

### 5. Branch Discipline
- You are on branch `feat/spread-system`. Stay on it.
- Do NOT push — only commit locally.
- The orchestrator will review, merge, and push.

## Project Info
- **Stack:** Bun + Elysia + SQLite
- **Tests:** `bun test` (unit/API)
- **DB:** `cards` table with 78 tarot cards
