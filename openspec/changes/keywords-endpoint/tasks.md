# Tasks: GET /api/cards/keywords endpoint

## Task 1: Fix keywords endpoint implementation

**Description**: Fix the existing `/api/cards/keywords` endpoint to properly parse JSON-stored keywords instead of treating them as comma-separated strings.

**Current Issue**: The endpoint at `src/routes/api.ts` lines 136-141 incorrectly uses `.split(",")` on JSON-stored keyword arrays.

**Files**:
- `src/routes/api.ts` (lines 136-141)

**Changes Required**:
```typescript
// BEFORE (INCORRECT)
.get("/cards/keywords", () => {
  const rows = db.query("SELECT keywords FROM cards").all() as { keywords: string }[];
  const all = rows.flatMap(r => (r.keywords ?? "").split(",").map((k: string) => k.trim()).filter(Boolean));
  const keywords = [...new Set(all)].sort();
  return { keywords };
})

// AFTER (CORRECT)
.get("/cards/keywords", () => {
  const rows = db.query("SELECT keywords FROM cards").all() as { keywords: string }[];
  const allKeywords = rows.flatMap(row => parseKeywords(row.keywords));
  const uniqueSorted = [...new Set(allKeywords)].sort();
  return { keywords: uniqueSorted };
})
```

**Acceptance Criteria**:
- [ ] Endpoint uses `parseKeywords()` helper function
- [ ] Keywords are properly parsed from JSON strings
- [ ] Response format is `{ keywords: string[] }`
- [ ] Array is deduplicated and sorted

**Estimate**: 5 minutes

---

## Task 2: Write unit tests for keywords endpoint

**Description**: Create comprehensive unit tests for the `/api/cards/keywords` endpoint following TDD principles.

**Files**:
- `test/api.test.ts` (check if exists, add test suite)
- OR `test/keywords.test.ts` (new file if api.test.ts doesn't exist)

**Test Cases Required**:
1. `GET /api/cards/keywords returns 200 with keywords array`
   - Verify status code is 200
   - Verify response has shape `{ keywords: string[] }`
   - Verify keywords array is not empty

2. `keywords are sorted alphabetically`
   - Compare response array with its sorted version
   - Assert they are equal (already sorted)

3. `keywords are unique (no duplicates)`
   - Compare array length with Set length
   - Assert they are equal (no duplicates)

4. `keywords include expected values from seed data`
   - Verify array includes known keywords like "abundance", "action", etc.
   - Spot-check a few expected keywords

**Example Test Structure**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { initDatabase } from "../src/db/schema";
import { apiRoutes } from "../src/routes/api";

describe("GET /api/cards/keywords", () => {
  let app: Elysia;
  let db: Database;

  beforeAll(() => {
    // Setup test database and app
  });

  afterAll(() => {
    // Cleanup
  });

  it("returns 200 with keywords array", async () => {
    // Test implementation
  });

  it("returns sorted keywords", async () => {
    // Test implementation
  });

  it("returns unique keywords (no duplicates)", async () => {
    // Test implementation
  });

  it("includes expected keywords from seed data", async () => {
    // Test implementation
  });
});
```

**Acceptance Criteria**:
- [ ] All 4 test cases implemented
- [ ] Tests use proper test database (not production)
- [ ] Tests verify response shape, sorting, uniqueness
- [ ] Tests pass with the corrected implementation

**Estimate**: 15 minutes

---

## Task 3: Verify no regressions in existing functionality

**Description**: Run the full test suite to ensure the fix doesn't break anything else.

**Commands**:
```bash
bun test                 # Run all unit/API tests
bun run test:e2e         # Run E2E tests (if applicable)
```

**Acceptance Criteria**:
- [ ] All existing tests pass
- [ ] New keywords endpoint tests pass
- [ ] No new errors or warnings
- [ ] Manual verification: `curl http://localhost:3000/api/cards/keywords` returns correct data

**Estimate**: 5 minutes

---

## Dependencies

```
Task 1 (fix implementation) → Task 2 (write tests) → Task 3 (verify)
```

**Note**: While TDD typically requires writing tests first, the endpoint already exists with a bug, so we fix the implementation first, then add comprehensive tests to prevent regression.

For true TDD on new features, tests should be written before implementation.

---

## Execution Strategy

1. **Task 1**: Fix the implementation (5 min)
2. **Task 2**: Write comprehensive tests (15 min)  
3. **Task 3**: Run full test suite and verify (5 min)

Total: **25 minutes**

---

## Success Criteria

- [ ] Endpoint correctly parses JSON keywords
- [ ] All tests pass
- [ ] Response is sorted and deduplicated
- [ ] No regressions in existing endpoints
- [ ] Manual testing confirms correct behavior
