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

## Store Boundaries
Single SQLite database (`tarot.db`) owns all state. The HTTP server is stateless (no session, no cache). No other store.

## Happy Path Sequence
```
1. Client → GET /api/cards
2. Elysia routes to handler
3. Handler queries SQLite: SELECT * FROM cards
4. Handler parses keywords field (comma-separated → array)
5. Elysia serializes response as JSON
6. Client receives 200 + Card[]
```

## Error Path
```
1. Client → GET /api/cards/:id with id = "abc"
2. Handler: parseInt("abc") → NaN
3. Handler returns: {error: "Invalid card ID"}, status 400
```

## Execution Path
Single-process Bun runtime. All requests handled synchronously via Elysia router dispatch. No worker threads, no message queues.

## Concurrency and Runtime Model
Bun's event loop handles concurrent requests. SQLite operations are synchronous (bun:sqlite). No async DB layer needed — reads only, no write contention.

## Deployment Topology
Local development: `bun run src/index.ts` on port 3000. No containerization required (SQLite is embedded).

## Data and Contracts
- Cards seeded from `src/db/seed.ts` — 78 cards (22 Major, 56 Minor)
- No external data contracts
- Database schema pinned in `src/db/seed.ts`

## ADR Register
| ADR | Decision | Status |
|---|---|---|
| ADR-001 | Use SQLite over PostgreSQL | Accepted — local-first, zero dependencies |
| ADR-002 | Use Elysia over Express | Accepted — Bun-native, fast |
| ADR-003 | No auth on any endpoint | Accepted — public demo API |
| ADR-004 | Server-rendered HTML (no SPA) | Accepted — simplicity |

## Delivery Plan (first 3 slices)
1. ✅ Core API: health, cards, random, daily endpoints
2. ✅ Extended API: meaning, search, spreads, stats
3. ✅ Version endpoint + spec hydration

## Risks and Mitigations
| Risk | Mitigation |
|---|---|
| SQLite corruption | Rebuild from seed.ts |
| Playwright test flakiness | bun test --timeout 60000 |
| E2E tests require live server | setup.ts starts server in beforeAll |
