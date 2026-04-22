---
name: sdlc-gate-architecture
description: Gate A - Architecture review with SoulForge and decapod
triggers: [gate-a, gate-architecture, architecture-review]
---

# Gate A: Architecture Review

Automated architecture quality check using SoulForge, Decapod, and static analysis.

## When to use

Run after IMPLEMENT phase to validate architectural integrity.

## Prerequisites

- Implementation complete
- Git diff available against main branch
- SoulForge and Decapod available

## Steps

### 1. Run gate0-lint (Zero-LLM Lint)

```bash
python3 gate0-lint.py --path $(pwd) --output json > /tmp/gate0-lint.json
LINT_SCORE=$(jq -r '.score' /tmp/gate0-lint.json)
```

### 2. Launch SoulForge Architect Analysis

```bash
SESSION_ID=$(jq -r '.design.soulforgSessionId' .sdlc/pipeline-state.json)
if [ -n "$SESSION_ID" ]; then
  soulforge --headless --session $SESSION_ID --mode architect --max-steps 8 > /tmp/soulforge-gate-a.json
else
  soulforge --headless --mode architect --max-steps 8 --cwd $(pwd) --include "$(git diff main...HEAD --name-only)" --save-session > /tmp/soulforge-gate-a.json
fi
```

### 3. Run L1+L3 Copilot Analysis

```bash
python3 copilot_llm.py --level L1 --diff "$(git diff main...HEAD)" > /tmp/copilot-l1.json
python3 copilot_llm.py --level L3 --diff "$(git diff main...HEAD)" > /tmp/copilot-l3.json
```

### 4. Decapod Preflight Check

```bash
decapod preflight --cwd $(pwd) --output json > /tmp/decapod-preflight.json
```

### 5. Decapod Impact Prediction

```bash
decapod impact predict --files "$(git diff main...HEAD --name-only | tr '
' ',')" > /tmp/decapod-impact.json
```

### 6. Statistical Baseline Evaluation

```bash
decapod eval gate --gate-id gate-a --metrics /tmp/gate0-lint.json > /tmp/decapod-eval.json
```

### 7. Soul Analyze for Duplication

```bash
soul_analyze --path $(pwd) --check-duplication > /tmp/soul-duplication.json
```

### 8. Generate Verdict

```bash
python3 << 'PYSCRIPT'
import json

# Load all analysis results
lint = json.load(open('/tmp/gate0-lint.json'))
soulforge = json.load(open('/tmp/soulforge-gate-a.json'))
copilot_l1 = json.load(open('/tmp/copilot-l1.json'))
copilot_l3 = json.load(open('/tmp/copilot-l3.json'))
impact = json.load(open('/tmp/decapod-impact.json'))
duplication = json.load(open('/tmp/soul-duplication.json'))

# Scoring logic
scores = {
    'lint': lint['score'],
    'architecture': soulforge.get('architectureScore', 0),
    'complexity': copilot_l1.get('complexityScore', 0),
    'maintainability': copilot_l3.get('maintainabilityScore', 0)
}

avg_score = sum(scores.values()) / len(scores)

# Determine verdict
if avg_score >= 80:
    verdict = "PASS"
elif avg_score >= 60:
    verdict = "REVISE"
    notes = ["Improve architecture score", "Reduce complexity"]
else:
    verdict = "FAIL"
    notes = ["Critical architecture issues"]

result = {
    'verdict': verdict,
    'score': avg_score,
    'scores': scores,
    'revisionNotes': notes if verdict == "REVISE" else []
}

print(json.dumps(result, indent=2))
with open('/tmp/gate-a-result.json', 'w') as f:
    json.dump(result, f)
PYSCRIPT
```

### 9. Record Evidence in Swamp

```bash
# Write evidence to gate-evidence/ (swamp data query can read via workflow)
cp /tmp/gate-a-result.json gate-evidence/$(echo '["gate-a","architecture"]' | tr -d '[]\"' | tr ',' '-')-$(date +%s).json
```

### 10. Update Pipeline State

```bash
jq --slurpfile result /tmp/gate-a-result.json '.gateResults["gate-a"] = $result[0]' .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

**Swamp Report:** Labels `["gate-a", "architecture"]`

**Format:**
```json
{
  "verdict": "PASS|REVISE|FAIL",
  "score": 85,
  "scores": {
    "lint": 90,
    "architecture": 85,
    "complexity": 80,
    "maintainability": 85
  },
  "revisionNotes": []
}
```

## Failure Handling

- FAIL verdict: Pipeline halts, manual intervention required
- REVISE verdict: Extract notes, trigger fix cycle (max 3)
- SoulForge unavailable: Skip architect analysis, use lint + copilot only
- Decapod unavailable: Skip preflight/impact, use other signals

## Success Criteria

- Verdict is PASS (score >= 80)
- All analysis tools completed successfully
- Evidence recorded in Swamp
- Pipeline state updated
