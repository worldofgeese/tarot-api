# Implementation Plan: Comprehensive Input Validation Middleware

**Date:** 2026-04-22  
**Branch:** exp/sdlc-input-validation  
**Base:** main

## Objective

Add comprehensive input validation and sanitization middleware to all Elysia API routes with TDD approach, covering:
- SQL injection protection
- XSS prevention
- Malformed/out-of-range IDs
- Missing required parameters

## Current State Analysis

**Existing validation functions in `src/middleware/validate.ts`:**
- `sanitizeString()` - removes null bytes and HTML encodes
- `validateStringParam()` - validates string params with length limits
- `validateCardId()` - validates numeric IDs, rejects negatives/decimals/path traversal
- `validateSearchQuery()` - middleware for search query validation
- `validateCardIdParam()` - middleware for ID param validation
- `validateNumericParam()` - middleware for numeric query params

**Existing test coverage in `tests/security.test.ts`:**
- 29 tests covering SQL injection, XSS, input size limits, null bytes, path traversal, invalid IDs
- All tests currently passing (29 pass / 0 fail)

**Gap analysis:**
While validation functions exist and tests pass, the task requires adding NEW tests for edge cases and ensuring comprehensive middleware coverage across ALL routes.

## Phase 1: Write Failing Tests (RED)

Add new test cases to `tests/security.test.ts` for:

1. **Huge numeric values for IDs:**
   - ID larger than MAX_SAFE_INTEGER
   - Scientific notation (1e10)
   - Leading zeros (001, 00042)

2. **Missing required parameters:**
   - Search endpoints without 'q' parameter
   - Endpoints expecting params with empty strings

3. **Query parameter injection:**
   - Multiple SQL keywords chained
   - Comment sequences (--,  /* */)
   - Hex-encoded malicious payloads

4. **Edge case XSS vectors:**
   - Event handlers beyond onerror (onload, onclick, etc.)
   - SVG-based XSS
   - Data URIs with JavaScript

5. **Numeric parameter validation:**
   - Non-numeric values in limit/offset
   - Negative values for limit/offset
   - Zero values where not allowed

**Expected:** At least 10-15 new failing tests

## Phase 2: Implement Comprehensive Validation (GREEN)

Enhance middleware to handle all new test cases:

1. **Extend `validateCardId()` in `src/middleware/validate.ts`:**
   - Add MAX_SAFE_INTEGER check
   - Reject scientific notation
   - Reject leading zeros (except for "0" itself)

2. **Create global validation middleware:**
   - Add Elysia plugin that applies to all routes
   - Automatic query parameter validation
   - Automatic path parameter validation

3. **Add numeric range validators:**
   - Ensure limit/offset are positive integers
   - Add reasonable max values (e.g., limit max 1000)

4. **Strengthen string sanitization:**
   - Enhance `sanitizeString()` to cover more XSS vectors
   - Add data URI detection and rejection
   - Add SVG tag detection

## Phase 3: Apply Middleware to All Routes

Audit `src/routes/api.ts` and ensure every route has appropriate validation:
- All `:id` parameters use `validateCardIdParam`
- All search queries use `validateSearchQuery`
- All numeric queries use `validateNumericParam`

## Phase 4: Verification

1. Run full test suite: `bun test --timeout 60000`
   - Expected: 0 failures
   - New test count: ~40-45 tests (29 existing + 10-15 new)

2. Run security tests specifically: `bun test tests/security.test.ts`
   - Verify all new tests pass

3. Run decapod validate: `/home/node/.openclaw/bin/decapod validate`
   - Expect 4 pre-existing failures (documented in CLAUDE.md)

## Commit Strategy (TDD)

1. **Commit 1:** `test: failing security tests for edge cases (RED)`
   - Add all new failing tests
   - Verify RED with `bun test tests/security.test.ts`

2. **Commit 2:** `feat: comprehensive input validation middleware (GREEN)`
   - Implement validation enhancements
   - Verify GREEN with `bun test --timeout 60000`

## Success Criteria

- ✅ All new tests for edge cases written and initially fail
- ✅ All validation enhancements implemented
- ✅ Full test suite passes (0 failures)
- ✅ All API routes have appropriate validation middleware
- ✅ `decapod validate` runs with expected pre-existing failures only
- ✅ No new security vulnerabilities introduced

## Files to Modify

1. `tests/security.test.ts` - add new failing tests
2. `src/middleware/validate.ts` - enhance validation functions
3. `src/routes/api.ts` - apply middleware to any uncovered routes (if needed)

## Dependencies

- Bun runtime (available at `/home/node/.openclaw/devbox-env/.devbox/nix/profile/default/bin/bun`)
- SQLite via bun:sqlite (in-memory for tests)
- Elysia framework (existing)
