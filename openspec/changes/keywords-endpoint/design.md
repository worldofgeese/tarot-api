# Design: GET /api/cards/keywords endpoint

## Overview

Add a new API endpoint that returns all unique keywords from all 78 tarot cards as a sorted, deduplicated array of strings.

## Architecture

### Endpoint Specification

**Route**: `GET /api/cards/keywords`

**Response Format**:
```json
{
  "keywords": ["abundance", "action", "adventure", "awareness", ...]
}
```

**HTTP Status Codes**:
- `200 OK`: Successfully returns keywords array

### Implementation Approach

**Current Issue**: The existing implementation (lines 136-141 in `src/routes/api.ts`) incorrectly treats keywords as comma-separated strings instead of JSON arrays.

```typescript
// CURRENT (INCORRECT)
const rows = db.query("SELECT keywords FROM cards").all() as { keywords: string }[];
const all = rows.flatMap(r => (r.keywords ?? "").split(",").map((k: string) => k.trim()).filter(Boolean));
const keywords = [...new Set(all)].sort();
```

**Problem**: Keywords are stored as JSON strings (e.g., `'["abundance","action","awareness"]'`) not CSV strings. Using `.split(",")` will not properly parse JSON arrays.

**Solution**: Use the existing `parseKeywords()` helper function to properly parse JSON-stored keywords.

```typescript
// CORRECT APPROACH
const rows = db.query("SELECT keywords FROM cards").all() as { keywords: string }[];
const allKeywords = rows.flatMap(row => parseKeywords(row.keywords));
const uniqueSorted = [...new Set(allKeywords)].sort();
return { keywords: uniqueSorted };
```

### Database Query

**Single Query Strategy**:
```sql
SELECT keywords FROM cards
```

This retrieves all keywords in a single query (no N+1 problem), then processes them in application code:
1. Parse each JSON keywords string using `parseKeywords()`
2. Flatten all arrays into a single array
3. Deduplicate using `Set`
4. Sort alphabetically

**Performance**: With 78 cards, this is efficient. Alternatives like SQL aggregation would be more complex and offer marginal benefit at this scale.

## Data Flow

```
Client Request
    ↓
GET /api/cards/keywords
    ↓
Query: SELECT keywords FROM cards
    ↓
Parse JSON strings → Flatten → Dedupe → Sort
    ↓
Return { keywords: string[] }
    ↓
Client Response (200 OK)
```

## Files to Modify

1. **src/routes/api.ts** (lines 136-141)
   - Fix the implementation to use `parseKeywords()` instead of string splitting
   - The endpoint already exists but has a bug

## Testing Strategy

### Unit Tests Required

**File**: `test/api.test.ts` (or create if doesn't exist)

**Test Cases**:
1. Successfully returns keywords array
2. Keywords are sorted alphabetically
3. No duplicate keywords
4. All keywords from all cards are included

**Verification**:
- Response has correct shape: `{ keywords: string[] }`
- Array is sorted (compare with sorted version)
- Array has no duplicates (compare length with Set)
- Keywords match expected subset from seed data

## Non-Goals

- Keyword filtering or search (use `/api/cards/search` or `/api/search` instead)
- Keyword counts or statistics (use `/api/stats` if needed)
- Pagination (array will be small ~50-100 unique keywords)
- Caching (premature optimization for 78 cards)

## Edge Cases

1. **Empty keywords array**: Should not happen with seed data, but handle gracefully
2. **Null keywords**: `parseKeywords()` already handles `null` → `[]`
3. **Malformed JSON**: Should not happen with seed data; let JSON.parse throw if it does

## Performance Requirements

- **Target**: < 200ms response time
- **Expected**: < 50ms (single query, small dataset)
- **Bottleneck**: None expected (78 cards is trivial)

## Integration Points

- **Existing Helper**: `parseKeywords(keywords: string | null): string[]` (line 13)
- **Existing Pattern**: All other endpoints use `parseKeywords()` for consistency
- **No New Dependencies**: Uses existing database connection and helpers
