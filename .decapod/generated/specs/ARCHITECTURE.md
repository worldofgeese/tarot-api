# Architecture

## Direction
REST API + server-rendered HTML frontend for a 78-card Tarot reading application. SQLite-backed with Elysia (Bun runtime). Single process, no auth, stateless endpoints.

## Current Facts
- Runtime: Bun v1.3.10 (TypeScript/JavaScript)
- Framework: Elysia v1.x
- Database: SQLite (via `bun:sqlite`) with 78-card seed
- Surfaces: REST API (`/api/*`), HTML pages (`/`, `/card/:id`, `/spread`)

## Topology
```text
Browser → Elysia HTTP Server → Route Handlers → SQLite DB
                                              → HTML Templates (server-rendered)
```

## Domain Model
- **Card**: `id` (0-77), `name`, `arcana` (major/minor), `suit`, `number`, `keywords`, `upright_meaning`, `reversed_meaning`, `element`, `planet`, `zodiac`
- **Spread**: Named reading layout (three-card, celtic-cross, single-card, etc.) with position labels

## API Endpoints
| Endpoint | Purpose |
|---|---|
| GET /api/health | Health check + DB card count |
| GET /api/version | API metadata (name, version, card_count) |
| GET /api/stats | Card distribution (major/minor/suits) |
| GET /api/cards | All 78 cards |
| GET /api/cards/:id | Single card by id |
| GET /api/cards/random | Random card(s) |
| GET /api/cards/search | Keyword/name search |
| GET /api/cards/reversed | Random reversed card |
| GET /api/cards/arcana/:type | Filter by major/minor |
| GET /api/cards/suit/:suit | Filter by suit |
| GET /api/cards/element/:element | Filter by element |
| GET /api/daily | Daily card (date-seeded) |
| GET /api/meaning/:id | Upright + reversed meanings |
| GET /api/spreads | All spread layouts |
| GET /api/spread/:name | Specific spread with drawn cards |

## Coupling Points
- All API routes share a single `Database` instance (passed via closure)
- HTML pages and API share the same DB
- Playwright E2E tests require a live server on port 3000

## Architecture Invariants
- No auth on any endpoint (public API)
- SQLite is the single truth source
- No external service dependencies at runtime
