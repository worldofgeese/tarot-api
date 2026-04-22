---
name: sdlc-orchestrator
description: Master SDLC pipeline driver that orchestrates all phases and gates
triggers: [sdlc, pipeline, orchestrate, full-cycle]
---

# SDLC Orchestrator

The master pipeline driver that deterministically manages the entire SDLC lifecycle from specification through delivery.

## When to use

Use this skill when:
- Starting a new feature or bug fix that requires full SDLC governance
- Running the complete pipeline from spec to deployment
- Resuming a paused or failed pipeline run
- Coordinating multi-phase development with integrated gates

## Prerequisites

- `.sdlc/config.json` must exist with valid configuration
- Git repository initialized with main/master branch  
- Required tools available based on config (decapod, swamp, soulforge, etc.)
- Working directory is project root

## Steps

### 1. Initialize Pipeline State

Read configuration and detect current state:

```bash
cat .sdlc/config.json
if [ -f .sdlc/pipeline-state.json ]; then
  echo "Resuming from checkpoint..."
  cat .sdlc/pipeline-state.json
else
  echo "Starting new pipeline run..."
  cat > .sdlc/pipeline-state.json <<EOF
{
  "runId": "$(uuidgen)",
  "startTime": "$(date -Iseconds)",
  "currentPhase": "classify",
  "completedPhases": [],
  "gateResults": {},
  "reviseCycles": {}
}
EOF
fi
```

### 2. Classify Diff

Analyze the scope of changes to determine which gates to execute:

```bash
git diff main...HEAD --stat > /tmp/diff-stat.txt
LINES_CHANGED=$(git diff main...HEAD --shortstat | awk '{print $4+$6}')
FILES_CHANGED=$(git diff main...HEAD --name-only | wc -l)
SECURITY_FILES=$(git diff main...HEAD --name-only | grep -E '(auth|crypto|secret|password|token|key|cert)' | wc -l)
```

**Classification Algorithm:**

```
IF SECURITY_FILES > 0:
  gate_level = MAXIMUM  (all gates A-G)
ELIF LINES_CHANGED > 500 OR FILES_CHANGED > 10:
  gate_level = HIGH (gates A-F)
ELIF LINES_CHANGED > 150 OR FILES_CHANGED > 3:
  gate_level = MEDIUM (gates A-E)
ELSE:
  gate_level = LOW (gates A-C)
```

### 3. Execute SPEC Phase

```bash
claude-code /sdlc-spec
jq '.currentPhase = "spec" | .completedPhases += ["classify"]' .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

### 4. Execute DESIGN Phase

```bash
claude-code /sdlc-design
jq '.completedPhases += ["spec"]' .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

### 5. Execute IMPLEMENT Phase

```bash
claude-code /sdlc-implement
jq '.completedPhases += ["design"]' .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

### 6. Execute Gate A (Architecture)

```bash
claude-code /sdlc-gate-architecture
GATE_A_RESULT=$(jq -r '.gateResults["gate-a"].verdict' .sdlc/pipeline-state.json)

if [ "$GATE_A_RESULT" = "REVISE" ]; then
  REVISE_COUNT=$(jq -r '.reviseCycles["gate-a"] // 0' .sdlc/pipeline-state.json)
  if [ $REVISE_COUNT -lt 3 ]; then
    jq '.reviseCycles["gate-a"] = ((.reviseCycles["gate-a"] // 0) + 1)' .sdlc/pipeline-state.json > /tmp/state.json
    mv /tmp/state.json .sdlc/pipeline-state.json
    claude-code /sdlc-implement --focus-fixes
    claude-code /sdlc-gate-architecture
  else
    echo "ERROR: Gate A exceeded max revise cycles"
    exit 1
  fi
fi

jq '.completedPhases += ["gate-a"]' .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

### 7-12. Execute Remaining Gates

Run gates B through G following the same pattern, respecting classification level thresholds.

### 13. Collect Evidence and Metrics

```bash
claude-code /sdlc-evidence
jq '.status = "SUCCESS" | .endTime = "'"$(date -Iseconds)"'"' .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json

if [ ! -f .sdlc/gate-metrics.json ]; then
  echo '{"runs": []}' > .sdlc/gate-metrics.json
fi
jq --slurpfile state .sdlc/pipeline-state.json '.runs += $state | .runs |= .[-50:]' .sdlc/gate-metrics.json > /tmp/metrics.json
mv /tmp/metrics.json .sdlc/gate-metrics.json
```

## Evidence Output

**Location:** `.sdlc/pipeline-state.json`

**Format:**
```json
{
  "runId": "uuid",
  "startTime": "ISO8601",
  "endTime": "ISO8601",
  "status": "SUCCESS|FAILURE|PAUSED",
  "currentPhase": "phase-name",
  "completedPhases": ["classify", "spec", "design", "gate-a", "gate-b"],
  "gateResults": {
    "gate-a": {"verdict": "PASS", "score": 85}
  },
  "reviseCycles": {"gate-a": 1},
  "classification": {"gateLevel": "MEDIUM", "linesChanged": 200}
}
```

**Metrics:** `.sdlc/gate-metrics.json` (rolling 50-run window)

## Failure Handling

### Pipeline Interruption
- State preserved in `.sdlc/pipeline-state.json`
- Resume by running `/sdlc-orchestrator` again
- Detects incomplete phases and resumes from checkpoint

### Gate Failure
- Pipeline halts on FAIL verdict
- Error details in pipeline state
- Manual intervention required

### Max Revise Cycles
- Escalates to FAIL after 3 cycles per gate
- Human review required

### 14. Decapod Release Readiness (Post Gate-G)

After all gates pass, verify release readiness:

```bash
decapod release check --branch "$BRANCH" --output json > /tmp/release-check.json
RELEASE_READY=$(jq -r '.ready' /tmp/release-check.json)

if [ "$RELEASE_READY" = "true" ]; then
  echo "Release ready. Proceeding to merge."
else
  echo "Release not ready:"
  jq -r '.blockers[]' /tmp/release-check.json
fi
```

### 15. Decapod Trace (Pipeline Diagnostics)

The full pipeline run is traced for diagnostics:

```bash
# Start trace at pipeline initialization (Step 1)
# decapod trace has no start/stop; use: decapod trace export --output /tmp/trace.json

# ... pipeline runs ...

# Stop trace at pipeline completion
# decapod trace export --output /tmp/trace-$(date +%s).json
```

## Success Criteria

- All enabled gates return PASS or SKIP (with valid reason)
- No gate exceeds max revise cycles
- Evidence collected in Swamp
- Metrics recorded
- Pipeline state shows SUCCESS
- Decapod release check passes (if available)
