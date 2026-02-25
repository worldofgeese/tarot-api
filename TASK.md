# Task: Build Tarot API

Read `/tmp/tarot-api/PLAN.md` and implement the entire application.

## Sequence (MANDATORY)

1. **Generate card data first.** Create `data/cards.json` with all 78 tarot cards. Major Arcana (0-21): The Fool through The World. Minor Arcana (22-77): Ace through King for Wands, Cups, Swords, Pentacles. Each card needs: id, name, arcana, suit, number, upright_meaning, reversed_meaning, keywords (array), image_desc. Use real traditional tarot meanings — do NOT invent.

2. **Write ALL tests first (TDD).** Create the test files BEFORE any implementation:
   - `tests/cards.test.ts` — 6 unit tests (data integrity, spread logic, search, pagination, filters)
   - `tests/api.test.ts` — 4 integration tests (endpoints, JSON schema, error handling, randomization)
   - `tests/e2e/setup.ts` — server lifecycle (same pattern as goetia-dashboard)
   - `tests/e2e/landing.test.ts` — 78 card tiles
   - `tests/e2e/card.test.ts` — card detail rendering
   - `tests/e2e/spread.test.ts` — spread drawing
   Tests should FAIL at this point (no implementation yet).

3. **Implement until all tests pass.** Build the DB schema, seed, routes, templates, spread logic. Dark purple/indigo theme. Mobile-responsive grid.

4. **Add project scaffolding.** README.md, Containerfile, CI workflow, package.json scripts (dev, test, e2e, seed, build-data).

5. **Verify.** Run `bun test` (unit+integration), confirm all pass. Don't run E2E (needs LD_LIBRARY_PATH from devbox).

6. **Commit and push.** Single commit with descriptive message. Push to origin/main.

## E2E Test Notes
- Import Playwright from: `/home/node/.local/lib/node_modules/@playwright/cli/node_modules/playwright`
- Use `bun:test` (not @playwright/test)
- setup.ts starts server on port 3000 via `Bun.spawn(["bun", "run", "src/index.ts"])`
- Navigation timeout: 30000ms
- e2e script in package.json: `"e2e": "source /home/node/.openclaw/devbox-env/lib/playwright-env.sh && bun test --preload ./tests/e2e/setup.ts tests/e2e/"`
- test script should exclude e2e: `"test": "bun test $(find tests -maxdepth 1 -name '*.test.ts')"`

## Constraints
- Bun + Elysia + bun:sqlite + FTS5
- No external dependencies beyond Elysia and its static plugin
- All card data is static (no API calls to generate)
- Dark theme with deep purple/indigo palette
- Port 3000
