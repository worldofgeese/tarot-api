---
name: sdlc-gate-council
description: Gate G - Multi-model council deliberation with Playwright instrumentation
triggers: [gate-g, gate-council, council-review, multi-model-review]
---

# SDLC Gate G — Multi-Model Council Review

Gate G convenes a council of multiple AI models for deliberative review of complex or high-risk changes. This is the final gate before merge approval, using diverse perspectives to ensure quality.

## When to use

Use this skill when:
- All prior gates (A through F) have passed
- Change meets threshold criteria for council review
- Complex architectural decisions were made
- Security-sensitive changes present
- High-impact or high-risk implementation

**Threshold Criteria (from `.sdlc/config.json`):**
- Lines changed > 150, OR
- Files changed > 3, OR
- Security keywords in diff (auth, crypto, secret, password, token, etc.)

**Deterministic Skip Logic:**
If NONE of the threshold criteria are met, Gate G is **automatically skipped** with documented reason. This is deterministic and not subject to interpretation.

## Prerequisites

- Gates A through F completed with PASS verdicts
- council-review.py script available
- 4 models configured in `.sdlc/config.json` under `models.council[]`
- Playwright available for instrumented review
- Git diff available for analysis
- Specification available (`.rpi/plans/*.md`)
- All prior gate evidence available in Swamp
- Working directory is project root

## Steps

### 1. Check Threshold Criteria

Deterministic evaluation of whether council review is required:

```bash
# Calculate diff metrics
LINES_CHANGED=$(git diff main...HEAD --shortstat | awk '{print $4+$6}')
FILES_CHANGED=$(git diff main...HEAD --name-only | wc -l)
SECURITY_FILES=$(git diff main...HEAD --name-only | \
  grep -iE '(auth|authz|crypto|secret|password|token|jwt|session|key|cert|ssl|tls)' | wc -l)

echo "Lines changed: $LINES_CHANGED"
echo "Files changed: $FILES_CHANGED"
echo "Security-sensitive files: $SECURITY_FILES"

# Load thresholds from config
LINE_THRESHOLD=$(jq -r '.gates.council.lineThreshold // 150' .sdlc/config.json)
FILE_THRESHOLD=$(jq -r '.gates.council.fileThreshold // 3' .sdlc/config.json)
SECURITY_KEYWORDS=$(jq -r '.gates.council.securityKeywords // true' .sdlc/config.json)

# Evaluate thresholds
COUNCIL_REQUIRED=false

if [ $LINES_CHANGED -gt $LINE_THRESHOLD ]; then
  echo "✓ Council required: Lines changed ($LINES_CHANGED) > threshold ($LINE_THRESHOLD)"
  COUNCIL_REQUIRED=true
  TRIGGER_REASON="lines_changed"
elif [ $FILES_CHANGED -gt $FILE_THRESHOLD ]; then
  echo "✓ Council required: Files changed ($FILES_CHANGED) > threshold ($FILE_THRESHOLD)"
  COUNCIL_REQUIRED=true
  TRIGGER_REASON="files_changed"
elif [ "$SECURITY_KEYWORDS" = "true" ] && [ $SECURITY_FILES -gt 0 ]; then
  echo "✓ Council required: Security-sensitive files detected ($SECURITY_FILES)"
  COUNCIL_REQUIRED=true
  TRIGGER_REASON="security_keywords"
else
  echo "✗ Council NOT required: All thresholds below limits"
  COUNCIL_REQUIRED=false
  TRIGGER_REASON="below_threshold"
fi

# If not required, skip with documented reason
if [ "$COUNCIL_REQUIRED" = "false" ]; then
  jq --arg reason "$TRIGGER_REASON" \
    '.gateResults["gate-g"] = {
      "verdict": "SKIP",
      "reason": $reason,
      "metrics": {
        "linesChanged": '$LINES_CHANGED',
        "filesChanged": '$FILES_CHANGED',
        "securityFiles": '$SECURITY_FILES'
      },
      "timestamp": "'$(date -Iseconds)'"
    } | .completedPhases += ["gate-g"]' \
    .sdlc/pipeline-state.json > /tmp/state.json
  
  mv /tmp/state.json .sdlc/pipeline-state.json
  
  echo "Gate G SKIPPED: $TRIGGER_REASON"
  exit 0
fi

echo "Proceeding with council review (reason: $TRIGGER_REASON)"
```

### 2. Prepare Council Review Context

Gather all context needed for council deliberation:

```bash
BRANCH=$(git branch --show-current)
PROJECT=$(basename $(pwd))

council-review.py prepare "$PROJECT" "$BRANCH" --base main \
  --output-dir /tmp/council-context

# This script gathers:
# - Full diff
# - RPI plan/spec
# - All gate evidence (A-F)
# - Test results
# - Coverage reports
# - Security findings
# - CI logs

echo "Council context prepared at /tmp/council-context/"
```

