---
name: sdlc-gate-judge
description: Gate D - Judge evaluation with 3-sample uncertainty
triggers: [gate-d, gate-judge, judge-evaluation]
---

# Gate D: Judge Evaluation

Multi-sample judge evaluation with uncertainty quantification and harness suggestions.

## When to use

Run after Gate C to validate implementation against specification.

## Prerequisites

- Gate C passed or skipped
- RPI plan or spec available
- Test results from Gate B

## Steps

### 1. Auto-Detect Specification

```bash
if [ -f .rpi/plans/*.md ]; then
  SPEC_FILE=$(ls -t .rpi/plans/*.md | head -1)
elif [ -f .rpi/designs/*.md ]; then
  SPEC_FILE=$(ls -t .rpi/designs/*.md | head -1)
else
  echo "ERROR: No specification found"
  exit 1
fi
```

### 2. Run Judge with 3 Samples

```bash
python3 judge-with-uncertainty.py "$SPEC_FILE" "$(git diff main...HEAD)" /tmp/gate-verify.json --samples 3 --output json > /tmp/judge-results.json
```

### 3. Load Thresholds from Config

```bash
LOW_THRESHOLD=$(jq -r '.gates.judge.thresholds.low' .sdlc/config.json)
MEDIUM_THRESHOLD=$(jq -r '.gates.judge.thresholds.medium' .sdlc/config.json)
```

### 4. Evaluate Samples

```bash
python3 << 'PYSCRIPT'
import json

results = json.load(open('/tmp/judge-results.json'))
config = json.load(open('.sdlc/config.json'))

low_threshold = config['gates']['judge']['thresholds']['low']
medium_threshold = config['gates']['judge']['thresholds']['medium']

samples = results['samples']
scores = [s['score'] for s in samples]
avg_score = sum(scores) / len(scores)
variance = sum((s - avg_score)**2 for s in scores) / len(scores)
uncertainty = variance ** 0.5

# Scoring logic
if avg_score >= low_threshold:  # >= 80
    verdict = "PASS"
    risk = "LOW"
elif avg_score >= medium_threshold:  # 60-79
    verdict = "REVISE"
    risk = "MEDIUM"
else:  # < 60
    verdict = "FAIL"
    risk = "HIGH"

result = {
    'verdict': verdict,
    'score': avg_score,
    'risk': risk,
    'uncertainty': uncertainty,
    'samples': samples,
    'revisionNotes': results.get('revisionNotes', [])
}

with open('/tmp/gate-d-result.json', 'w') as f:
    json.dump(result, f)
print(json.dumps(result, indent=2))
PYSCRIPT
```

### 5. Decapod Gate Evaluation

```bash
decapod eval gate --aggregate-id $(git rev-parse --abbrev-ref HEAD) --gate-id gate-d --metrics /tmp/gate-d-result.json
```

### 6. Post-Judge Feedback

```bash
python3 post-judge-feedback.py /tmp/gate-d-result.json --output /tmp/harness-suggestions.json
```

### 7. Query Cross-Gate Evidence

```bash
swamp data query 'tags.type=="report"' --format json > /tmp/all-gate-evidence.json
```

### 8. Handle REVISE Verdict

```bash
VERDICT=$(jq -r '.verdict' /tmp/gate-d-result.json)

if [ "$VERDICT" = "REVISE" ]; then
  REVISE_COUNT=$(jq -r '.reviseCycles["gate-d"] // 0' .sdlc/pipeline-state.json)
  
  if [ $REVISE_COUNT -lt 3 ]; then
    # Extract revision notes
    jq -r '.revisionNotes[]' /tmp/gate-d-result.json > /tmp/revise-notes.txt
    
    # Spawn fix agent
    claude-code --agent worker --mode fix --notes /tmp/revise-notes.txt --harness /tmp/harness-suggestions.json
    
    # Increment counter
    jq '.reviseCycles["gate-d"] = ((.reviseCycles["gate-d"] // 0) + 1)' .sdlc/pipeline-state.json > /tmp/state.json
    mv /tmp/state.json .sdlc/pipeline-state.json
    
    # Re-run judge
    exec $0
  else
    echo "ERROR: Gate D exceeded max revise cycles"
    exit 1
  fi
fi
```

### 9. Record Evidence in Swamp

```bash
# Write evidence to gate-evidence/ (swamp data query can read via workflow)
cp /tmp/gate-d-result.json gate-evidence/$(echo '["gate-d","judge"]' | tr -d '[]\"' | tr ',' '-')-$(date +%s).json
```

### 10. Update Pipeline State

```bash
jq --slurpfile result /tmp/gate-d-result.json '.gateResults["gate-d"] = $result[0]' .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

**Swamp Report:** Labels `["gate-d", "judge"]`

**Format:**
```json
{
  "verdict": "PASS|REVISE|FAIL",
  "score": 85,
  "risk": "LOW|MEDIUM|HIGH",
  "uncertainty": 3.2,
  "samples": [
    {"perspective": "correctness", "score": 87},
    {"perspective": "completeness", "score": 85},
    {"perspective": "quality", "score": 83}
  ],
  "revisionNotes": [],
  "harnessSuggestion": "Add integration tests"
}
```

## Failure Handling

- FAIL verdict: Pipeline halts, escalate to human
- REVISE verdict: Extract notes, spawn fix agent, re-judge (max 3)
- High uncertainty (>10): Flag for manual review
- No spec found: Cannot proceed, require manual spec creation

## Success Criteria

- Verdict is PASS (score >= 80)
- Uncertainty is acceptable (<10)
- All 3 samples consistent (low variance)
- Evidence recorded in Swamp
- Harness suggestions documented
