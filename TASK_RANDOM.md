# Task: Add GET /api/cards/random endpoint

## Context
Tarot API — Bun/Elysia app. SQLite DB with a `cards` table.

## What to do

1. Add `GET /api/cards/random` endpoint in `src/routes/api.ts` that returns a single random card as JSON. Use `ORDER BY RANDOM() LIMIT 1`.

2. Add `GET /api/cards/random?count=N` variant that returns N random cards (max 10, default 1).

3. Add tests in `tests/random.test.ts` covering:
   - Returns 200
   - Single card has expected fields (id, name, arcana, etc.)
   - count=3 returns exactly 3 cards
   - count=0 or count=11 returns 400 error
   - Default (no count param) returns 1 card

4. Run `bun test tests/random.test.ts` to verify.
5. Commit with message "feat: add GET /api/cards/random endpoint"
6. Push to origin.
