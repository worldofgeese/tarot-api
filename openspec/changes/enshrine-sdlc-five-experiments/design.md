# Design: Enshrine SDLC Five Experiments

## Architecture

### Layered Workflow Enforcement

```
┌─────────────────────────────────────────────┐
│  Repo Contracts (AGENTS.md, CLAUDE.md)     │
│  ↓ reference                                 │
├─────────────────────────────────────────────┤
│  Workflow Templates (.decapod/templates/)   │
│  - impact-map.md                             │
│  - design-boundaries.md                      │
│  - completion-checklist.md                   │
│  - resource-headroom.md                      │
│  ↓ consumed by                               │
├─────────────────────────────────────────────┤
│  Task Briefs (TASK_*.md pattern)            │
│  - include required sections from templates  │
│  ↓ executed via                              │
├─────────────────────────────────────────────┤
│  Verification Scripts (scripts/)             │
│  - test_e2e.py (managed server + browser)    │
│  - behavioral_review.py (EX-012)             │
│  ↓ gates                                     │
├─────────────────────────────────────────────┤
│  Cook Orchestration (.cook/config.json)     │
│  - work step: check Impact Map exists        │
│  - review step: run behavioral_review.py     │
│  - gate step: completion checklist           │
└─────────────────────────────────────────────┘
```

### Component Decisions

#### EX-005: Plan-before-code Impact Map Gate
**Location**: `.decapod/templates/impact-map.md`  
**Enforcement**: Referenced in AGENTS.md "Mandatory Initialization", checked by `decapod validate` (aspirational - current version may not support custom templates, so document as expected pattern)  
**Content**: Template with sections:
- Files likely to modify
- Symbols/surfaces likely affected
- Blast radius
- Dependencies affected

**Integration**: Task briefs (TASK_*.md) must include Impact Map section before claiming work.

#### EX-006: Design Boundaries in ACP Briefs
**Location**: `.decapod/templates/design-boundaries.md`  
**Enforcement**: Referenced in AGENTS.md, included in all TASK_*.md files  
**Content**: Template with sections:
- In scope (must address)
- Out of scope unless required by evidence
- Explicit non-goals
- Scope creep triggers (what would require re-scoping)

**Integration**: Cook `work` step checks for Design Boundaries section in task brief.

#### EX-007: Pre-completion Checklist with Evidence
**Location**: `.decapod/templates/completion-checklist.md`  
**Enforcement**: Cook `gate` step verifies all checklist items marked complete with evidence links  
**Content**: Template with sections:
- [ ] OpenSpec change exists and matches delivered work
- [ ] Tests written first (TDD commit evidence)
- [ ] Tests pass (CI link or local output)
- [ ] Behavioral verification run (screenshot/log)
- [ ] Self-review completed (3 concerns documented)
- [ ] Decapod validation passed

**Integration**: TASK_*.md files include completion checklist. Scripts check for `[x]` completion markers.

#### EX-012: Behavioral Review Pass After Code Review
**Location**: `scripts/behavioral_review.py`  
**Enforcement**: Cook `review` step, called after code review, before CI  
**Content**: Script that:
1. Starts server in test mode
2. Runs E2E suite
3. Captures behavioral artifacts (screenshots, network logs, console output)
4. Generates behavioral review report with:
   - User-facing changes observed
   - Edge cases exercised
   - Error handling verified
   - Performance characteristics

**Integration**: `.cook/config.json` `review` step calls `python scripts/behavioral_review.py`.

#### EX-014: Resource Headroom Annotations in Task Briefs
**Location**: `.decapod/templates/resource-headroom.md`  
**Enforcement**: Required section in TASK_*.md, referenced in AGENTS.md  
**Content**: Template with fields:
```yaml
resource_headroom:
  expected_size: small | medium | large | xlarge
  expected_runtime: <duration>
  likely_bottleneck: <description>
  timeout_to_register: <minutes>
  split_trigger: <condition that means task is too large>
```

**Integration**: Cook orchestration checks resource annotations, escalates if timeout exceeded.

### E2E Test Path Fix

**Problem**: `bun test` runs unit tests + browser E2E tests, but E2E tests expect a running server. Current behavior:
```bash
$ bun test
# runs tests/**/*.test.ts including tests/e2e/*.test.ts
# E2E tests fail with ERR_CONNECTION_REFUSED
```

**Solution**: Separate test commands with clear responsibilities:
- `bun test` → unit + API tests only (fast, no server required)
- `bun run test:e2e` → managed server + browser tests (calls `scripts/test_e2e.py`)
- `bun run test:all` → runs both in sequence

**Implementation**:
1. Update `package.json` scripts
2. Create `scripts/test_e2e.py`:
   ```python
   #!/usr/bin/env python3
   import subprocess
   import time
   import sys
   
   # Start server in background
   server = subprocess.Popen(["bun", "run", "src/index.ts"])
   
   # Wait for server ready (poll health endpoint)
   # Run E2E tests (sources playwright-env.sh internally)
   # Kill server on exit
   ```
   (Note: The script sources `/home/node/.openclaw/devbox-env/lib/playwright-env.sh` for Playwright runtime, but the repo-local executable is Python.)
3. Update test file patterns to exclude `tests/e2e/` from default `bun test`

### Swamp Usage

