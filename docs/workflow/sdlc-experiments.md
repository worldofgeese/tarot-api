# SDLC Five Experiments — Implementation Guide

This document describes the five SDLC workflow experiments enshrined in tarot-api to make the promoted stack load-bearing.

## Overview

The five experiments address different phases of the development workflow:

1. **EX-005**: Impact Map — Plan before code
2. **EX-006**: Design Boundaries — Scope definition
3. **EX-007**: Completion Checklist — Verification before "done"
4. **EX-012**: Behavioral Review — User-facing validation
5. **EX-014**: Resource Headroom — Estimation and overrun detection

Together, these experiments enforce: **OpenSpec → Impact Map → Design → TDD → Implementation → Behavioral Review → Completion → Merge**

---

## EX-005: Plan-Before-Code Impact Map Gate

### Purpose
Surface scope, blast radius, and dependency impact BEFORE starting implementation.

### When to Use
- At task planning time, before writing any code
- When updating existing functionality
- Before claiming a task from the backlog

### Template Location
`.decapod/templates/impact-map.md`

### Required Sections
- **Files likely to modify**: List expected file changes
- **Symbols/surfaces likely affected**: Functions, classes, APIs, interfaces
- **Blast radius**: Who/what is affected (users, developers, systems)
- **Dependencies affected**: External and internal dependencies added/changed/removed

### Validation
```bash
bash scripts/check-impact-map.sh TASK.md
```

### Example
```markdown
## Impact Map

### Files Likely to Modify
**Source code:**
- `src/routes/cards.ts` - add daily card endpoint

**Tests:**
- `tests/daily.test.ts` - add tests for daily card logic

### Symbols / Surfaces Likely Affected
- API endpoint: `GET /api/cards/daily` (new)
- Function: `selectDailyCard()` (new)

### Blast Radius
**Users:**
- Direct impact: New daily card feature

**Developers:**
- New pattern: Date-based deterministic selection

### Dependencies Affected
None - uses existing dependencies
```

### Friction
- **Time cost**: 5-10 minutes to create
- **Mental overhead**: Requires thinking through changes before coding

### Value
- Catches scope issues early
- Makes blast radius visible
- Prevents "oh I forgot about X" mid-implementation

---

## EX-006: Design Boundaries in ACP Briefs

### Purpose
Explicitly define what's in scope, out of scope, and what constitutes scope creep BEFORE implementation.

### When to Use
- During task planning
- When scope is ambiguous
- Before multi-file changes

### Template Location
`.decapod/templates/design-boundaries.md`

### Required Sections
- **In scope (must address)**: Primary and secondary deliverables
- **Out of scope unless required by evidence**: Related work that could be deferred
- **Explicit non-goals**: What this task will NOT do
- **Scope creep triggers**: Conditions that mean task has grown too large

### Validation
```bash
bash scripts/check-design-boundaries.sh TASK.md
```

### Example
```markdown
## Design Boundaries

### In Scope (Must Address)
1. **Primary deliverable**: Add GET /api/cards/daily endpoint
2. **Secondary deliverables**:
   - Unit tests for daily card selection
   - E2E test for daily card page
3. **Quality gates**: All tests pass, endpoint documented

### Out of Scope Unless Required by Evidence
1. Daily card history tracking
2. User-specific daily cards
3. Caching of daily card result

### Explicit Non-Goals
1. No database schema changes
2. No user authentication
3. No "card selection strategy" abstraction (YAGNI)

### Scope Creep Triggers
1. Task exceeds 2 hours of work
2. Touches more than 5 files
3. Requires new npm packages
4. Requires changes to Card interface
```

### Friction
- **Time cost**: 10-15 minutes
- **Requires clarity**: Forces explicit decisions

### Value
- Prevents scope creep
- Makes "out of scope" decisions explicit
- Provides clear stop conditions

---

## EX-007: Pre-Completion Checklist with Evidence

### Purpose
Enforce thorough verification BEFORE claiming "done". Requires evidence for all completion criteria.

### When to Use
- In every task brief (part of template)
- Before marking task complete
- During self-review

### Template Location
`.decapod/templates/completion-checklist.md`

