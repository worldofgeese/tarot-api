# Task: Add Health Check Endpoint

## Context
Tarot API — Bun/Elysia app at `/tmp/tarot-api`. Has SQLite DB, API routes, and HTML frontend.

## What to do

1. Add a `GET /api/health` endpoint in `src/routes/` that returns:
   ```json
   { "status": "ok", "timestamp": "<ISO 8601>", "cardCount": <number from DB> }
   ```
2. Write a test in `tests/health.test.ts` that verifies:
   - 200 status
   - `status` is "ok"
   - `cardCount` is 78
   - `timestamp` is a valid ISO date

## Verification (MANDATORY — do all before pushing)

### 1. Build & test
Run `bun test $(find tests -maxdepth 1 -name '*.test.ts')`. All tests must pass.

### 2. Sanity check
- No leftover debug code
- No unrelated changes

### 3. Adversarial self-review
Re-read your diff. List 3 things that could break.

### 4. Linear walkthrough
Walk through the execution path of the new endpoint.

### 5. Commit and push
Commit message: `feat: add /api/health endpoint with DB card count`
Push when done.
