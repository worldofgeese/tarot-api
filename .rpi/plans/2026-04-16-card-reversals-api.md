# RPI Plan: Card Reversals API

**Date:** 2026-04-16  
**Branch:** agent/01kpar/card-reversals-api  
**Worktree:** /tmp/tarot-run3

## Objective
Add `GET /api/cards/:id/reversal` endpoint to return the reversed meaning of a tarot card.

## Schema Context
The `cards` table has a `reversed_meaning` column (TEXT NOT NULL) that stores the reversed interpretation for each card.

## Endpoint Specification

### Route
`GET /api/cards/:id/reversal`

### Success Response (200)
```json
{
  "id": 0,
  "name": "The Fool",
  "reversed": "<reversed meaning text>"
}
```

### Error Responses
- **400 Bad Request**: Invalid card ID (non-integer)
  ```json
  { "error": "Invalid id" }
  ```
- **404 Not Found**: Card not found
  ```json
  { "error": "Card not found" }
  ```

## Implementation Pattern
Following existing patterns from `/api/cards/:id` and `/api/meaning/:id`:
1. Use `validateCardId()` middleware for input validation
2. Query database with parameterized query
3. Return error object with appropriate HTTP status codes
4. Position route after existing card routes in `src/routes/api.ts`

## TDD Checklist

- [ ] **RED Phase**: Write failing tests in `tests/reversals.test.ts`
  - [ ] Test: `GET /api/cards/0/reversal` → 200 with reversed meaning
  - [ ] Test: `GET /api/cards/999/reversal` → 404 "Card not found"
  - [ ] Test: `GET /api/cards/abc/reversal` → 400 "Invalid id"
  - [ ] Run tests, confirm failures
  - [ ] Commit: "test: failing tests for card reversals endpoint (RED)"

- [ ] **GREEN Phase**: Implement the endpoint in `src/routes/api.ts`
  - [ ] Add route handler after line 211 (after `GET /api/cards/:id`)
  - [ ] Use `validateCardId()` for input validation
  - [ ] Query: `SELECT id, name, reversed_meaning FROM cards WHERE id = ?`
  - [ ] Return `{ id, name, reversed: reversed_meaning }`
  - [ ] Handle 404 when card not found
  - [ ] Run all tests with `bun test --timeout 60000`
  - [ ] Verify 0 failures
  - [ ] Commit: "feat: GET /api/cards/:id/reversal (GREEN)"

## Validation & Completion

- [ ] Run `decapod validate` → must pass
- [ ] Run `/rpi-verify` → check implementation matches plan
- [ ] Push to `origin agent/01kpar/card-reversals-api`
- [ ] Curate with ByteRover (or append to session log)

## Notes
- Use in-memory DB pattern from `tests/numerology.test.ts` but adjusted for real DB
- Match error message format exactly: "Invalid id" and "Card not found"
- Response shape is simplified compared to full card object (only id, name, reversed)