### Required Sections
- Planning & design (Impact Map, Design Boundaries, Resource Headroom)
- TDD (tests written first, tests pass, test coverage)
- Implementation quality (self-review, no unnecessary changes, error handling, security)
- Behavioral verification (manual exercise, E2E tests, behavioral review)
- Integration & validation (Decapod validation, OpenSpec alignment, docs updated)
- Self-review concerns (3 explicit concerns with risks and mitigations)
- Evidence links (commit SHAs, test output, screenshots)

### Validation
```bash
bash scripts/check-completion.sh TASK.md
```

### Example
```markdown
## Completion Checklist

### Test-Driven Development
- [x] **Tests written first**: Failing tests committed before implementation
  - Commit SHA: `abc1234`
- [x] **Tests pass**: All tests green
  - Output: `156 tests passed`
- [x] **Test coverage adequate**: 3 unit, 2 API, 1 E2E tests added

### Behavioral Verification
- [x] **Manual exercise completed**: Tested /cards/daily endpoint with curl
  - Evidence: `curl http://localhost:3000/api/cards/daily` returned card
- [x] **E2E tests run**: Browser tests passed
  - Evidence: `bun run test:e2e` output
- [x] **Behavioral review passed**: Behavioral review report generated
  - Report: `reports/behavioral-review-20260413.md`

### Self-Review Concerns
1. **Concern**: Date handling uses server timezone
   - **Risk**: Daily card varies by server location
   - **Mitigation**: Documented UTC assumption, future work: timezone param

2. **Concern**: No caching of result
   - **Risk**: Unnecessary recomputation
   - **Mitigation**: Acceptable for current scale, add caching if needed

3. **Concern**: E2E doesn't verify determinism across days
   - **Risk**: Could regress without catching it
   - **Mitigation**: Unit tests cover determinism thoroughly
```

### Friction
- **Time cost**: 15-20 minutes to complete
- **Comprehensive**: Requires many verification steps

### Value
- Ensures nothing is skipped
- Requires evidence (not just claims)
- Forces self-review with explicit concerns

---

## EX-012: Behavioral Review Pass After Code Review

### Purpose
Verify user-facing behavior AFTER code review, catch behavioral regressions that code review might miss.

### When to Use
- After code review is complete
- Before final merge
- As part of Cook `review` step

### Artifact Location
`scripts/behavioral-review.sh`

### Execution
```bash
bash scripts/behavioral-review.sh
```

### What It Does
1. Starts server in test mode
2. Runs E2E test suite
3. Captures behavioral artifacts (server logs, test output)
4. Generates behavioral review report with:
   - User-facing changes observed
   - Edge cases exercised
   - Error handling verified
   - Performance characteristics
   - Recommendations

### Report Location
`reports/behavioral-review-<timestamp>.md`

### Example Report
```markdown
# Behavioral Review Report

**Date**: 2026-04-13 08:31:32
**Reviewer**: Automated (EX-012)

## E2E Test Results
All 10 tests passed

## User-Facing Changes Observed
- Landing page renders 78 cards
- Card detail pages load correctly
- Spread drawing interactive
- 404 handling for invalid card IDs

## Recommendations
✅ All behavioral tests passed. User-facing functionality operates as expected.
```

### Friction
- **Time cost**: 5-10 seconds (automated)
- **Report generation**: Adds artifact to review

### Value
- Catches behavioral issues code review misses
- Validates user-facing changes systematically
- Provides audit trail of behavioral verification

---

## EX-014: Resource Headroom Annotations in Task Briefs

### Purpose
Improve task estimation, catch time/scope overruns early, prevent unbounded work.

### When to Use
- During task planning
- For any non-trivial task
- When time estimation matters

### Template Location
`.decapod/templates/resource-headroom.md`

### Required Sections
- **Expected size**: XS/S/M/L/XL (lines changed, files touched)
- **Expected runtime**: Time estimate per phase (planning, tests, implementation, review)
- **Likely bottleneck**: Primary constraint (test complexity, domain knowledge, integration, design)
- **Timeout to register**: Escalation threshold
- **Split trigger**: Conditions indicating task should be split
- **Capacity check**: Prerequisites verified, blockers identified

### Example
```markdown
## Resource Headroom

### Expected Size
- [x] **Small (S)**: 30-60 minutes, 2-5 files, 100-300 lines changed

