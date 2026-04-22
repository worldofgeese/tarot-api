---
name: sdlc-implement
description: IMPLEMENT phase — TDD mandate, Cook orchestration (review/ralph/race/merge/compare), per-step model routing
triggers: [implement, code, tdd, cook, ralph, race, merge, compare]
---

# IMPLEMENT Phase

Implementation with strict TDD discipline, Cook orchestration patterns, and RPI plan-driven phase execution. This phase produces the code that gates validate.

## When to Use

- After DESIGN phase completes
- When implementing features, bug fixes, or refactoring
- When Cook patterns (review loop, ralph, race) apply

## Prerequisites

- RPI plan exists with checkboxes (`.rpi/plans/`)
- Design document produced (`.rpi/designs/`)
- Worker and reviewer agent contracts in `.claude/agents/`
- `.sdlc/config.json` for per-step model routing

## Steps

### 1. Branch Setup

```bash
# Ensure feature branch exists (Decapod workspace isolation)
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  decapod workspace ensure --branch "feat/$(basename .rpi/plans/*.md .md)"
fi
```

### 2. Choose Cook Orchestration Pattern

Select the pattern based on task complexity:

#### Pattern A: Review Loop (Default)

Standard work → review → fix cycle. Use for most tasks.

```bash
# Per-step model routing from config
WORK_MODEL=$(jq -r '.cook.perStepModels.work' .sdlc/config.json)
REVIEW_MODEL=$(jq -r '.cook.perStepModels.review' .sdlc/config.json)
MAX_ITER=$(jq -r '.cook.maxIterations // 3' .sdlc/config.json)

# Step 1: Spawn worker (cheap model)
claude-code --agent worker --model "$WORK_MODEL" --plan .rpi/plans/*.md

# Step 2: Spawn reviewer (expensive model)
claude-code --agent reviewer --model "$REVIEW_MODEL" --target HEAD
VERDICT=$(jq -r '.recommendation' /tmp/review-result.json)

# Step 3: Iterate on REQUEST_CHANGES (max $MAX_ITER)
ITER=0
while [ "$VERDICT" = "REQUEST_CHANGES" ] && [ $ITER -lt $MAX_ITER ]; do
  ITER=$((ITER + 1))
  claude-code --agent worker --model "$WORK_MODEL" --mode fix --findings /tmp/review-result.json
  claude-code --agent reviewer --model "$REVIEW_MODEL" --target HEAD
  VERDICT=$(jq -r '.recommendation' /tmp/review-result.json)
done
```

#### Pattern B: Ralph (Per-Phase Loop)

Iterate over each RPI plan phase. The worker tackles one phase at a time, checking off checkboxes:

```bash
# Extract phases from RPI plan
PLAN=$(ls -t .rpi/plans/*.md | head -1)
PHASES=$(grep -n "^### Phase" "$PLAN" | awk -F: '{print NR": "$2}')

echo "Ralph: executing $PHASES phases"

# Execute each phase sequentially
grep "^### Phase" "$PLAN" | while IFS= read -r phase; do
  PHASE_NAME=$(echo "$phase" | sed 's/^### //')
  echo "Ralph: Phase → $PHASE_NAME"
  
  # Worker implements this phase
  claude-code --agent worker --model "$WORK_MODEL" --phase "$PHASE_NAME" --plan "$PLAN"
  
  # Commit per phase
  git add -A
  git commit -m "feat: implement $PHASE_NAME

Part of RPI plan: $(basename $PLAN)
Co-Authored-By: Claude Code <noreply@anthropic.com>"
  
  # Check off this phase's checkboxes in the plan
  claude-code /rpi-verify "$PLAN" --phase "$PHASE_NAME"
done
```

#### Pattern C: Race (Parallel Competing Approaches)

Spawn multiple workers in parallel worktrees, then compare and pick the winner:

```bash
BRANCH=$(git branch --show-current)
BASE_SHA=$(git merge-base main HEAD)

# Create worktrees for competing approaches
git worktree add /tmp/race-v1 -b "${BRANCH}-race-v1" "$BASE_SHA"
git worktree add /tmp/race-v2 -b "${BRANCH}-race-v2" "$BASE_SHA"

# Spawn ALL branches in ONE message (parallel execution)
claude-code --agent worker --model "$WORK_MODEL" --cwd /tmp/race-v1 --plan .rpi/plans/*.md --approach "approach-a" &
claude-code --agent worker --model "$WORK_MODEL" --cwd /tmp/race-v2 --plan .rpi/plans/*.md --approach "approach-b" &
wait

# Compare diffs from both approaches
cook "compare approach a vs b" vs "compare" compare  # writes to .cook/compare-<session>.md
cp .cook/compare-*.md /tmp/race-comparison.md

# Pick the winner based on comparison
WINNER=$(jq -r '.winner' /tmp/race-comparison.json)
echo "Race winner: $WINNER"

# Merge winning approach
cook "synthesize winning approach from race" merge  # merge operator synthesizes results

# Cleanup worktrees
git worktree remove /tmp/race-v1
git worktree remove /tmp/race-v2
```

