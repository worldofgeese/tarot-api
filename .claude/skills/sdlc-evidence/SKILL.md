---
name: sdlc-evidence
description: Evidence collection and querying across all gates using Swamp
triggers: [evidence, gate-evidence, collect-evidence, query-evidence]
---

# SDLC Evidence Collection & Management

Manages evidence collection, storage, and retrieval for all SDLC gates using Swamp as the authoritative storage backend.

## When to use

Use this skill when:
- Completing the full pipeline and need to collect all evidence
- Querying evidence from specific gates or runs
- Generating audit reports for compliance
- Investigating gate failures or issues
- Performing post-mortem analysis
- Creating evidence summaries for stakeholders

## Prerequisites

- Swamp CLI available and configured
- Gates have executed and recorded evidence
- `.sdlc/pipeline-state.json` exists with gate results
- ByteRover available for version control integration (optional)
- Working directory is project root

## Steps

### 1. Query All Gate Evidence

Retrieve evidence from all gates for the current branch:

```bash
BRANCH=$(git branch --show-current)
PROJECT=$(basename $(pwd))

echo "Querying evidence for branch: $BRANCH"

# Query all gate reports
swamp data query 'tags.type=="report" && tags.branch=="'$BRANCH'"' \
  --format json > /tmp/all-gate-evidence.json

REPORT_COUNT=$(jq '. | length' /tmp/all-gate-evidence.json)
echo "Found $REPORT_COUNT gate reports"

# Parse by gate
for gate in gate-a gate-b gate-c gate-d gate-e gate-f gate-g; do
  jq --arg gate "$gate" '[.[] | select(.tags.gate==$gate)]' \
    /tmp/all-gate-evidence.json > /tmp/evidence-$gate.json
  
  count=$(jq '. | length' /tmp/evidence-$gate.json)
  
  if [ $count -gt 0 ]; then
    verdict=$(jq -r '.[0].verdict // "N/A"' /tmp/evidence-$gate.json)
    score=$(jq -r '.[0].score // "N/A"' /tmp/evidence-$gate.json)
    echo "  $gate: $verdict (score: $score)"
  else
    echo "  $gate: NO EVIDENCE"
  fi
done
```

### 2. Swamp Report Model Type

Swamp uses a structured report model type for gate evidence:

```bash
# Get Swamp report schema
swamp model get report --output json > /tmp/report-schema.json

echo "Report model fields:"
jq -r '.fields[].name' /tmp/report-schema.json

# Standard report structure:
# - type: "report"
# - gate: "gate-a" | "gate-b" | ... | "gate-g"
# - verdict: "PASS" | "FAIL" | "REVISE" | "SKIP"
# - score: 0-100
# - timestamp: ISO8601
# - branch: branch name
# - commit: commit SHA
# - results: gate-specific structured data
# - labels: ["gate-X", "category", ...]
```

### 3. Mirror to gate-evidence/ Directory (Secondary Storage)

Swamp is the authority, but also mirror to local directory for convenience:

```bash
mkdir -p gate-evidence/

# Copy each gate's evidence
for gate in gate-a gate-b gate-c gate-d gate-e gate-f gate-g; do
  if [ -f /tmp/evidence-$gate.json ] && [ $(jq '. | length' /tmp/evidence-$gate.json) -gt 0 ]; then
    cp /tmp/evidence-$gate.json gate-evidence/$gate-$(date +%Y%m%d-%H%M%S).json
  fi
done

echo "Evidence mirrored to gate-evidence/"
```

**Important:** `gate-evidence/` mirrors Swamp for convenience. **Swamp is the authoritative source.** Always query Swamp for latest evidence, not local files.

### 4. Collect Gate Metrics

Aggregate metrics across the pipeline run:

