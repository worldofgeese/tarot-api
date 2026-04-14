# Interfaces

## Contract Principles
- All endpoints return JSON (Content-Type: application/json)
- Errors return `{error: string}` with appropriate HTTP status code
- No authentication required on any endpoint
- All responses are idempotent (GET-only endpoints)

## API Contracts

| Endpoint | Response Schema | Error Codes |
|---|---|---|
| GET /api/health | `{status: "ok", card_count: number}` | 500 on DB failure |
| GET /api/version | `{api_name: string, version: string, card_count: number}` | 500 on DB failure |
| GET /api/stats | `{totalCards, majorArcana, minorArcana, suits}` | 500 on DB failure |
| GET /api/cards | `Card[]` (all 78) | 500 on DB failure |
| GET /api/cards/:id | `Card` | 400 invalid id, 404 not found |
| GET /api/cards/random | `Card[]` (count param) | 400 invalid count |
| GET /api/cards/search | `Card[]` filtered | 400 missing query |
| GET /api/daily | `Card` + `reversed: boolean` | 400 invalid date |
| GET /api/meaning/:id | `{id, name, upright, reversed}` | 400/404 |
| GET /api/spreads | `Spread[]` | 500 on DB failure |
| GET /api/spread/:name | `{spread, cards[]}` | 404 unknown spread |

## Card Schema
```typescript
interface Card {
  id: number;           // 0-77
  name: string;
  arcana: string;       // "major" | "minor"
  suit: string | null;  // null for Major Arcana
  number: number | null;
  keywords: string[];   // parsed from comma-separated DB field
  upright_meaning: string;
  reversed_meaning: string;
  element: string | null;
  planet: string | null;
  zodiac: string | null;
}
```

## Outbound Dependencies
None — this is a fully local, offline-capable API with no external service calls at runtime.

## Error Policy
- 400: Client error (invalid parameter format/value)
- 404: Resource not found
- 500: Internal error (DB failure, unexpected exception)
- All errors: `{error: "<human-readable message>"}`

## Inbound Contracts
All inbound traffic is HTTP/1.1 GET requests from browsers or API clients. No authentication headers are required or enforced.

## Data Ownership
The SQLite database (`tarot.db`) is the sole owner of all card and spread data. No other system writes to it. The API is read-only.

## Failure Semantics
- Network failures: callers should retry with exponential backoff (no idempotency concerns — all reads)
- Database errors: propagated as HTTP 500 with `{error: "..."}` body
- Invalid parameters: HTTP 400 with descriptive error message
- Not found: HTTP 404 with `{error: "..."}` body