#### Pattern D: Merge (Synthesis of Competing Approaches)

Like race, but instead of picking a winner, synthesize the best of both:

```bash
# After race produces two implementations...
cook "synthesize best of approach a and approach b" merge  # synthesize operator

# The merge agent reviews both approaches and produces a synthesis
# that combines the strengths of each
```

### 3. TDD Mandate (All Patterns)

Regardless of Cook pattern, TDD discipline is mandatory:

```bash
# Step 1: Write failing tests FIRST
claude-code --agent worker --mode test-first --plan .rpi/plans/*.md
git add tests/
git commit -m "test: add failing tests for [feature]"

# Step 2: Verify tests fail (red)
npm test || pytest || cargo test || go test ./...
# Expected exit code: non-zero (tests should fail)

# Step 3: Implement to make tests pass
claude-code --agent worker --mode implement --plan .rpi/plans/*.md
git add src/
git commit -m "feat: implement [feature]"

# Step 4: Verify tests pass (green)
npm test || pytest || cargo test || go test ./...
# Expected exit code: 0

# Step 5: Refactor if needed (keep green)
claude-code --agent worker --mode refactor
git add .
git commit -m "refactor: improve [aspect]"
```

### 4. Decapod Tracing

Track execution for pipeline diagnostics:

```bash
# Start trace for this implementation phase
# decapod trace has no start/stop; use: decapod trace export --output /tmp/trace.json

# ... (implementation work happens here) ...

# End trace
# decapod trace export --output /tmp/trace-$(date +%s).json
```

### 5. Decapod Map (Parallel Processing)

For large refactors spanning many files, use Decapod's map for parallel execution:

```bash
# Split work across changed files
CHANGED_FILES=$(git diff main...HEAD --name-only)
decapod map --files "$CHANGED_FILES" --op "lint,test,type-check" --parallel 4
```

### 6. SoulForge Navigation

Use SoulForge to navigate the codebase during implementation:

```bash
# Navigate to relevant code before implementing
SF=/home/node/.openclaw/devbox-env/node_modules/@proxysoul/soulforge/dist/bin.sh
$SF --headless --json "authentication handler" --cwd $(pwd) > /tmp/nav-results.json

# Use --diff to capture evidence of changes
soulforge --diff "$(git diff main...HEAD)" --mode architect --session "$(cat .sdlc/soulforge-session-id)"
```

### 7. SoulForge AgentBus (Large Refactors)

For refactors touching many files, dispatch via AgentBus:

```bash
# Dispatch parallel agents for independent file groups
# soulforge agentbus doesn't exist — spawn parallel agents via sessions_spawn
# one dispatch per approach, all in the same turn
```

### 8. RPI Plan Verification

```bash
claude-code /rpi-verify .rpi/plans/*.md
# Checks completed implementation against plan checkboxes
```

### 9. Update Pipeline State

```bash
jq '.currentPhase = "implement" | .completedPhases += ["implement"]' \
  .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

| Artifact | Location | Purpose |
|----------|----------|---------|
| Test commits | Git log | TDD proof (test before impl) |
| Implementation commits | Git log | Feature work |
| Review results | `/tmp/review-result.json` | Review loop evidence |
| Race comparison | `/tmp/race-comparison.json` | Race pattern evidence |
| RPI plan | `.rpi/plans/*.md` | Updated checkboxes |
| Decapod trace | (Decapod internal) | Execution diagnostics |

## Failure Handling

| Failure | Action |
|---------|--------|
| Tests don't fail initially | Block commit — TDD violation |
| Tests don't pass after implementation | Debug until green, no exceptions |
| Review fails 3 times | Escalate to human review |
| Race produces no winner | Run merge/synthesize instead |
| Long-running (>30min) | Commit partial progress with `wip:` prefix |
| SoulForge navigate fails | Manual codebase exploration |
| AgentBus dispatch fails | Fall back to sequential execution |
| Decapod trace fails | Log warning, continue without tracing |

## Success Criteria

- [ ] TDD discipline followed (test commits precede implementation commits)
- [ ] All tests pass (green)
- [ ] Cook pattern executed correctly (review/ralph/race/merge)
- [ ] Per-step model routing applied (cheap work, expensive review)
- [ ] RPI plan checkboxes completed
- [ ] Worker self-verification passed (re-read diff, run build)
- [ ] Review loop produced APPROVE verdict
- [ ] Pipeline state updated