### Expected Runtime
- **Planning & design**: 10 minutes
- **Test writing (TDD)**: 20 minutes
- **Implementation**: 15 minutes
- **Behavioral verification**: 10 minutes
- **Review & iteration**: 5 minutes
- **Total estimated time**: 60 minutes

### Likely Bottleneck
**Primary bottleneck**: Test complexity (date mocking required)
**Mitigation strategy**: Use Bun's test mocking utilities

### Timeout to Register
**Timeout threshold**: If not complete after 90 minutes, escalate for:
- Scope reassessment
- Design review

### Split Trigger
1. **Scope growth**: User-specific daily cards required
2. **Time overrun**: Exceeds 60 minutes by > 50%
3. **Complexity increase**: Requires ML model for selection
4. **Dependency cascade**: Additional npm packages needed

### Capacity Check
**Prerequisites verified**:
- [x] Dependencies available
- [x] Test environment ready
- [x] Design decisions made
- [x] Time block allocated

**Blockers identified**: None
```

### Friction
- **Time cost**: 5-10 minutes
- **Estimation overhead**: Requires thinking through timeline

### Value
- Improves estimation accuracy
- Catches overruns early
- Makes split conditions explicit
- Forces blocker identification upfront

---

## Cook Workflow Integration

The five experiments are integrated into Cook workflow steps via `.cook/config.json`:

```json
{
  "steps": {
    "work": {
      "pre": ["bash scripts/check-impact-map.sh TASK.md"],
      "post": ["bash scripts/check-design-boundaries.sh TASK.md"]
    },
    "review": {
      "script": "bash scripts/behavioral-review.sh"
    },
    "gate": {
      "script": "bash scripts/check-completion.sh TASK.md"
    }
  }
}
```

### Work Step
- **Pre-check**: Validates Impact Map exists in task brief
- **Post-check**: Validates Design Boundaries defined

### Review Step
- Runs behavioral review script
- Generates behavioral review report

### Gate Step
- Validates completion checklist
- Ensures all items marked complete

---

## Creating a Task Brief with All Five Experiments

Template flow:

1. **Start with Impact Map** (EX-005)
   - Map expected changes before coding
   
2. **Define Design Boundaries** (EX-006)
   - Clarify scope, out-of-scope, non-goals
   
3. **Estimate Resource Headroom** (EX-014)
   - Estimate size, runtime, bottlenecks, split triggers
   
4. **Follow TDD**
   - Write failing tests first, commit
   - Implement, commit separately
   
5. **Run Behavioral Review** (EX-012)
   - After code review, run `bash scripts/behavioral-review.sh`
   
6. **Complete Checklist** (EX-007)
   - Mark all checklist items complete with evidence
   - Document 3 self-review concerns

---

## Validation Commands

Quick reference for all five experiment validations:

```bash
# EX-005: Impact Map
bash scripts/check-impact-map.sh TASK.md

# EX-006: Design Boundaries
bash scripts/check-design-boundaries.sh TASK.md

# EX-007: Completion Checklist
bash scripts/check-completion.sh TASK.md

# EX-012: Behavioral Review
bash scripts/behavioral-review.sh

# EX-014: Resource Headroom
# (Checked as part of completion checklist)
```

---

## Evaluation Criteria

Each experiment is evaluated on:

1. **Usage evidence**: Can we find concrete examples of the artifact being used?
2. **Friction introduced**: Did it slow work down? By how much?
3. **Value delivered**: Did it catch issues earlier? Reduce rework? Improve clarity?
4. **Recommendation**: Graduate (make permanent), keep testing, revise, or retire

See `openspec/changes/enshrine-sdlc-five-experiments/evaluation.md` for detailed evaluation results.

---

## Tips for Adoption

### Start Small
- Use Impact Map and Design Boundaries for all new tasks
- Add Completion Checklist to existing task template
- Run Behavioral Review manually before merge

### Iterate
- Adjust templates based on friction
- Refine validation scripts as patterns emerge
- Document what works and what doesn't

### Measure
- Track: How often are templates used?
- Track: How many scope issues caught by Impact Map?
- Track: How many behavioral issues found by review script?

### Graduate
- After evaluation period, promote valuable experiments to permanent workflow
- Retire or revise experiments that don't deliver value
- Document lessons learned
