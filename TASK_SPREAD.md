# Task: Add Tarot Spread System

## Context
Tarot API — Bun/Elysia app. SQLite DB with a `cards` table containing 78 tarot cards.

## Branch
Create and work on branch: `feat/spread-system`
Do NOT work on main.

## Overview
Implement a complete tarot spread system with three components:
1. A new `spreads` module with spread definitions
2. New API endpoints for generating spreads
3. Comprehensive tests

This is a multi-file, multi-concern task. **Use agent teams** to parallelize:
- Subagent 1: Create the spread definitions module
- Subagent 2: Create the API endpoints
- Subagent 3: Create the tests

## TDD
Write failing tests FIRST. Commit them. Then implement. Commit separately.

## What to do

### Part 1: Spread Definitions (`src/spreads.ts`)
Create a new file with:
```typescript
export interface SpreadPosition {
  name: string;
  meaning: string;
}

export interface SpreadDefinition {
  id: string;
  name: string;
  description: string;
  positions: SpreadPosition[];
}
```

Define three spreads:
- **three-card**: Past / Present / Future (3 positions)
- **celtic-cross**: 10 positions (Significator, Crossing, Foundation, Recent Past, Crown, Future, Self, Environment, Hopes/Fears, Outcome)
- **horseshoe**: 7 positions (Past, Present, Hidden Influences, Obstacles, External Influences, Suggestion, Outcome)

Export a `getSpread(id: string)` function and a `listSpreads()` function.

### Part 2: API Endpoints (append to `src/routes/api.ts`)
- `GET /api/spreads` — returns all spread definitions
- `GET /api/spreads/:id` — returns a specific spread definition, 404 if not found
- `POST /api/spreads/:id/draw` — draws a random spread:
  - Selects random non-repeating cards for each position
  - Returns `{ spread: SpreadDefinition, cards: Array<{ position: SpreadPosition, card: Card, reversed: boolean }> }`
  - `reversed` is randomly true/false (50% chance)
  - Returns 404 if spread id not found

### Part 3: Tests (`tests/spreads.test.ts`)
- GET /api/spreads returns 200 with 3 spreads
- GET /api/spreads/three-card returns correct definition
- GET /api/spreads/invalid returns 404
- POST /api/spreads/three-card/draw returns 3 cards
- POST /api/spreads/celtic-cross/draw returns 10 cards
- All drawn cards are unique (no duplicates)
- Each card has a `reversed` boolean field
- POST /api/spreads/invalid/draw returns 404

## Constraints
- Create: `src/spreads.ts`, `tests/spreads.test.ts`
- Modify: `src/routes/api.ts` (append endpoints, add import)
- Do NOT modify any existing tests or endpoints
- Do NOT push. Commit only.

## Self-Review (mandatory before final commit)
Re-read your entire diff. List:
1. Three things that could break or that you're uncertain about
2. Any edge cases you didn't test
3. Whether you followed TDD (tests committed before implementation)
4. Whether you used agent teams for parallel work

## Validation
After implementation:
- Run `bun test tests/spreads.test.ts`
- Run `decapod validate` if available
