# RPI Plan: GET /api/cards/random endpoint

## Metadata
- date: 2026-04-16
- status: draft
- type: plan
- design: null

## What
Add `GET /api/cards/random` endpoint to tarot-api that returns 1..N random cards from the full deck.

## Why
End-to-end SDLC pipeline test. Small, well-bounded, real feature.

## Phases

### Phase 1: Failing tests (commit before implementation)
**Files to modify:** `tests/swamp-forgejo-model.test.ts` is NOT touched. New test file: `tests/random-card.test.ts`

**Tests to write (must fail first):**
```typescript
test("GET /api/cards/random returns a single card by default")
test("GET /api/cards/random?count=3 returns exactly 3 cards")
test("GET /api/cards/random?count=0 returns 400")
test("GET /api/cards/random?count=79 returns 400 (max is 78)")
test("GET /api/cards/random returns unique cards (no duplicates in one draw)")
```

**Verification:** `bun test tests/random-card.test.ts` — all 5 FAIL

### Phase 2: Implementation
**Files to modify:** `src/routes/api.ts`

**What to add:**
```typescript
.get("/cards/random", ({ query, set }) => {
  const count = parseInt(query.count ?? "1");
  if (isNaN(count) || count < 1 || count > 78) {
    set.status = 400;
    return { error: "count must be 1–78" };
  }
  // shuffle all cards, take first N, return
  const allCards = db.query("SELECT * FROM cards").all() as Card[];
  const shuffled = allCards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
})
```

**Verification:** `bun test tests/random-card.test.ts` — all 5 PASS. `bun test` — all pass.

### Phase 3: Manual exercise evidence
```bash
curl http://localhost:3000/api/cards/random
curl "http://localhost:3000/api/cards/random?count=3"
curl "http://localhost:3000/api/cards/random?count=0"  # expect 400
```
Save output to `gate-evidence/manual-exercise-random-card.txt`

## Constraints
- Only modify: `src/routes/api.ts`, new `tests/random-card.test.ts`
- Do NOT modify: any existing test files, schema, Swamp models
- No new dependencies
- Tests and implementation in SEPARATE commits

## Success criteria
- 5 new tests pass
- All 202 existing tests still pass
- Endpoint returns valid card objects matching the existing schema
- 400 for invalid count
