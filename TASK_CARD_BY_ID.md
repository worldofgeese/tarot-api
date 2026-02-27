# Task: Add GET /api/cards/:id endpoint

## Context
Tarot API — Bun/Elysia app. SQLite DB with a `cards` table containing 78 tarot cards.

## Branch
Create and work on branch: `feat/card-by-id`
Do NOT work on main.

## TDD
Write failing tests FIRST in `tests/card-by-id.test.ts`. Commit them with message "test: add failing tests for card-by-id".
Then implement until tests pass. Commit with message "feat: add GET /api/cards/:id endpoint".

## What to do

1. Add `GET /api/cards/:id` endpoint in `src/routes/api.ts` that:
   - Returns the card matching the given id
   - Returns 404 with `{ error: "Card not found" }` if id doesn't exist
   - Returns 400 with `{ error: "Invalid id" }` if id is not a number

2. Tests must cover:
   - Returns 200 with a valid card for id=1
   - Card has expected fields (id, name, arcana, suit, keywords)
   - Returns 404 for id=999
   - Returns 400 for id="abc"

## Constraints
- Only modify: `src/routes/api.ts` (append endpoint)
- Only create: `tests/card-by-id.test.ts`
- Do NOT modify any existing tests or endpoints
- Do NOT push. Commit only.

## Self-Review (mandatory before final commit)
Re-read your entire diff. List:
1. Three things that could break or that you're uncertain about
2. Any edge cases you didn't test
3. Whether you followed TDD (tests committed before implementation)
