# SPEC: Card Count in Health Endpoint

## Change
Add `cardCount` field to the existing `GET /api/health` response.

## Current Response
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected",
  "version": "1.0.0"
}
```

## New Response
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected",
  "version": "1.0.0",
  "cardCount": 78
}
```

## Implementation
- In `src/routes/api.ts`, in the `/health` handler, add a `SELECT COUNT(*) as count FROM cards` query
- Return the count as `cardCount` in the response
- If the count query fails, set `cardCount: 0` (don't let it break the health endpoint)

## Tests (add to existing `tests/health.test.ts`)
1. Response has `cardCount` field
2. `cardCount` is a number
3. (Don't test for exactly 78 — the test uses an in-memory db with no data)

## Constraints
- Only modify: `src/routes/api.ts`, `tests/health.test.ts`
- All existing tests must still pass
- Branch: `feat/health-cardcount`
