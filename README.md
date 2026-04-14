# Tarot API

A three-tier tarot card application with SQLite database, Elysia API, and server-rendered HTML frontend.

## Features

- **78 Tarot Cards**: Complete deck with Major and Minor Arcana
- **Full-Text Search**: FTS5-powered search across card names, meanings, and keywords
- **Interactive Spreads**: Single card, 3-card, and Celtic Cross spreads
- **Dark Theme**: Deep purple/indigo aesthetic perfect for mystical exploration
- **Mobile Responsive**: Works beautifully on all screen sizes

## Architecture

### Tier 1: SQLite Database
- 78 tarot cards with full metadata
- FTS5 full-text search index
- Efficient querying and filtering

### Tier 2: Bun/Elysia API

Complete REST API — all endpoints below.

### Tier 3: HTML Frontend
- Landing page with all 78 cards
- Card detail pages with full information
- Interactive spread drawing
- Live search functionality

## Tech Stack

- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: bun:sqlite with FTS5
- **Templates**: Tagged template literals
- **Tests**: bun:test (unit + integration + E2E)
- **E2E**: Playwright via bun:test

## Getting Started

### Install Dependencies

```bash
bun install
```

### Seed Database

```bash
bun run seed
```

### Run Development Server

```bash
bun run dev
```

The application will be available at http://localhost:3000

### Run Tests

```bash
bun test --timeout 60000
```

## API Reference

All endpoints return `application/json`. Errors return `{ "error": "..." }` with appropriate status codes.

### Health & Metadata

| Endpoint | Description | Response |
|---|---|---|
| `GET /api/health` | Health check + DB card count | `{ status, card_count }` |
| `GET /api/version` | API name, version, card count | `{ api_name, version, card_count }` |
| `GET /api/stats` | Card distribution stats | `{ totalCards, majorArcana, minorArcana, suits }` |

### Cards

| Endpoint | Description | Response |
|---|---|---|
| `GET /api/cards` | All 78 cards | `Card[]` |
| `GET /api/cards/:id` | Single card by id (0–77) | `Card` |
| `GET /api/cards/random` | Random card(s) (`?count=N`) | `Card[]` |
| `GET /api/cards/reversed` | Random card with reversed flag | `{ card, reversed }` |
| `GET /api/cards/search?q=` | Keyword/name search | `Card[]` |
| `GET /api/search?q=` | Alias for cards/search | `Card[]` |

### Filters

| Endpoint | Description | Response |
|---|---|---|
| `GET /api/cards/arcana/:type` | Filter by `major` or `minor` | `Card[]` |
| `GET /api/cards/suit/:suit` | Filter by suit (wands/cups/swords/pentacles) | `Card[]` |
| `GET /api/cards/element/:element` | Filter by element (fire/water/air/earth) | `Card[]` |

### Readings

| Endpoint | Description | Response |
|---|---|---|
| `GET /api/daily` | Daily card (date-seeded, `?date=YYYY-MM-DD`) | `{ card, reversed, date }` |
| `GET /api/meaning/:id` | Upright + reversed meanings for card | `{ id, name, upright, reversed }` |
| `GET /api/spreads` | All available spread layouts | `Spread[]` |
| `GET /api/spreads/:id` | Specific spread layout | `Spread` |
| `POST /api/spreads/:id/draw` | Draw cards for a spread | `{ spread, cards[] }` |
| `GET /api/spread/:type` | Draw spread by type (single/3-card/celtic-cross) | `{ type, positions[] }` |

### Error Codes

| Code | Meaning |
|---|---|
| 400 | Invalid parameter (bad format or value) |
| 404 | Resource not found |
| 500 | Internal server error (DB failure) |

### Card Schema

```typescript
interface Card {
  id: number;           // 0–77
  name: string;
  arcana: "major" | "minor";
  suit: string | null;  // null for Major Arcana
  number: number | null;
  keywords: string[];
  upright_meaning: string;
  reversed_meaning: string;
  image_desc: string;
}
```

## API Examples

```bash
# Health check
curl http://localhost:3000/api/health

# All 78 cards
curl http://localhost:3000/api/cards

# Single card (The Fool)
curl http://localhost:3000/api/cards/0

# Daily card
curl http://localhost:3000/api/daily

# Search
curl "http://localhost:3000/api/cards/search?q=love"

# Filter by element
curl http://localhost:3000/api/cards/element/fire

# Random card
curl http://localhost:3000/api/cards/random

# Draw a 3-card spread
curl http://localhost:3000/api/spread/3-card

# Card meanings
curl http://localhost:3000/api/meaning/0

# Version info
curl http://localhost:3000/api/version
```

## Project Structure

```
tarot-api/
├── data/
│   ├── cards.json          # Source card data
│   └── tarot.db            # SQLite database (generated)
├── src/
│   ├── index.ts            # Main application entry
│   ├── db/
│   │   ├── schema.ts       # Database schema and initialization
│   │   └── seed.ts         # Database seeding script
│   ├── routes/
│   │   ├── api.ts          # JSON API routes (15+ endpoints)
│   │   └── pages.ts        # HTML page routes
│   ├── templates/          # Server-rendered HTML templates
│   ├── middleware/         # Input validation middleware
│   └── lib/                # Spread drawing, daily card logic
├── tests/                  # Unit, integration, and E2E tests
└── package.json
```

## License

MIT
