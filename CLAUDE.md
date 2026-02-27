# CLAUDE.md — Tarot API

## Mandatory Workflow

You MUST follow this sequence for every task. No shortcuts.

### 0. Environment Setup
```bash
export PATH="/home/node/.openclaw/bin:/home/node/.local/bin:$PATH"
```

### 1. Decapod (Governance Runtime)
```bash
decapod version              # verify available
decapod activate 2>/dev/null || true  # activate if needed
decapod todo list 2>/dev/null || true # check todos
```

### 2. Plan
Before writing any code, use /plan or describe your plan:
- What files you'll modify
- What tests you'll write
- What edge cases you see

### 3. TDD (Tests First)
- Write failing tests FIRST
- Commit the failing tests: `git commit -m "test: add failing tests for <feature>"`
- THEN implement until tests pass
- Commit the implementation separately

### 4. Self-Review
Before your final commit, re-read your entire diff and report:
1. Three things that could break or that you're uncertain about
2. Any edge cases you didn't test
3. Whether you actually followed TDD (tests committed before implementation)

### 5. Validate
```bash
# Run project tests
bun test

# Run decapod validation
decapod validate 2>/dev/null || echo "decapod validate skipped"

# If UI changes made, use playwright-cli
if git diff HEAD~1 --name-only | grep -qE "\.(html|css|ts|tsx)$"; then
  # Start dev server first, then:
  playwright-cli open http://localhost:3000
  playwright-cli screenshot
fi
```

### 6. Branch Discipline
- Create a feature branch: `git checkout -b feat/<task-name>`
- Do NOT work on main
- Do NOT push — only commit locally
- The orchestrator will review, merge, and push

## Project Info
- **Stack:** Bun + Elysia + SQLite
- **Tests:** `bun test`
- **Build:** `bun run build`
- **Decapod:** `/home/node/.openclaw/bin/decapod`
- **Playwright CLI:** `/home/node/.openclaw/bin/playwright-cli`