### 3. Start Playwright Instrumentation

Enable Playwright tracing and video recording for the review session:

```bash
# Start tracing
playwright tracing-start \
  --name "gate-g-council-review-$BRANCH" \
  --screenshots \
  --snapshots

# Start video recording
playwright video-start \
  --name "council-review-$(date +%Y%m%d-%H%M%S)" \
  --output-dir /tmp/council-videos

# Enable console capture
playwright console capture \
  --output /tmp/council-console.log

# Enable network capture
playwright network capture \
  --output /tmp/council-network.har \
  --include-bodies
```

**Purpose:** Full observability of the review process for audit trail and debugging.

### 4. Load Council Models

Read council configuration and prepare models:

```bash
# Load council member models from config
COUNCIL_MODELS=$(jq -r '.models.council[]' .sdlc/config.json)

# Parse into array
IFS=$'\n' read -rd '' -a MODELS <<<"$COUNCIL_MODELS"

echo "Council members:"
for i in "${!MODELS[@]}"; do
  echo "  Model $((i+1)): ${MODELS[$i]}"
done

# Determine lead model using daily rotation
# hash(date) % 4 determines which model leads today
LEAD_INDEX=$(( $(date +%Y%m%d | md5sum | cut -c1-8 | awk '{print "0x"$1}') % 4 ))
LEAD_MODEL="${MODELS[$LEAD_INDEX]}"

echo "Today's lead model: $LEAD_MODEL (index $LEAD_INDEX)"
```

### 5. Round 1 — Independent Assessments

Each model reviews independently without seeing other responses:

```bash
echo "=== Round 1: Independent Assessments ==="

# Create response directory
mkdir -p /tmp/council-responses/round1

for i in "${!MODELS[@]}"; do
  model="${MODELS[$i]}"
  echo "Model $((i+1)) ($model) reviewing..."
  
  # Spawn isolated review
  council-review.py review \
    --model "$model" \
    --context-dir /tmp/council-context \
    --round 1 \
    --isolated \
    --output /tmp/council-responses/round1/model-$i.json &
  
  # Store PID for later
  PIDS[$i]=$!
done

# Wait for all models to complete
echo "Waiting for all models to complete Round 1..."
for pid in "${PIDS[@]}"; do
  wait $pid
done

echo "Round 1 complete"

# Aggregate Round 1 responses
jq -s '.' /tmp/council-responses/round1/*.json > /tmp/council-round1-aggregate.json
```

### 6. Round 2 — Lead Synthesis

Lead model reads all Round 1 responses and identifies consensus/disagreements:

```bash
echo "=== Round 2: Lead Synthesis (Model: $LEAD_MODEL) ==="

council-review.py synthesize \
  --model "$LEAD_MODEL" \
  --round1-responses /tmp/council-round1-aggregate.json \
  --output /tmp/council-responses/round2-synthesis.json

# Lead poses clarifying questions
QUESTIONS=$(jq -r '.questions[]' /tmp/council-responses/round2-synthesis.json)

echo "Lead identified the following questions:"
echo "$QUESTIONS"
```

### 7. Round 3 — Deliberation

Lead facilitates discussion of disagreements:

```bash
echo "=== Round 3: Deliberation ==="

mkdir -p /tmp/council-responses/round3

# Lead's questions distributed to all models
for i in "${!MODELS[@]}"; do
  model="${MODELS[$i]}"
  echo "Model $((i+1)) ($model) responding to deliberation..."
  
  council-review.py deliberate \
    --model "$model" \
    --synthesis /tmp/council-responses/round2-synthesis.json \
    --round1-response /tmp/council-responses/round1/model-$i.json \
    --output /tmp/council-responses/round3/model-$i.json &
  
  PIDS[$i]=$!
done

# Wait for deliberation round
for pid in "${PIDS[@]}"; do
  wait $pid
done

echo "Round 3 complete"

# Aggregate Round 3 responses
jq -s '.' /tmp/council-responses/round3/*.json > /tmp/council-round3-aggregate.json
```

### 8. Round 4 — Final Consensus

Model 3 (or rotated model) synthesizes final positions:

