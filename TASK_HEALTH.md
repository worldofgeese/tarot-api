# Task: Add Health Check Endpoint

## Context
Tarot API — Elysia/Bun/SQLite. 77 unit tests passing. Repo at /tmp/tarot-api.

## Branch
Create and work on branch: `feat/health-check`
Do NOT work on main.

## TDD
Write failing tests FIRST in `tests/health.test.ts`. Commit them.
Then implement until tests pass. Commit again.

## What to do

1. Write failing tests first in `tests/health.test.ts`:
   - `GET /api/health` returns 200
   - Response includes `{ status: "ok", timestamp: <ISO string>, dbConnected: true }`
   - Response includes `uptime` (number, seconds)
   - Response time is under 100ms

2. Commit the failing tests: `git commit -m "test: add failing health check tests"`

3. Implement `GET /api/health` endpoint in `src/routes/health.ts`:
   - Check DB connectivity (run a simple query)
   - Return status, timestamp, dbConnected boolean, uptime in seconds
   - Register the route in `src/index.ts`

4. Run `bun test $(find tests -maxdepth 1 -name '*.test.ts')` — all must pass including new tests

5. Commit: `git commit -m "feat: add health check endpoint"`

## Constraints
- Only create: `src/routes/health.ts`, `tests/health.test.ts`
- Only modify: `src/index.ts` (to register route)
- Do NOT modify any other files
- Do NOT push. Commit only.

## Self-Review (mandatory before final commit)
Re-read your entire diff. List:
1. Three things that could break or that you're uncertain about
2. Any edge cases you didn't test
3. Whether you followed TDD (tests committed before implementation)
