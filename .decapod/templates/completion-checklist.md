# Completion Checklist Template

Use this checklist to verify all required steps are completed before considering a task done.

## Planning & Design
- [ ] **Impact Map created**: Impact map exists and accurately reflects actual changes
- [ ] **Design Boundaries defined**: In-scope, out-of-scope, and non-goals are clear
- [ ] **Resource Headroom estimated**: Expected size, runtime, and bottlenecks documented

## Test-Driven Development
- [ ] **Tests written first**: Failing tests committed before implementation
  - Evidence: Git commit showing tests added before implementation code
  - Commit SHA: `_______`
- [ ] **Tests pass**: All new and existing tests pass locally
  - Evidence: Test output showing all tests green
  - Command run: `bun test` output
- [ ] **Test coverage adequate**: New code paths have corresponding tests
  - Unit tests: `_____` new/modified
  - API tests: `_____` new/modified
  - E2E tests: `_____` new/modified

## Implementation Quality
- [ ] **Code review self-completed**: Reviewed own diff adversarially
  - Self-review concerns documented (see section below)
- [ ] **No unnecessary changes**: Only modified what was required by task scope
- [ ] **Error handling**: Edge cases and error conditions handled appropriately
- [ ] **Security checked**: No new vulnerabilities introduced (SQL injection, XSS, etc.)

## Behavioral Verification
- [ ] **Manual exercise completed**: Feature tested manually in browser/API client
  - Evidence: Screenshot, curl output, or manual test log
- [ ] **E2E tests run**: Browser-based tests executed with managed server
  - Evidence: `bun run test:e2e` output or behavioral review report
- [ ] **Behavioral review passed**: User-facing behavior validated
  - Report location: `_______`

## Integration & Validation
- [ ] **Decapod validation passes**: `decapod validate` runs successfully
  - Output: `_______`
- [ ] **OpenSpec change matches delivered work**: Artifacts (proposal, design, tasks) align with actual implementation
- [ ] **Documentation updated**: README, API docs, or workflow docs updated if needed

## Self-Review Concerns

Document 3 explicit concerns from adversarial review of your own changes:

1. **Concern**: 
   - **Risk**: 
   - **Mitigation**: 

2. **Concern**: 
   - **Risk**: 
   - **Mitigation**: 

3. **Concern**: 
   - **Risk**: 
   - **Mitigation**: 

## Evidence Links

Provide concrete evidence for verification:

- **Test commit SHA**: `_______`
- **Implementation commit SHA**: `_______`
- **Test output**: (paste or link to log)
- **Behavioral verification**: (screenshot, log, or report path)
- **Decapod validation**: (output or confirmation)

## Example

```markdown
## Test-Driven Development
- [x] **Tests written first**: Failing tests committed before implementation
  - Evidence: Git commit showing tests added before implementation code
  - Commit SHA: `abc1234`
- [x] **Tests pass**: All new and existing tests pass locally
  - Evidence: Test output showing all tests green
  - Command run: `bun test` - all 47 tests passed
- [x] **Test coverage adequate**: New code paths have corresponding tests
  - Unit tests: 3 new (daily card selection, date handling, edge cases)
  - API tests: 2 new (GET /api/cards/daily success, determinism check)
  - E2E tests: 1 new (daily card page loads and displays card)

## Self-Review Concerns
1. **Concern**: Date handling uses local timezone, could differ by server location
   - **Risk**: Daily card might change based on server timezone vs user timezone
   - **Mitigation**: Documented assumption that server uses UTC. Future work: accept timezone param.

2. **Concern**: No caching of daily card result, recalculated on every request
   - **Risk**: Unnecessary computation for high-traffic scenarios
   - **Mitigation**: Acceptable for current scale. Add caching if performance issues arise.

3. **Concern**: E2E test doesn't verify card determinism across days
   - **Risk**: Could regress without catching it in E2E
   - **Mitigation**: Unit tests cover determinism thoroughly. E2E just validates page loads.
```
