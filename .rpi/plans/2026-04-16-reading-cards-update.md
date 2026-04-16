# Plan: PUT /api/readings/:id — Update Reading

**Date:** 2026-04-16
**Branch:** agent/01kpas/reading-cards-update

## Goal

Add `PUT /api/readings/:id` endpoint to update notes and/or spread_type on an existing reading.

## Constraints

- Additive only — do not modify existing routes
- Partial update: only provided fields change, others preserved
- At least one field required (400 if neither provided)
- Follow existing error shape: `{ error: "..." }`
- Return full updated reading object on success

## Acceptance Criteria

- `PUT /api/readings/:id { notes }` → 200 with updated reading
- `PUT /api/readings/:id { spread_type }` → 200 with updated reading
- `PUT /api/readings/:id { notes, spread_type }` → 200 with both updated
- `PUT /api/readings/9999 { notes }` → 404 `{ error: "Reading not found" }`
- `PUT /api/readings/abc { notes }` → 400 `{ error: "Invalid id" }`
- `PUT /api/readings/:id { spread_type: "invalid" }` → 400 `{ error: "Invalid spread_type..." }`
- `PUT /api/readings/:id {}` → 400 `{ error: "At least one field (notes or spread_type) is required" }`
- notes > 2000 chars → 400
- All existing 236 tests still pass

## Implementation

Route: `.put("/readings/:id", ...)` in `src/routes/api.ts`
Query: `UPDATE readings SET field1 = ?, field2 = ? WHERE id = ?`
Validation: same patterns as POST /api/readings

## Test File

`tests/reading-update.test.ts` using `createApp(":memory:")`
