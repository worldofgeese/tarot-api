---
name: sdlc-gate-behavioral
description: Gate C - Behavioral testing with Swamp workflows and Playwright
triggers: [gate-c, gate-behavioral, behavioral-tests, e2e]
---

# Gate C: Behavioral Verification

End-to-end behavioral testing using Swamp workflows and Playwright instrumentation.

## When to use

Run after Gate B to validate runtime behavior and user interactions.

## Prerequisites

- Gate B passed
- `.swamp.yaml` exists (optional - skips if absent)
- Playwright available if UI testing required

## Steps

### 1. Check for Swamp Configuration

```bash
if [ ! -f .swamp.yaml ]; then
  echo '{"verdict": "SKIP", "reason": "No behavioral tests configured"}' > /tmp/gate-c-result.json
  # Write evidence to gate-evidence/ (swamp data query can read via workflow)
cp /tmp/gate-c-result.json gate-evidence/$(echo '["gate-c","behavioral"]' | tr -d '[]\"' | tr ',' '-')-$(date +%s).json
  exit 0
fi
```

### 2. Run Swamp Workflow

```bash
swamp workflow run behavioral --output json > /tmp/swamp-workflow.json
WORKFLOW_PASSED=$(jq -r '.passed' /tmp/swamp-workflow.json)
WORKFLOW_COVERAGE=$(jq -r '.coverage' /tmp/swamp-workflow.json)
```

### 3. Playwright Tracing

```bash
# Start tracing
playwright tracing-start --name gate-c-behavioral

# Navigate and interact (from workflow steps)
cat .swamp.yaml | yq -r '.workflows.behavioral.steps[] | .action' | while read action; do
  playwright $action
done

# Stop tracing
playwright tracing-stop --output /tmp/gate-c-trace.zip
```

### 4. Playwright Video Recording

```bash
playwright video-start --output-dir /tmp/gate-c-videos

# Run behavioral tests
swamp workflow run behavioral

playwright video-stop
```

### 5. Console and Network Capture

```bash
playwright console capture --output /tmp/gate-c-console.log
playwright network capture --output /tmp/gate-c-network.har
```

### 6. State Save for Reproducibility

```bash
playwright state-save --name gate-c-final-state --output /tmp/gate-c-state.json
```

### 7. Upload Traces as Artifacts

```bash
fj-ex actions artifacts upload gate-c-trace /tmp/gate-c-trace.zip
fj-ex actions artifacts upload gate-c-videos /tmp/gate-c-videos/
fj-ex actions artifacts upload gate-c-console /tmp/gate-c-console.log
fj-ex actions artifacts upload gate-c-network /tmp/gate-c-network.har
```

### 8. Generate Swamp Report

```bash
swamp report search behavioral --json > /tmp/swamp-report.json
```

### 9. Generate Verdict

```bash
python3 << 'PYSCRIPT'
import json

workflow = json.load(open('/tmp/swamp-workflow.json'))
report = json.load(open('/tmp/swamp-report.json'))

passed = workflow['passed']
coverage = workflow.get('coverage', 0)

if passed and coverage >= 80:
    verdict = "PASS"
    score = 95
elif passed and coverage >= 60:
    verdict = "PASS"
    score = 80
elif passed:
    verdict = "REVISE"
    score = 70
    notes = ["Increase test coverage"]
else:
    verdict = "FAIL"
    score = 40
    notes = ["Behavioral tests failing"]

result = {
    'verdict': verdict,
    'score': score,
    'coverage': coverage,
    'tracesUploaded': True,
    'revisionNotes': notes if verdict != "PASS" else []
}

with open('/tmp/gate-c-result.json', 'w') as f:
    json.dump(result, f)
print(json.dumps(result, indent=2))
PYSCRIPT
```

### 10. Record Evidence in Swamp

```bash
# Write evidence to gate-evidence/ (swamp data query can read via workflow)
cp /tmp/gate-c-result.json gate-evidence/$(echo '["gate-c","behavioral"]' | tr -d '[]\"' | tr ',' '-')-$(date +%s).json
```

### 11. Update Pipeline State

```bash
jq --slurpfile result /tmp/gate-c-result.json '.gateResults["gate-c"] = $result[0]' .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

**Swamp Report:** Labels `["gate-c", "behavioral"]`

**Artifacts:**
- Playwright trace: `/tmp/gate-c-trace.zip`
- Videos: `/tmp/gate-c-videos/`
- Console logs: `/tmp/gate-c-console.log`
- Network HAR: `/tmp/gate-c-network.har`
- Saved state: `/tmp/gate-c-state.json`

**Format:**
```json
{
  "verdict": "PASS|REVISE|FAIL|SKIP",
  "score": 95,
  "coverage": 85,
  "tracesUploaded": true,
  "revisionNotes": []
}
```

## Failure Handling

- No .swamp.yaml: SKIP with documented reason
- Workflow fails: Extract failure steps, trigger fix cycle
- Low coverage: REVISE with coverage improvement notes
- Playwright unavailable: Run Swamp workflow without instrumentation

## Success Criteria

- Swamp workflow passes
- Coverage >= 80%
- Traces captured and uploaded
- Evidence recorded in Swamp
- State saved for reproducibility
