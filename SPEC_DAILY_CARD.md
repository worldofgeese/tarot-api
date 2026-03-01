# Spec: Daily Card Feature

## Summary
Add a "daily card" feature — a deterministic card-of-the-day based on the current date. Same card for everyone on the same day, changes at midnight UTC.

## Requirements

### API Endpoint
- `GET /api/daily` — returns the card of the day
- Response shape: same as `GET /api/cards/:id` (single card object with parsed keywords)
- Add `date` field (ISO 8601 date string, e.g. `"2026-02-28"`) and `reversed` (boolean, deterministic per day)
- The card selection must be deterministic: same date → same card, every time. Use a hash of the date string seeded against the 78-card deck.
- Do NOT use `Math.random()` or `ORDER BY RANDOM()`. Use a pure function of the date.

### Implementation
- Add a `getDailyCard(db: Database, date?: Date): { card: Card, date: string, reversed: boolean }` function in a new file `src/lib/daily.ts`
- Wire it into `src/routes/api.ts` as `GET /api/daily`
- Hash function: use a simple numeric hash of the ISO date string, mod 78 for card index, mod 2 for reversed

### Tests (write FIRST, then implement)
- Create `tests/daily.test.ts` with these failing tests before writing any implementation:

1. `GET /api/daily` returns 200
2. Response has `id`, `name`, `keywords` (array), `date`, `reversed` fields
3. Two requests on the same day return the same card
4. The `date` field matches today's UTC date
5. `reversed` is a boolean
6. Card is a valid card (id between 0 and 77)

### Constraints
- Do not modify any existing tests
- Do not modify any existing endpoints
- All 79 currently passing tests must still pass after your changes
- Run `bun test` (excluding e2e) to verify: `bun test --filter "!e2e"`

## Acceptance Criteria
- [ ] `tests/daily.test.ts` exists with 6+ test cases
- [ ] `src/lib/daily.ts` exists with pure `getDailyCard` function  
- [ ] `GET /api/daily` returns correct response
- [ ] All tests pass: `bun test --filter "!e2e"` shows 0 failures
- [ ] No existing tests broken
