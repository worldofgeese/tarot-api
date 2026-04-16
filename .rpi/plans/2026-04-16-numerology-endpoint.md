# Plan: Numerology Endpoint

**Date:** 2026-04-16
**Branch:** agent/01kpan/numerology-endpoint
**Decapod todo:** bend_01kpanh88nb20aq8

## Goal

Add `GET /api/cards/numerology/:number` endpoint.
Returns all cards whose `number` field matches the given numerology number (0-21 for Major Arcana, 1-14 for Minor Arcana).

## Constraints

- Additive only — do not modify existing routes
- Return 400 for non-integer or out-of-range (negative) number
- Return 200 with empty array if no cards match (not 404)
- Follow existing patterns in src/routes/api.ts

## Schema

No schema changes. Uses existing `cards` table, `number` column.

## Test Plan (TDD)

### Phase 1: RED
- [ ] `GET /api/cards/numerology/1` → 200 with The Magician (+ Aces)
- [ ] `GET /api/cards/numerology/0` → 200 with The Fool
- [ ] `GET /api/cards/numerology/99` → 200 empty array
- [ ] `GET /api/cards/numerology/abc` → 400 invalid number
- [ ] `GET /api/cards/numerology/-1` → 400 invalid number

### Phase 2: GREEN
- [ ] Add GET /api/cards/numerology/:number to src/routes/api.ts
- [ ] All tests pass

## Implementation

Query: `SELECT * FROM cards WHERE number = ?`
Params: parsed integer from `:number`
Response: array of card objects (same shape as GET /api/cards)

## Acceptance Criteria

- numerology/1 returns The Magician + all Aces (5 cards total)
- numerology/0 returns The Fool
- numerology/abc returns 400
- All existing 232 tests still pass
