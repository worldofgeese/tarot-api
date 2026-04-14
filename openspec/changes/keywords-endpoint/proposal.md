# Proposal: GET /api/cards/keywords endpoint

## What

Add `GET /api/cards/keywords` returning all unique keywords from all 78 cards, sorted alphabetically.

## Response

```json
{ "keywords": ["abundance", "adventure", "awareness", ...] }
```

## Why

Enables keyword cloud / filter UI. Currently no way to enumerate all keywords without fetching all 78 cards and parsing client-side.

## Constraints

- Single DB query (no N+1)
- Deduplicated, sorted
- 200ms max response time
- Covered by unit test

## Acceptance Criteria

- [ ] GET /api/cards/keywords returns 200 with `{ keywords: string[] }`
- [ ] Array is sorted alphabetically
- [ ] No duplicates
- [ ] Unit test covers success path and verifies sort + uniqueness
