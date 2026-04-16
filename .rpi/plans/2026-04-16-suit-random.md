# RPI Plan: GET /api/cards/suit/:suit/random

## Metadata
- date: 2026-04-16
- status: active
- type: plan
- design: null
- soulforge-session: e231f81d

## What
Add `GET /api/cards/suit/:suit/random` endpoint — returns a random card from a specific suit.

Suits: wands, cups, swords, pentacles (major arcana has no suit → 404 if suit=major)

SoulForge blast-radius: api.ts has 3 direct dependents (tests/api.test.ts, src/index.ts, pages.ts). LOW RISK.

## Phases

### Phase 1: Failing tests (commit before implementation)
New file: `tests/suit-random.test.ts`

Tests:
```
test("GET /api/cards/suit/wands/random returns a wands card")
test("GET /api/cards/suit/cups/random returns a cups card")  
test("GET /api/cards/suit/swords/random returns a swords card")
test("GET /api/cards/suit/pentacles/random returns a pentacles card")
test("GET /api/cards/suit/invalid/random returns 400")
test("GET /api/cards/suit/major/random returns 404 (no suit for major arcana)")
```

Verification: `bun test tests/suit-random.test.ts` — all FAIL

### Phase 2: Implementation
File: `src/routes/api.ts` — add after existing /cards/suit/:suit route

```typescript
.get("/cards/suit/:suit/random", ({ params: { suit }, set }) => {
  const validSuits = ["wands", "cups", "swords", "pentacles"];
  if (!validSuits.includes(suit.toLowerCase())) {
    set.status = 400;
    return { error: `Invalid suit. Must be one of: ${validSuits.join(", ")}` };
  }
  const card = db.query(
    "SELECT * FROM cards WHERE suit = ? ORDER BY RANDOM() LIMIT 1"
  ).get(suit.toLowerCase()) as Card | null;
  if (!card) { set.status = 404; return { error: "No cards found for suit" }; }
  return { ...card, keywords: parseKeywords(card.keywords) };
})
```

Verification: `bun test tests/suit-random.test.ts` — all PASS. `bun test` — all pass.

### Phase 3: Manual exercise evidence
Start server, curl all 4 suits + invalid + major → save to gate-evidence/

## Constraints
- Only modify: `src/routes/api.ts`, new `tests/suit-random.test.ts`
- Do NOT touch: any existing files beyond api.ts
- No new dependencies
- Tests commit BEFORE implementation commit