```bash
echo "=== Round 4: Final Consensus ==="

CONSENSUS_MODEL="${MODELS[2]}"  # Model 3 leads final consensus

council-review.py consensus \
  --model "$CONSENSUS_MODEL" \
  --round1 /tmp/council-round1-aggregate.json \
  --round3 /tmp/council-round3-aggregate.json \
  --output /tmp/council-responses/round4-consensus.json

# Extract consensus areas and divergence
CONSENSUS_AREAS=$(jq -r '.consensus[]' /tmp/council-responses/round4-consensus.json)
DIVERGENCE_AREAS=$(jq -r '.divergence[]' /tmp/council-responses/round4-consensus.json)

echo "=== Consensus Areas ==="
echo "$CONSENSUS_AREAS"

echo "=== Divergence Areas ==="
echo "$DIVERGENCE_AREAS"
```

### 9. Round 5 — Final Synthesis (Council Agent)

Council agent (Model 4 or facilitator) reviews all rounds and produces final recommendation:

```bash
echo "=== Round 5: Final Synthesis ==="

council-review.py finalize \
  --model "${MODELS[3]}" \
  --all-rounds /tmp/council-responses/ \
  --gate-evidence "$(swamp data query 'tags.gate!=null && tags.branch=="'$BRANCH'"' --format json)" \
  --output /tmp/council-final.json

# Extract final recommendation
VERDICT=$(jq -r '.recommendation.action' /tmp/council-final.json)
CONFIDENCE=$(jq -r '.recommendation.confidence' /tmp/council-final.json)
FINAL_SCORE=$(jq -r '.recommendation.finalScore' /tmp/council-final.json)

echo "Final Verdict: $VERDICT"
echo "Confidence: $CONFIDENCE"
echo "Score: $FINAL_SCORE"

# Check confidence threshold
if (( $(echo "$CONFIDENCE < 0.70" | bc -l) )); then
  echo "WARNING: Low confidence ($CONFIDENCE < 0.70) - escalating to human review"
  HUMAN_ESCALATION=true
else
  HUMAN_ESCALATION=false
fi
```

### 10. Stop Playwright Instrumentation

Capture and save all traces:

```bash
# Stop tracing
playwright tracing-stop \
  --output /tmp/council-traces/trace-$(date +%Y%m%d-%H%M%S).zip

# Stop video recording
playwright video-stop \
  --output /tmp/council-videos/

# Stop console/network capture
playwright console stop
playwright network stop

echo "Playwright instrumentation saved"
```

### 11. Upload Traces as Artifacts

Upload all traces and recordings to Swamp and GitHub:

```bash
# Upload to GitHub Actions artifacts (if in CI)
fj-ex actions artifacts upload \
  --source /tmp/council-traces/ \
  --name "gate-g-council-traces-$BRANCH" \
  --tags "gate-g,council,traces"

fj-ex actions artifacts upload \
  --source /tmp/council-videos/ \
  --name "gate-g-council-videos-$BRANCH" \
  --tags "gate-g,council,videos"

# Also store in Swamp
# swamp data insert doesn't exist — evidence written to gate-evidence/ JSON files

# swamp data insert doesn't exist — evidence written to gate-evidence/ JSON files
```

### 12. Record Evidence to Swamp

```bash
GATE_G_RESULT=$(cat /tmp/council-final.json)

# Evidence: write JSON to gate-evidence/ (swamp data query reads via CEL predicate)
cp /tmp/gate-result.json gate-evidence/gate-$(date +%s).json

# Store full deliberation transcript
# Evidence: write JSON to gate-evidence/ (swamp data query reads via CEL predicate)
cp /tmp/gate-result.json gate-evidence/gate-$(date +%s).json
```

### 13. Update Pipeline State

