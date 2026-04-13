# Design Boundaries Template

Use this template to explicitly define what's in scope, out of scope, and what would trigger re-scoping.

## In Scope (Must Address)

List what this task MUST accomplish to be considered complete:

1. **Primary deliverable**: Clear statement of the main goal
2. **Secondary deliverables**: Required supporting work
3. **Quality gates**: Testing, documentation, validation requirements

## Out of Scope Unless Required by Evidence

List what is explicitly NOT part of this task, but could be revisited if evidence emerges that it's necessary:

1. **Feature extensions**: Related features that could be added later
2. **Optimizations**: Performance improvements not required for MVP
3. **Refactoring**: Code cleanup not directly related to the task
4. **Additional integrations**: Systems that could be integrated but aren't needed now

## Explicit Non-Goals

List what this task will definitively NOT do, even if related:

1. **Architecture changes**: Large-scale rewrites or pattern changes
2. **Scope creep triggers**: Features that belong in separate tasks
3. **Premature abstractions**: Generalizations not justified by current need

## Scope Creep Triggers

List conditions that would indicate the task has grown beyond its intended scope and should be split:

1. **Time threshold**: Task exceeds estimated time by >50%
2. **File count threshold**: Touches more than X files
3. **Dependency introduction**: Requires new external dependencies not anticipated
4. **Architecture impact**: Requires changes to core patterns or interfaces
5. **Test complexity**: Requires test fixtures or mocks beyond initial estimate

## Example

```markdown
## In Scope (Must Address)
1. **Primary deliverable**: Add GET /api/cards/daily endpoint that returns one card per day
2. **Secondary deliverables**:
   - Deterministic card selection (same card for given date)
   - Unit tests for daily card selection logic
   - API tests for /api/cards/daily endpoint
   - E2E test for daily card page
3. **Quality gates**:
   - All tests pass
   - Endpoint documented in API docs
   - Daily card selection is deterministic and testable

## Out of Scope Unless Required by Evidence
1. **Feature extensions**:
   - Daily card history (tracking past daily cards)
   - User-specific daily cards (personalization)
   - Daily card notifications
2. **Optimizations**:
   - Caching daily card result (not needed for single-user API)
3. **Refactoring**:
   - Generalizing random selection logic (only one use case so far)

## Explicit Non-Goals
1. **Architecture changes**: No changes to database schema or core routing patterns
2. **Scope creep triggers**: No user authentication, no persistence of daily card choices
3. **Premature abstractions**: No "card selection strategy" interface (YAGNI)

## Scope Creep Triggers
1. **Time threshold**: Task exceeds 2 hours of work
2. **File count threshold**: Touches more than 5 files
3. **Dependency introduction**: Requires any new npm packages
4. **Architecture impact**: Requires changes to Card interface or database schema
5. **Test complexity**: Requires mocking time/date beyond simple Date override
```
