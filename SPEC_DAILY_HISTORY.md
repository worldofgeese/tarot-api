# SPEC: Card of the Day History

## Overview
Track which daily card was served on each date, allowing users to look back at past daily draws.

## New Table
```sql
CREATE TABLE IF NOT EXISTS daily_history (
  date TEXT PRIMARY KEY,
  card_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id)
);
```

## Behavior Changes
- Modify the existing `GET /daily` endpoint: after computing the daily card, INSERT OR IGNORE into `daily_history`
- New endpoint: `GET /api/daily/history?limit=7&offset=0`
  - Returns past daily cards with their dates
  - Default limit 7, max 30
  - Response: `{ "history": [{ "date": "2026-04-22", "card": { ...full card object } }], "total": 15 }`
- New endpoint: `GET /api/daily/history/:date`
  - Returns the specific card for a given date
  - 404 if no record for that date
  - Date format: YYYY-MM-DD

## Acceptance Criteria
- AC1: Calling GET /daily writes to daily_history
- AC2: Calling GET /daily twice on same date doesn't duplicate
- AC3: GET /api/daily/history returns recent entries, newest first
- AC4: GET /api/daily/history/2026-04-22 returns specific card
- AC5: GET /api/daily/history/2099-01-01 returns 404
- AC6: limit capped at 30
