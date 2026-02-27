# Task: Add GET /api/cards/suit/:suit endpoint

## Context
Tarot API — Bun/Elysia app. SQLite DB with a `cards` table. Suits: Wands, Cups, Swords, Pentacles.

## Branch
Create and work on branch: `feat/cards-by-suit`
Do NOT work on main.

## TDD
Write failing tests FIRST in `tests/cards-by-suit.test.ts`. Commit them with message "test: add failing tests for cards-by-suit".
Then implement until tests pass. Commit with message "feat: add GET /api/cards/suit/:suit endpoint".

## What to do

1. Add `GET /api/cards/suit/:suit` endpoint in `src/routes/api.ts` that:
   - Returns all cards matching the given suit (case-insensitive)
   - Returns 404 with `{ error: "No cards found for suit" }` if suit doesn't exist
   - Cards sorted by number ascending

2. Tests must cover:
   - Returns 200 with 14 cards for suit "Wands"
   - Case-insensitive: "wands" works same as "Wands"
   - Returns 404 for suit "InvalidSuit"
   - All returned cards have matching suit field
   - Cards sorted by number ascending

## Constraints
- Only modify: `src/routes/api.ts` (append endpoint)
- Only create: `tests/cards-by-suit.test.ts`
- Do NOT modify any existing tests or endpoints
- Do NOT push. Commit only.

## Self-Review (mandatory before final commit)
Re-read your entire diff. List:
1. Three things that could break or that you're uncertain about
2. Any edge cases you didn't test
3. Whether you followed TDD (tests committed before implementation)