**Current state**: `.swamp.yaml` exists, extension catalog initialized, but no repo-specific models/workflows/reports.

**Decision**: Swamp is load-bearing for audit/telemetry. Verify `.swamp/audit/` and `.swamp/telemetry/` directories are actively used:
- Audit: captures all swamp CLI invocations
- Telemetry: captures model execution metrics

**Action**: Document Swamp's role in repo workflow (audit trail for automated tasks). No additional artifacts needed if audit/telemetry are functioning.

### Cook Usage

**Current state**: `.cook/config.json` exists with empty step definitions.

**Enhancement**: Populate Cook steps to operationalize experiments:
```json
{
  "agent": "claude",
  "sandbox": "agent",
  "steps": {
    "work": {
      "pre": ["python scripts/check_impact_map.py"],
      "post": ["python scripts/check_design_boundaries.py"]
    },
    "review": {
      "script": "python scripts/behavioral_review.py"
    },
    "gate": {
      "script": "python scripts/check_completion.py"
    },
    "iterate": {},
    "ralph": {}
  },
  "env": []
}
```

Create lightweight check scripts that validate expected sections exist in task files.

### Decapod Validation

**Current integration**: `decapod validate` already defined in AGENTS.md as mandatory gate.

**Enhancement**: Ensure validation passes after changes. No custom Decapod logic needed beyond existing CLI.

## Data Flow

### Task Creation Flow
1. User/agent starts task → reads templates from `.decapod/templates/`
2. Creates `TASK_<name>.md` with required sections (Impact Map, Design Boundaries, Resource Headroom, Completion Checklist)
3. Cook `work.pre` validates required sections present

### Implementation Flow
1. Agent reads task brief
2. Writes failing tests (TDD)
3. Commits tests
4. Implements feature
5. Commits implementation
6. Runs `bun test` (unit/API only, fast feedback)

### Review Flow
1. Code review complete
2. Cook `review` step calls `behavioral_review.py`
3. Script starts server, runs E2E, captures artifacts
4. Generates behavioral review report

### Gate Flow
1. Cook `gate` step calls `check_completion.py`
2. Script verifies completion checklist items:
   - All `[x]` marked
   - Evidence links valid
   - Tests pass
   - Decapod validation clean
3. Gate passes → ready for merge

## File Structure

```
.
├── .decapod/
│   └── templates/
│       ├── impact-map.md
│       ├── design-boundaries.md
│       ├── resource-headroom.md
│       └── completion-checklist.md
├── .cook/
│   └── config.json (enhanced with step scripts)
├── scripts/
│   ├── test_e2e.py (new, managed server + browser)
│   ├── behavioral_review.py (new, EX-012)
│   ├── check_impact_map.py (new, validation helper)
│   ├── check_design_boundaries.py (new, validation helper)
│   └── check_completion.py (new, validation helper)
├── docs/
│   └── workflow/
│       └── sdlc-experiments.md (documentation of five experiments)
├── AGENTS.md (updated to reference experiments)
├── CLAUDE.md (updated to reference experiments)
├── package.json (test scripts separated)
└── TASK_*.md (examples updated with new sections)
```

## Trade-offs

### Prescriptiveness vs. Flexibility
**Decision**: Templates are strong nudges, not hard gates (except for completion checklist).  
**Rationale**: Allow adaptation as experiments prove their value. Hard gates added incrementally based on evidence.

### Verification Depth
**Decision**: Behavioral review is semi-automated (script-driven) but requires human interpretation of generated report.  
**Rationale**: Full automation risks false confidence. Human judgment essential for "does this feel right?" validation.

### E2E Test Separation
**Decision**: Separate `bun test` (fast) from `bun run test:e2e` (slow, managed server).  
**Rationale**: Fast feedback loop critical for TDD. E2E tests valuable but shouldn't block unit test iteration.

### Cook Script Complexity
**Decision**: Cook scripts are thin validation wrappers, not enforcement engines.  
**Rationale**: Low friction during experiment phase. Scripts check for presence of sections, not semantic correctness.

## Alternatives Considered

### Alternative: Git Hooks for Validation
**Rejected**: Pre-commit hooks too aggressive for experimental workflow patterns. Would block commits if templates not used, creating friction before experiments proven valuable.

### Alternative: CI-Only Enforcement
**Rejected**: Too late in cycle. Want earlier feedback (pre-commit, during task planning).

### Alternative: All Experiments in Single Template
**Rejected**: Separate templates allow gradual adoption and clearer evaluation of each experiment's individual value.

## Success Metrics

Each experiment evaluated on:
- **Usage evidence**: Can we find concrete examples of the artifact being used?
- **Friction introduced**: Did it slow work down? By how much?
- **Value delivered**: Did it catch issues earlier? Reduce rework? Improve clarity?
- **Recommendation**: Graduate (make permanent), keep testing, revise, or retire

Concrete metrics:
- EX-005: Count tasks with Impact Map section → did it surface scope issues early?
- EX-006: Count scope creep incidents → did Design Boundaries prevent?
- EX-007: Count checklist skips → is checklist actually followed?
- EX-012: Count behavioral issues found post-code-review → does behavioral review find different bugs?
- EX-014: Count timeout/overrun incidents → does Resource Headroom improve estimation?