```bash
# Extract key metrics from each gate
python3 << 'PYSCRIPT'
import json
import os

metrics = {
    'runId': None,
    'branch': os.popen('git branch --show-current').read().strip(),
    'commit': os.popen('git rev-parse HEAD').read().strip(),
    'timestamp': os.popen('date -Iseconds').read().strip(),
    'gates': {}
}

gates = ['gate-a', 'gate-b', 'gate-c', 'gate-d', 'gate-e', 'gate-f', 'gate-g']

for gate in gates:
    evidence_file = f'/tmp/evidence-{gate}.json'
    if os.path.exists(evidence_file):
        with open(evidence_file) as f:
            evidence = json.load(f)
            if evidence:
                latest = evidence[0]  # Most recent
                metrics['gates'][gate] = {
                    'verdict': latest.get('verdict', 'N/A'),
                    'score': latest.get('score', 0),
                    'timestamp': latest.get('timestamp'),
                    'duration_ms': latest.get('duration_ms', 0)
                }
            else:
                metrics['gates'][gate] = {'verdict': 'SKIPPED'}
    else:
        metrics['gates'][gate] = {'verdict': 'NOT_RUN'}

# Load run ID from pipeline state
if os.path.exists('.sdlc/pipeline-state.json'):
    with open('.sdlc/pipeline-state.json') as f:
        state = json.load(f)
        metrics['runId'] = state.get('runId')
        metrics['classification'] = state.get('classification', {})

# Write metrics
with open('/tmp/gate-metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

print(json.dumps(metrics, indent=2))
PYSCRIPT
```

### 5. Update Rolling Metrics Window

Maintain a rolling 50-run window of metrics:

```bash
# Initialize if doesn't exist
if [ ! -f .sdlc/gate-metrics.json ]; then
  echo '{"runs": []}' > .sdlc/gate-metrics.json
fi

# Append current run and keep last 50
jq --slurpfile current /tmp/gate-metrics.json \
  '.runs += $current | .runs |= .[-50:]' \
  .sdlc/gate-metrics.json > /tmp/metrics-updated.json

mv /tmp/metrics-updated.json .sdlc/gate-metrics.json

echo "Metrics updated: $(jq '.runs | length' .sdlc/gate-metrics.json) runs recorded"
```

### 6. ByteRover Version Control Integration

If ByteRover is enabled, version control the evidence:

```bash
if command -v brv &> /dev/null; then
  # Check if byterover is enabled in config
  BRV_ENABLED=$(jq -r '.project.tools.byterover // false' .sdlc/config.json)
  
  if [ "$BRV_ENABLED" = "true" ]; then
    echo "ByteRover enabled - version controlling evidence..."
    
    # Add evidence files to ByteRover VC
    brv vc add gate-evidence/*.json
    brv vc add .sdlc/gate-metrics.json
    brv vc add .sdlc/pipeline-state.json
    
    # Commit evidence
    brv vc commit \
      --message "SDLC pipeline evidence: $BRANCH @ $(git rev-parse --short HEAD)" \
      --tags "sdlc,evidence,$(date +%Y-%m-%d)"
    
    # Push to ByteRover remote (if configured)
    brv vc push || echo "WARNING: ByteRover VC push failed (non-blocking)"
    
    echo "Evidence version controlled in ByteRover"
  else
    echo "ByteRover available but disabled in config"
  fi
else
  echo "ByteRover not available - skipping VC integration"
fi
```

### 7. Generate Evidence Summary Report

Create human-readable summary:

