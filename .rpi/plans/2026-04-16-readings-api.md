# Plan: Readings/Journaling API

**Date:** 2026-04-16
**Branch:** agent/01kpaj/readings-api
**Decapod todo:** bend_01kpajvybv25gkbp
**SoulForge session:** 1a0d1973

## Goal

Add reading/journaling persistence to the tarot-api:
- `POST /api/readings` — save a reading (spread_type, cards_json, notes)
- `GET /api/readings` — list all readings (paginated, limit/offset)
- `GET /api/readings/:id` — retrieve a single reading

This is Phase 3 of the Digital Grimoire roadmap (user journaling).

## Constraints

- Do NOT modify existing routes — additive only
- Follow existing patterns: validateCardId, error response shape `{ error: "..." }`
- Use in-memory DB for tests (existing pattern)
- cards_json must be valid JSON array of card IDs — validate before storage
- spread_type must be one of: "single", "three-card", "celtic-cross", "custom"
- notes is optional string, max 2000 chars
- Return 400 for invalid input, 404 for missing reading

## SoulForge Blast-Radius Findings

- `src/db/schema.ts` — add readings table (1 dependent: api.ts)
- `src/routes/api.ts` — add 3 new routes (existing: 3 dependents)
- `tests/readings.test.ts` — new test file
- `tests/api.test.ts` — extend with readings smoke tests
- Co-change risk: `src/lib/reversed.ts` and `tests/e2e/cli.ts` often change with api.ts — check after impl

## Schema

```sql
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spread_type TEXT NOT NULL CHECK(spread_type IN ('single','three-card','celtic-cross','custom')),
  cards_json TEXT NOT NULL,   -- JSON array of card IDs e.g. [1,5,22]
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Test Plan (TDD — tests first)

### Phase 1: RED (failing tests)
- [ ] `POST /api/readings` — 201 with valid body, returns `{id, spread_type, created_at}`
- [ ] `POST /api/readings` — 400 for missing spread_type
- [ ] `POST /api/readings` — 400 for invalid spread_type
- [ ] `POST /api/readings` — 400 for non-JSON cards_json
- [ ] `POST /api/readings` — 400 for notes > 2000 chars
- [ ] `GET /api/readings` — 200 returns array (paginated)
- [ ] `GET /api/readings/:id` — 200 returns reading
- [ ] `GET /api/readings/:id` — 404 for missing id
- [ ] `GET /api/readings/:id` — 400 for non-numeric id

### Phase 2: GREEN (implementation)
- [ ] Add readings table to schema.ts
- [ ] Add POST /api/readings route with validation
- [ ] Add GET /api/readings route with limit/offset
- [ ] Add GET /api/readings/:id route
- [ ] All Phase 1 tests pass

## Acceptance Criteria

- All unit tests pass (incl. existing 214)
- Manual exercise: POST a reading, GET it back by ID, list all readings
- No existing routes broken
- Error responses consistent with existing API

## Implementation Notes

- Reuse `validateCardId` pattern for ID validation
- Reuse `parseKeywords()` approach for JSON validation
- Insert with `db.prepare(...).run(...)` pattern (matches existing inserts)
- Response shape: `{ id, spread_type, cards_json, notes, created_at }`
