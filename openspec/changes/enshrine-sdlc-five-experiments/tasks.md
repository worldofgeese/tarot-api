# Tasks: Enshrine SDLC Five Experiments

## Task 1: Create Workflow Templates (EX-005, EX-006, EX-007, EX-014)

**Description**: Create template files in `.decapod/templates/` for the four document-based experiments.

**Files**:
- `.decapod/templates/impact-map.md`
- `.decapod/templates/design-boundaries.md`
- `.decapod/templates/completion-checklist.md`
- `.decapod/templates/resource-headroom.md`

**Acceptance**:
- [ ] All four template files exist
- [ ] Templates contain clear section headers and examples
- [ ] Templates are referenced in updated AGENTS.md

**Estimate**: 15 minutes

---

## Task 2: Fix E2E Test Path and Server Management

**Description**: Separate unit/API tests from E2E tests, create managed server script for browser tests.

**Files**:
- `package.json` (update test scripts)
- `scripts/test-e2e.sh` (new, managed server wrapper)
- `tests/e2e/setup.ts` (verify/update)

**Acceptance**:
- [ ] `bun test` runs only unit/API tests (excludes tests/e2e/)
- [ ] `bun run test:e2e` starts server, runs browser tests, cleans up
- [ ] `bun run test:all` runs both suites
- [ ] All tests pass

**Estimate**: 20 minutes

---

## Task 3: Implement Behavioral Review Script (EX-012)

**Description**: Create behavioral review script that runs E2E suite and generates review report.

**Files**:
- `scripts/behavioral-review.sh` (new)
- `docs/workflow/behavioral-review-template.md` (report template)

**Acceptance**:
- [ ] Script starts server in test mode
- [ ] Script runs E2E suite
- [ ] Script generates behavioral review report with sections:
  - User-facing changes observed
  - Edge cases exercised  
  - Error handling verified
  - Performance characteristics
- [ ] Script exits cleanly (server shutdown)

**Estimate**: 25 minutes

---

## Task 4: Create Cook Step Validation Scripts

**Description**: Create lightweight validation scripts for Cook workflow integration.

**Files**:
- `scripts/check-impact-map.sh` (new)
- `scripts/check-design-boundaries.sh` (new)
- `scripts/check-completion.sh` (new)

**Acceptance**:
- [ ] `check-impact-map.sh` validates Impact Map section exists in task file
- [ ] `check-design-boundaries.sh` validates Design Boundaries section exists
- [ ] `check-completion.sh` validates completion checklist items marked complete
- [ ] Scripts return meaningful exit codes (0 = pass, 1 = fail)
- [ ] Scripts print helpful messages on failure

**Estimate**: 20 minutes

---

## Task 5: Enhance Cook Configuration

**Description**: Populate `.cook/config.json` with workflow step integrations.

**Files**:
- `.cook/config.json` (update)

**Acceptance**:
- [ ] `work` step has pre/post validation scripts
- [ ] `review` step calls behavioral-review.sh
- [ ] `gate` step calls check-completion.sh
- [ ] Configuration is valid JSON

**Estimate**: 10 minutes

---

## Task 6: Update Repo Contracts and Documentation

**Description**: Update AGENTS.md, CLAUDE.md, and create experiment documentation.

**Files**:
- `AGENTS.md` (update SDLC pipeline section to reference experiments)
- `CLAUDE.md` (update if needed)
- `docs/workflow/sdlc-experiments.md` (new, comprehensive experiment documentation)

**Acceptance**:
- [ ] AGENTS.md references all five experiments with concrete artifact locations
- [ ] AGENTS.md SDLC pipeline section updated with new gates/steps
- [ ] `docs/workflow/sdlc-experiments.md` documents each experiment:
  - Purpose
  - Artifact location
  - Usage instructions
  - Evaluation criteria
- [ ] Documentation includes example task brief with all sections

**Estimate**: 25 minutes

---

## Task 7: Update Example Task Briefs

**Description**: Update existing TASK_*.md files to include new required sections as examples.

**Files**:
- `TASK.md` (this file - update with all five experiment sections)
- One other TASK_*.md as exemplar

**Acceptance**:
- [ ] Task briefs include Impact Map section
- [ ] Task briefs include Design Boundaries section  
- [ ] Task briefs include Resource Headroom section
- [ ] Task briefs include Completion Checklist section
- [ ] Sections filled with realistic content (not just templates)

**Estimate**: 15 minutes

---

## Task 8: Run Verification Suite

**Description**: Verify all changes work end-to-end.

**Files**: (verification only, no changes)

**Acceptance**:
- [ ] `decapod validate` passes
- [ ] `bun test` passes (unit/API tests)
- [ ] `bun run test:e2e` passes (browser tests with managed server)
- [ ] `bash scripts/behavioral-review.sh` generates report
- [ ] Cook validation scripts run successfully
- [ ] No regression in existing functionality

**Estimate**: 15 minutes

---

## Task 9: Create Experiment Evaluation Report

**Description**: Document concrete evidence of each experiment's implementation and usage.

**Files**:
- `openspec/changes/enshrine-sdlc-five-experiments/evaluation.md` (new)

**Acceptance**:
- [ ] Report includes evaluation for all five experiments:
  - EX-005: Impact Map gate
  - EX-006: Design Boundaries
  - EX-007: Completion Checklist
  - EX-012: Behavioral Review
  - EX-014: Resource Headroom
- [ ] Each evaluation includes:
  - Concrete repo change embodying it
  - Evidence of actual usage
  - Friction introduced
  - Recommendation (graduate/test/revise/retire)
- [ ] Report includes self-review (3 concerns)

**Estimate**: 20 minutes

---

## Dependencies

```
Task 1 (templates) → Task 4 (validation scripts)
Task 2 (E2E fix) → Task 3 (behavioral review)
Task 3 + Task 4 → Task 5 (Cook config)
Task 1 + Task 5 → Task 6 (documentation)
Task 6 → Task 7 (example task briefs)
Task 1-7 → Task 8 (verification)
Task 8 → Task 9 (evaluation)
```

## Execution Strategy

**Phase 1 - Foundation** (parallel where possible):
- Task 1: Templates
- Task 2: E2E fix

**Phase 2 - Integration**:
- Task 3: Behavioral review (depends on Task 2)
- Task 4: Validation scripts (depends on Task 1)

**Phase 3 - Orchestration**:
- Task 5: Cook config (depends on Tasks 3 & 4)

**Phase 4 - Documentation**:
- Task 6: Repo contracts (depends on Tasks 1-5)
- Task 7: Example updates (depends on Task 6)

**Phase 5 - Verification & Evaluation**:
- Task 8: Verification suite (depends on all previous)
- Task 9: Evaluation report (depends on Task 8)

## Total Estimate

**Sum**: 165 minutes (~2.75 hours)  
**With buffer**: 195 minutes (~3.25 hours)

## Success Criteria

All tasks completed with acceptance criteria met, plus:
- OpenSpec change artifacts (proposal, design, tasks) match delivered work
- Decapod validation passes
- All tests pass
- Behavioral verification path is truthful and repeatable
- Evidence-backed evaluation report demonstrates experiments are load-bearing