```bash
python3 << 'PYSCRIPT'
import json

metrics = json.load(open('/tmp/gate-metrics.json'))

print("=" * 60)
print("SDLC PIPELINE EVIDENCE SUMMARY")
print("=" * 60)
print()
print(f"Run ID:     {metrics['runId']}")
print(f"Branch:     {metrics['branch']}")
print(f"Commit:     {metrics['commit'][:12]}")
print(f"Timestamp:  {metrics['timestamp']}")
print()

if 'classification' in metrics:
    cls = metrics['classification']
    print("Classification:")
    print(f"  Gate Level: {cls.get('gateLevel', 'N/A')}")
    print(f"  Lines:      {cls.get('linesChanged', 0)}")
    print(f"  Files:      {cls.get('filesChanged', 0)}")
    print()

print("Gate Results:")
print("-" * 60)

gates_display = {
    'gate-a': 'Gate A (Architecture)',
    'gate-b': 'Gate B (Structural)',
    'gate-c': 'Gate C (Behavioral)',
    'gate-d': 'Gate D (Judge)',
    'gate-e': 'Gate E (Verification)',
    'gate-f': 'Gate F (CI/CD)',
    'gate-g': 'Gate G (Council)'
}

for gate_id, gate_name in gates_display.items():
    result = metrics['gates'].get(gate_id, {})
    verdict = result.get('verdict', 'NOT_RUN')
    score = result.get('score', 0)
    
    # Format verdict with color codes (if terminal supports)
    if verdict == 'PASS':
        verdict_str = f"✓ {verdict}"
    elif verdict == 'FAIL':
        verdict_str = f"✗ {verdict}"
    elif verdict == 'SKIP' or verdict == 'SKIPPED':
        verdict_str = f"⊘ {verdict}"
    else:
        verdict_str = f"  {verdict}"
    
    if isinstance(score, (int, float)) and score > 0:
        print(f"  {gate_name:30} {verdict_str:15} (score: {score})")
    else:
        print(f"  {gate_name:30} {verdict_str:15}")

print("=" * 60)

# Overall status
all_verdicts = [r.get('verdict') for r in metrics['gates'].values()]
if all(v in ['PASS', 'SKIP', 'SKIPPED'] for v in all_verdicts if v):
    print("OVERALL STATUS: ✓ PASS")
elif 'FAIL' in all_verdicts:
    print("OVERALL STATUS: ✗ FAIL")
else:
    print("OVERALL STATUS: ⧗ IN PROGRESS")

print("=" * 60)
PYSCRIPT

# Save report
python3 << 'PYSCRIPT'
import json
metrics = json.load(open('/tmp/gate-metrics.json'))
# (same script as above)
PYSCRIPT > /tmp/evidence-summary.txt

cat /tmp/evidence-summary.txt
```

### 8. Store Summary in Swamp

```bash
# Store the summary report
# swamp data insert doesn't exist — evidence written to gate-evidence/ JSON files

# Store structured metrics
# swamp data insert doesn't exist — evidence written to gate-evidence/ JSON files

echo "Evidence summary stored in Swamp"
```

### 9. Cross-Gate Evidence Query Example

Demonstrate how to query evidence across multiple gates:

```bash
# Example: Find all FAIL verdicts across all gates
swamp data query 'tags.type=="report" && verdict=="FAIL"' \
  --format json > /tmp/all-failures.json

FAILURE_COUNT=$(jq '. | length' /tmp/all-failures.json)

if [ $FAILURE_COUNT -gt 0 ]; then
  echo "WARNING: Found $FAILURE_COUNT gate failures"
  jq -r '.[] | "\(.tags.gate): \(.revisionNotes // "No notes")"' /tmp/all-failures.json
fi

# Example: Query all security-related evidence
swamp data query 'tags.gate=="gate-e" || tags.type=="security-audit"' \
  --format json > /tmp/security-evidence.json

# Example: Get evidence for specific commit
COMMIT_SHA=$(git rev-parse HEAD)
swamp data query 'tags.commit=="'$COMMIT_SHA'"' \
  --format json > /tmp/commit-evidence.json
```

### 10. Update Pipeline State with Evidence Pointers

```bash
# Add evidence references to pipeline state
jq --arg summary "$(cat /tmp/evidence-summary.txt)" \
  '.evidence = {
    "summaryText": $summary,
    "swampQueries": {
      "allReports": "tags.type==\"report\" && tags.branch==\"'$BRANCH'\"",
      "gateA": "tags.gate==\"gate-a\" && tags.branch==\"'$BRANCH'\"",
      "gateB": "tags.gate==\"gate-b\" && tags.branch==\"'$BRANCH'\"",
      "gateC": "tags.gate==\"gate-c\" && tags.branch==\"'$BRANCH'\"",
      "gateD": "tags.gate==\"gate-d\" && tags.branch==\"'$BRANCH'\"",
      "gateE": "tags.gate==\"gate-e\" && tags.branch==\"'$BRANCH'\"",
      "gateF": "tags.gate==\"gate-f\" && tags.branch==\"'$BRANCH'\"",
      "gateG": "tags.gate==\"gate-g\" && tags.branch==\"'$BRANCH'\""
    },
    "mirrorPath": "gate-evidence/",
    "metricsPath": ".sdlc/gate-metrics.json"
  }' .sdlc/pipeline-state.json > /tmp/state.json

mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

**Primary Location:** Swamp database (authoritative)

**Query Structure:**
```bash
# All evidence for a branch
swamp data query 'tags.branch=="feature/new-api"' --format json

