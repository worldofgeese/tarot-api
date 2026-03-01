# SPEC: Health Check Endpoint

## Endpoint
`GET /api/health`

## Behavior
Returns a JSON health check response with:
- `status`: "ok" (always)
- `timestamp`: ISO 8601 string of current server time
- `database`: "connected" if a simple `SELECT 1` succeeds on the SQLite db, "error" otherwise
- `version`: string from `package.json` version field (read once at startup, not on every request)

## Response Shape
```json
{
  "status": "ok",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

## Error Case
If the database check fails:
```json
{
  "status": "ok",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "database": "error",
  "version": "1.0.0"
}
```
Status code is always 200 (the endpoint itself is healthy even if db is degraded).

## Implementation
- Add endpoint to `src/routes/api.ts`
- Read version from `package.json` at module level (not per-request)
- Database check: `db.query("SELECT 1").get()` wrapped in try/catch

## Tests (in `tests/health.test.ts`)
1. Returns 200 status
2. Response has `status: "ok"`
3. Response has `timestamp` as valid ISO 8601 string
4. Response has `database: "connected"` (since test db is always available)
5. Response has `version` matching package.json
6. Response Content-Type is application/json
