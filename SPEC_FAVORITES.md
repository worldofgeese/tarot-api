# SPEC: Favorites / Bookmarked Cards

## Overview
Let users bookmark cards they find meaningful. Simple CRUD with a notes field.

## New Table
```sql
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id)
);
```

## Endpoints

### POST /api/favorites
- Body: `{ "cardId": 0, "note": "This card spoke to me" }`
- note is optional (defaults to empty string)
- Returns created favorite with full card data (201)
- Duplicate cardId allowed (user can bookmark same card multiple times with different notes)
- Invalid cardId → 404

### GET /api/favorites
- Query: `?limit=20&offset=0&sort=newest`
- sort: "newest" (default) or "oldest"
- Returns: `{ "favorites": [...], "total": 5 }`
- Each favorite includes full card object + note + created_at

### DELETE /api/favorites/:id
- Deletes by favorite ID (not card ID)
- 404 if not found
- Returns 204 No Content

## Acceptance Criteria
- AC1: POST creates favorite, returns 201 with card data
- AC2: Invalid cardId → 404
- AC3: GET returns favorites with card data, respects limit/offset
- AC4: sort=oldest reverses order
- AC5: DELETE removes favorite, returns 204
- AC6: DELETE non-existent → 404
- AC7: Can bookmark same card twice with different notes
