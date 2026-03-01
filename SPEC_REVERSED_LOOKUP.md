# Spec: Reversed Meaning Lookup Endpoint

## Summary
Add a `GET /api/cards/reversed` endpoint that returns all cards where the reversed meaning contains a given keyword. Useful for "what card means X when reversed?" queries.

## Requirements

### API Endpoint
- `GET /api/cards/reversed?q=<keyword>` — search reversed meanings only
- Returns array of matching cards (same shape as `GET /api/cards` items)
- Empty `q` or missing `q` returns 400 with `{ error: "query parameter q is required" }`
- No results returns 200 with empty array `[]`
- Case-insensitive search

### Implementation
- Add a `searchReversed(db: Database, query: string): Card[]` function in `src/lib/reversed.ts`
- Wire into `src/routes/api.ts` as `GET /api/cards/reversed`
- Use SQL LIKE with `%query%` on the `reversed_meaning` column (not FTS5 — keep it simple)

### Tests (write FIRST, then implement)
- Create `tests/reversed.test.ts` with these failing tests before writing any implementation:

1. `GET /api/cards/reversed?q=fear` returns 200
2. Response is an array
3. Every result's `reversed_meaning` contains the query string (case-insensitive)
4. `GET /api/cards/reversed` (no q param) returns 400
5. `GET /api/cards/reversed?q=` (empty q) returns 400
6. `GET /api/cards/reversed?q=xyznonexistent` returns 200 with empty array
7. Results include `id`, `name`, `arcana`, `reversed_meaning` fields
8. `GET /api/cards/reversed?q=loss` returns at least 1 result

### Constraints
- Do not modify any existing tests
- Do not modify any existing endpoints — only ADD the new route
- All 85 currently passing tests must still pass after your changes
- Run `bun test` to verify (exclude e2e: the 10 e2e failures are expected/known)

## Acceptance Criteria
- [ ] `tests/reversed.test.ts` exists with 8 test cases
- [ ] `src/lib/reversed.ts` exists with `searchReversed` function
- [ ] `GET /api/cards/reversed?q=fear` returns matching cards
- [ ] All non-e2e tests pass: 85 + 8 new = 93 passing
