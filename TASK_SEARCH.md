# Task: Add GET /api/cards/search endpoint

## Context
Tarot API — Bun/Elysia app. SQLite DB with a `cards` table.

## What to do

1. Add `GET /api/cards/search?q=<term>` endpoint in `src/routes/api.ts`. Search card `name` and `keywords` columns using SQLite LIKE (case-insensitive). Return matching cards as a JSON array.

2. Return 400 if `q` is missing or empty.

3. Add tests in `tests/search.test.ts` covering:
   - Returns 200 with results for "fool" (should find The Fool)
   - Returns empty array for nonsense query "xyzzy123"
   - Returns 400 when q is missing
   - Results contain expected card fields

4. Run `bun test tests/search.test.ts` to verify.
5. Commit with message "feat: add GET /api/cards/search endpoint"
6. Push to origin.