```bash
jq --slurpfile result /tmp/council-final.json \
  --arg human "$HUMAN_ESCALATION" \
  '.gateResults["gate-g"] = $result[0] | 
   .gateResults["gate-g"].humanEscalation = ($human == "true") |
   .completedPhases += ["gate-g"] |
   .artifacts.councilTraces = "/tmp/council-traces" |
   .artifacts.councilVideos = "/tmp/council-videos"' \
  .sdlc/pipeline-state.json > /tmp/state.json

mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

**Primary Location:** Swamp database with labels `["gate-g", "council"]`

**Query to retrieve:**
```bash
swamp data query 'tags.gate=="gate-g" && tags.branch=="[branch-name]"' --format json
```

**Report Structure:**
```json
{
  "councilMembers": [
    "github-copilot/claude-opus-4-7",
    "openai-codex/gpt-5.4",
    "opencode-go/glm-5.1",
    "openrouter/openrouter/free"
  ],
  "leadModel": "openai-codex/gpt-5.4",
  "rounds": [
    {
      "round": 1,
      "type": "independent-assessment",
      "responses": [...]
    },
    ...
  ],
  "synthesis": {
    "consensusAreas": ["Implementation is correct", "Tests are comprehensive"],
    "divergenceAreas": ["Performance optimization approach"],
    "keyFindings": ["All models agree on correctness", "Split on optimization strategy"]
  },
  "recommendation": {
    "action": "APPROVE",
    "confidence": 0.85,
    "finalScore": 88,
    "rationale": "Strong consensus on correctness and quality...",
    "conditions": []
  },
  "evidenceSummary": {
    "gateA": "pass",
    "gateB": "pass",
    "gateC": "pass",
    "gateD": "pass",
    "gateE": "pass",
    "gateF": "pass"
  }
}
```

**Artifact Locations:**
- Traces: `/tmp/council-traces/*.zip`
- Videos: `/tmp/council-videos/*.webm`
- Console logs: `/tmp/council-console.log`
- Network HAR: `/tmp/council-network.har`
- Swamp storage: Query with tags `["gate-g", "council"]`

## Failure Handling

### Below Threshold (Skip)

```bash
# Deterministic skip - not a failure
echo "Gate G SKIP: Change is below council threshold"

jq '.gateResults["gate-g"] = {
  "verdict": "SKIP",
  "reason": "below_threshold",
  "timestamp": "'$(date -Iseconds)'"
}' .sdlc/pipeline-state.json > /tmp/state.json

exit 0  # Success - skip is valid outcome
```

### Low Confidence (<0.70)

```bash
echo "WARNING: Council confidence below 0.70 - escalating to human"

jq '.gateResults["gate-g"].humanEscalation = true |
    .gateResults["gate-g"].escalationReason = "low_confidence"' \
  .sdlc/pipeline-state.json > /tmp/state.json

# Notify human (via Swamp notification or email)
# swamp notify doesn't exist — use swamp workflow run <notification-workflow> if needed

# Gate PAUSES, not FAILS
exit 2  # Special exit code for "needs human review"
```

### Council Recommends REQUEST_CHANGES

```bash
if [ "$VERDICT" = "REQUEST_CHANGES" ]; then
  echo "Council recommends changes"
  
  # Extract conditions
  CONDITIONS=$(jq -r '.recommendation.conditions[]' /tmp/council-final.json)
  
  echo "Required changes:"
  echo "$CONDITIONS"
  
  # Trigger fix cycle (if within retry limit)
  RETRY_COUNT=$(jq -r '.reviseCycles["gate-g"] // 0' .sdlc/pipeline-state.json)
  
  if [ $RETRY_COUNT -lt 3 ]; then
    # Spawn fix agent with conditions
    claude-code "Address council feedback: $CONDITIONS"
    
    # Increment and re-run
    jq '.reviseCycles["gate-g"] = ((.reviseCycles["gate-g"] // 0) + 1)' \
      .sdlc/pipeline-state.json > /tmp/state.json
    mv /tmp/state.json .sdlc/pipeline-state.json
  else
    echo "ERROR: Max revise cycles exceeded"
    exit 1
  fi
fi
```

### Council Recommends ESCALATE

```bash
if [ "$VERDICT" = "ESCALATE" ]; then
  echo "Council recommends escalation to human review"
  
  # Force human escalation
  jq '.gateResults["gate-g"].humanEscalation = true |
      .gateResults["gate-g"].escalationReason = "council_escalate"' \
    .sdlc/pipeline-state.json > /tmp/state.json
  
  exit 2  # Needs human review
fi
```

### Model Unavailable

```bash
# If a council model is unavailable, replace with fallback
if [ $? -ne 0 ]; then
  echo "WARNING: Model ${MODELS[$i]} unavailable, using fallback"
  
  # Use a fallback model (e.g., sonnet)
  MODELS[$i]="github-copilot/claude-sonnet-4.6"
  
  # Document substitution
  jq --arg idx "$i" --arg model "${MODELS[$i]}" \
    '.gateResults["gate-g"].modelSubstitutions[$idx] = $model' \
    .sdlc/pipeline-state.json > /tmp/state.json
fi
```

### Playwright Unavailable

```bash
# Council can still run without Playwright instrumentation
echo "WARNING: Playwright unavailable, proceeding without instrumentation"

# Set flag in evidence
jq '.gateResults["gate-g"].playwrightInstrumented = false' \
  .sdlc/pipeline-state.json > /tmp/state.json
```

## Success Criteria

- Threshold criteria evaluated (deterministic)
- If below threshold: SKIP with documented reason (success)
- If above threshold:
  - All 4 council models participate
  - 5 deliberation rounds complete
  - Confidence level ≥ 0.70 (or escalate to human)
  - Final recommendation is APPROVE (or REQUEST_CHANGES with fixes)
  - Playwright traces captured (if available)
  - All evidence recorded to Swamp with labels `["gate-g", "council"]`
  - Pipeline state updated with verdict
  - Traces uploaded to GitHub Actions artifacts
