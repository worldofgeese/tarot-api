# Plan: DELETE /api/readings/:id

**Date:** 2026-04-16
**Branch:** agent/01kpau/delete-reading

## Goal

Add `DELETE /api/readings/:id` to remove a reading permanently.

## Acceptance Criteria

- `DELETE /api/readings/:id` → 204 No Content
- After delete: `GET /api/readings/:id` → 404
- `DELETE /api/readings/9999` → 404 `{ error: "Reading not found" }`
- `DELETE /api/readings/abc` → 400 `{ error: "Invalid id" }`
- `DELETE /api/readings/-1` → 400 `{ error: "Invalid id" }`

## Implementation

Route: `.delete("/readings/:id", ...)` after PUT in `src/routes/api.ts`
Validation: `parseInt(id)` — 400 if NaN or < 0
Existence check: `SELECT id FROM readings WHERE id = ?`
Delete: `DELETE FROM readings WHERE id = ?`
Return: 204 with null body

## Test File

`tests/delete-reading.test.ts` using `createApp(":memory:")`
5 tests, all passing.
