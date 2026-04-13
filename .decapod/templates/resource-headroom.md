# Resource Headroom Template

Use this template to estimate the resource requirements and potential bottlenecks of your task.

## Expected Size

Select one:

- [ ] **Extra Small (XS)**: < 30 minutes, 1-2 files, < 100 lines changed
- [ ] **Small (S)**: 30-60 minutes, 2-5 files, 100-300 lines changed
- [ ] **Medium (M)**: 1-3 hours, 5-10 files, 300-800 lines changed
- [ ] **Large (L)**: 3-8 hours, 10-20 files, 800-2000 lines changed
- [ ] **Extra Large (XL)**: > 8 hours, > 20 files, > 2000 lines changed (consider splitting)

## Expected Runtime

Estimate time to complete each phase:

- **Planning & design**: _____ minutes
- **Test writing (TDD)**: _____ minutes
- **Implementation**: _____ minutes
- **Behavioral verification**: _____ minutes
- **Review & iteration**: _____ minutes
- **Total estimated time**: _____ minutes

## Likely Bottleneck

Identify what will likely slow progress:

**Primary bottleneck**: (select one or describe)
- [ ] Test complexity (difficult to mock, complex fixtures)
- [ ] Domain knowledge gap (unfamiliar codebase area)
- [ ] Integration complexity (multiple systems involved)
- [ ] Design uncertainty (approach unclear, requires exploration)
- [ ] Dependency availability (waiting on external resource)
- [ ] Performance investigation (requires profiling/benchmarking)
- [ ] Other: _____________

**Mitigation strategy**: How will you address the bottleneck?

## Timeout to Register

**Timeout threshold**: If task is not complete after _____ minutes, escalate for:
- [ ] Scope reassessment
- [ ] Design review
- [ ] Additional resources
- [ ] Task splitting

**Escalation action**: What should happen if timeout is reached?

## Split Trigger

Conditions that indicate task should be split into multiple tasks:

1. **Scope growth**: _____________
2. **Time overrun**: Exceeds estimated time by > _____%
3. **Complexity increase**: _____________
4. **Dependency cascade**: _____________
5. **Risk elevation**: _____________

## Capacity Check

**Prerequisites verified**:
- [ ] Required dependencies available (tools, libraries, services)
- [ ] Test environment ready (database seeded, server runnable)
- [ ] Design decisions made (no blocking unknowns)
- [ ] Time block allocated (no context switches expected)

**Blockers identified**:
- None / List any known blockers: _____________

## Example

```markdown
## Expected Size
- [x] **Small (S)**: 30-60 minutes, 2-5 files, 100-300 lines changed

## Expected Runtime
- **Planning & design**: 10 minutes
- **Test writing (TDD)**: 20 minutes
- **Implementation**: 15 minutes
- **Behavioral verification**: 10 minutes
- **Review & iteration**: 5 minutes
- **Total estimated time**: 60 minutes

## Likely Bottleneck
**Primary bottleneck**:
- [x] Test complexity (difficult to mock, complex fixtures)

**Mitigation strategy**: Need to override Date.now() for deterministic date handling in tests. Will use Bun's test mocking utilities.

## Timeout to Register
**Timeout threshold**: If task is not complete after 90 minutes, escalate for:
- [x] Scope reassessment
- [x] Design review

**Escalation action**: Review whether date handling complexity requires separate date service abstraction (would indicate scope growth).

## Split Trigger
1. **Scope growth**: If user-specific daily cards or history tracking is required
2. **Time overrun**: Exceeds 60 minutes by > 50% (> 90 minutes total)
3. **Complexity increase**: If deterministic selection requires ML model or complex algorithm
4. **Dependency cascade**: If additional npm packages needed for date/time handling
5. **Risk elevation**: If security concerns arise around input validation for date params

## Capacity Check
**Prerequisites verified**:
- [x] Required dependencies available (Elysia, SQLite, Playwright)
- [x] Test environment ready (database seeded with tarot cards)
- [x] Design decisions made (date-based seed for deterministic selection)
- [x] Time block allocated (uninterrupted 90-minute window)

**Blockers identified**: None
```
