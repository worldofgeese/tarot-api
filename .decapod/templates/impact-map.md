# Impact Map Template

Use this template to map the expected impact of your work before starting implementation.

## Files Likely to Modify

List the files you expect to change, organized by type:

**Source code:**
- `src/...`

**Tests:**
- `tests/...`

**Configuration:**
- `package.json`, `*.config.js`, etc.

**Documentation:**
- `docs/...`, `README.md`, etc.

## Symbols / Surfaces Likely Affected

List the key functions, classes, APIs, or interfaces you'll modify:

- Function: `functionName()` in `file.ts:line`
- Class: `ClassName` in `file.ts`
- API endpoint: `GET /api/path`
- Interface: `InterfaceName`
- Database schema: `table_name`

## Blast Radius

Describe who/what is affected by these changes:

**Users:**
- Direct impact: (e.g., new feature visible in UI, breaking API change)
- Indirect impact: (e.g., performance change, behavior change)

**Developers:**
- New patterns introduced
- Deprecated patterns removed
- Migration required (if any)

**Systems:**
- Services affected
- Integrations impacted
- Data migrations needed

## Dependencies Affected

List external and internal dependencies that will be added, upgraded, removed, or have their usage patterns changed:

**Added:**
- `package-name@version` - why needed

**Upgraded:**
- `package-name` from `old-version` to `new-version` - why

**Removed:**
- `package-name` - why no longer needed

**Usage changed:**
- `package-name` - how usage is changing

## Example

```markdown
## Files Likely to Modify
**Source code:**
- `src/routes/cards.ts` - add new /cards/daily endpoint
- `src/services/daily-card.ts` - new service for daily card selection

**Tests:**
- `tests/cards.test.ts` - add tests for daily card endpoint
- `tests/e2e/daily-card.test.ts` - add E2E test for daily card flow

## Symbols / Surfaces Likely Affected
- Function: `selectDailyCard()` in `src/services/daily-card.ts` (new)
- API endpoint: `GET /api/cards/daily` (new)
- Route handler: `GET /cards/daily` in `src/routes/cards.ts` (new)

## Blast Radius
**Users:**
- Direct impact: New "Daily Card" feature accessible via /cards/daily
- Indirect impact: None (additive feature)

**Developers:**
- New pattern: Daily card selection with seed-based determinism
- Example added for time-based endpoint behavior

**Systems:**
- No service dependencies
- No data migrations

## Dependencies Affected
None - uses existing Elysia and database dependencies.
```
