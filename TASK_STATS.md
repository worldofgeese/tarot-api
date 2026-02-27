# Task: Add GET /api/stats endpoint

## Context
Tarot API — Bun/Elysia app. SQLite DB with a `cards` table.

## What to do

1. Add `GET /api/stats` endpoint in `src/routes/api.ts` that returns:
   ```json
   { "totalCards": 78, "majorArcana": 22, "minorArcana": 56, "suits": ["Wands","Cups","Swords","Pentacles"] }
   ```
   Query the DB for real counts. Major arcana = cards where suit is NULL or empty.

2. Add tests in `tests/stats.test.ts` covering:
   - Returns 200
   - totalCards = 78
   - majorArcana + minorArcana = totalCards
   - suits array contains exactly 4 items

3. Run `bun test tests/stats.test.ts` to verify.
4. Commit with message "feat: add GET /api/stats endpoint"
5. Push to origin.
