# Task 2: Add Spread API Endpoints

Read CLAUDE.md first — follow every step including decapod init.

## Prerequisite
`src/spreads.ts` already exists with `getSpread()` and `listSpreads()`.

## What to modify: `src/routes/api.ts`

Add import at top:
```typescript
import { getSpread, listSpreads } from "../spreads";
```

Append these endpoints (inside the existing chain):

1. `GET /api/spreads` — returns `listSpreads()`
2. `GET /api/spreads/:id` — returns `getSpread(id)`, 404 if not found
3. `POST /api/spreads/:id/draw` — draws a spread:
   - Get spread definition, return 404 if not found
   - Query: `SELECT * FROM cards ORDER BY RANDOM() LIMIT ?` with position count
   - Map each position to a card with `reversed: Math.random() < 0.5`
   - Return `{ spread, cards: [{ position, card: {...card, keywords: JSON.parse(card.keywords)}, reversed }] }`

## TDD: Create `tests/spreads-api.test.ts` FIRST with:
- GET /api/spreads returns 200 with 3 spreads
- GET /api/spreads/three-card returns correct definition
- GET /api/spreads/invalid returns 404
- POST /api/spreads/three-card/draw returns 3 cards
- POST /api/spreads/celtic-cross/draw returns 10 cards  
- All drawn cards are unique
- Each card has reversed boolean
- POST /api/spreads/invalid/draw returns 404

Write tests, commit as failing, THEN implement endpoints, commit.
## Do NOT modify existing endpoints or tests. Do NOT push.
