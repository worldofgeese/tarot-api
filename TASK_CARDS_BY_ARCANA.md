# Task: Add GET /api/cards/arcana/:type endpoint

## Context
Tarot API — Bun/Elysia app. SQLite DB with a `cards` table. Arcana: "major" (22 cards, suit IS NULL) and "minor" (56 cards, have suits).

## Branch
Create and work on branch: `feat/cards-by-arcana`
Do NOT work on main.

## TDD
Write failing tests FIRST in `tests/cards-by-arcana.test.ts`. Commit them with message "test: add failing tests for cards-by-arcana".
Then implement until tests pass. Commit with message "feat: add GET /api/cards/arcana/:type endpoint".

## What to do

1. Add `GET /api/cards/arcana/:type` endpoint in `src/routes/api.ts` that:
   - Accepts "major" or "minor" (case-insensitive)
   - For "major": returns cards where suit IS NULL or empty
   - For "minor": returns cards where suit IS NOT NULL and not empty
   - Returns 400 with `{ error: "Invalid arcana type. Use 'major' or 'minor'" }` for other values

2. Tests must cover:
   - Returns 200 with 22 cards for "major"
   - Returns 200 with 56 cards for "minor"
   - Case-insensitive: "Major" works same as "major"
   - Returns 400 for "invalid"
   - Major arcana cards have null/empty suit
   - Minor arcana cards all have non-null suit

## Constraints
- Only modify: `src/routes/api.ts` (append endpoint)
- Only create: `tests/cards-by-arcana.test.ts`
- Do NOT modify any existing tests or endpoints
- Do NOT push. Commit only.

## Self-Review (mandatory before final commit)
Re-read your entire diff. List:
1. Three things that could break or that you're uncertain about
2. Any edge cases you didn't test
3. Whether you followed TDD (tests committed before implementation)
