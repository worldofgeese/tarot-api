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
- `GET /api/cards` - List all cards (paginated, filterable)
- `GET /api/cards/:id` - Get single card details
- `GET /api/spread/:type` - Draw a spread (single, 3-card, celtic-cross)
- `GET /api/search?q=` - Full-text search

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
# Unit and integration tests
bun test

# E2E tests (requires devbox environment)
bun run e2e
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
│   │   ├── api.ts          # JSON API routes
│   │   └── pages.ts        # HTML page routes
│   ├── templates/
│   │   ├── layout.ts       # Base HTML layout
│   │   ├── landing.ts      # Card grid page
│   │   ├── card-detail.ts  # Single card view
│   │   ├── spread.ts       # Spread drawing page
│   │   └── search.ts       # Search page
│   └── lib/
│       └── spread.ts       # Spread drawing logic
├── tests/
│   ├── cards.test.ts       # Unit tests
│   ├── api.test.ts         # Integration tests
│   └── e2e/                # End-to-end tests
├── public/
│   └── style.css           # Styles
└── package.json
```

## API Examples

### Get All Cards

```bash
curl http://localhost:3000/api/cards
```

### Get Single Card

```bash
curl http://localhost:3000/api/cards/0
```

### Draw a 3-Card Spread

```bash
curl http://localhost:3000/api/spread/3-card
```

### Search Cards

```bash
curl http://localhost:3000/api/search?q=love
```

### Filter by Arcana

```bash
curl http://localhost:3000/api/cards?arcana=major
```

### Filter by Suit

```bash
curl http://localhost:3000/api/cards?suit=cups
```

## License

MIT