# Specific gate
swamp data query 'tags.gate=="gate-a" && tags.branch=="feature/new-api"' --format json

# By verdict
swamp data query 'verdict=="FAIL"' --format json

# By date range
swamp data query 'timestamp >= "2026-04-01" && timestamp <= "2026-04-30"' --format json

# Cross-gate query
swamp data query 'tags.type=="report"' --format json
```

**Secondary Location:** `gate-evidence/` directory (mirror only)

**Metrics Location:** `.sdlc/gate-metrics.json` (rolling 50-run window)

**Report Structure (stored in Swamp):**
```json
{
  "type": "report",
  "gate": "gate-a",
  "verdict": "PASS",
  "score": 85,
  "timestamp": "2026-04-22T10:30:00Z",
  "branch": "feature/new-api",
  "commit": "abc123def456",
  "results": {
    // Gate-specific structured data
  },
  "labels": ["gate-a", "architecture", "feature/new-api"]
}
```

## Failure Handling

### Swamp Unavailable

```bash
echo "ERROR: Swamp unavailable - cannot query evidence"

# Fall back to local gate-evidence/ directory
if [ -d gate-evidence/ ]; then
  echo "Falling back to local gate-evidence/ mirror"
  
  for file in gate-evidence/*.json; do
    echo "Evidence file: $file"
    jq -r '.verdict // "N/A"' "$file"
  done
else
  echo "ERROR: No evidence available (Swamp down, no local mirror)"
  exit 1
fi
```

### No Evidence Found

```bash
REPORT_COUNT=$(jq '. | length' /tmp/all-gate-evidence.json)

if [ $REPORT_COUNT -eq 0 ]; then
  echo "WARNING: No gate evidence found for branch $BRANCH"
  echo "Possible causes:"
  echo "  - Gates not yet run"
  echo "  - Evidence not recorded"
  echo "  - Wrong branch name"
  echo "  - Swamp query syntax error"
  
  # Check pipeline state for clues
  if [ -f .sdlc/pipeline-state.json ]; then
    echo "Pipeline state indicates:"
    jq -r '.completedPhases[]' .sdlc/pipeline-state.json
  fi
fi
```

### ByteRover VC Fails

```bash
# Non-blocking - continue even if ByteRover VC fails
if ! brv vc push; then
  echo "WARNING: ByteRover VC push failed"
  echo "Evidence is still stored in Swamp"
  echo "Manual ByteRover sync may be needed later"
fi
```

### Metrics Update Fails

```bash
if ! jq --slurpfile current /tmp/gate-metrics.json \
  '.runs += $current | .runs |= .[-50:]' \
  .sdlc/gate-metrics.json > /tmp/metrics-updated.json; then
  
  echo "WARNING: Failed to update rolling metrics"
  echo "Current run metrics saved to /tmp/gate-metrics.json"
  echo "Manual merge may be needed"
fi
```

## Success Criteria

- All gate evidence queried from Swamp successfully
- Evidence mirrored to `gate-evidence/` directory
- Gate metrics aggregated and updated in rolling window (50 runs)
- Evidence summary report generated
- ByteRover version control integration completed (if enabled)
- Pipeline state updated with evidence pointers
- No missing evidence for gates that were executed
- Swamp queries documented for easy retrieval
- Summary report shows overall pipeline status (PASS/FAIL/IN PROGRESS)
