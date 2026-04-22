---
name: sdlc-gate-ci
description: Gate F — CI pipeline verification with full fj-ex smoke-test, auto-retry, model escalation, and artifact collection
triggers: [gate-f, gate-ci, ci, continuous-integration, fj-ex]
---

# Gate F: CI Pipeline

CI verification using the full fj-ex smoke-test: smoke test, run monitoring, job queue visibility, log capture, artifact download, and auto-retry with model escalation. This gate proves the code works in a real CI environment.

## When to Use

- After Gate E passes (or is skipped) for HIGH or MAXIMUM classification
- Any change that needs CI validation before merge
- Always runs before merge to main

## Prerequisites

- Gate E passed or skipped
- Classification level HIGH or MAXIMUM (MEDIUM and LOW skip unless forced)
- fj-ex CLI available and authenticated
- Git remote configured and accessible

## Classification Threshold

```bash
GATE_LEVEL=$(jq -r '.classification.gateLevel' .sdlc/pipeline-state.json)

if [ "$GATE_LEVEL" = "LOW" ] || [ "$GATE_LEVEL" = "MEDIUM" ]; then
  echo "Gate F: SKIPPED ($GATE_LEVEL classification)"
  jq '.gateResults["gate-f"] = {"verdict": "SKIP", "reason": "'"$GATE_LEVEL"' classification"}' \
    .sdlc/pipeline-state.json > /tmp/state.json
  mv /tmp/state.json .sdlc/pipeline-state.json
  exit 0
fi
```

## Steps

### 1. Pre-Push Smoke Test

Validate configuration before pushing to avoid wasting CI resources:

```bash
# Quick validation that CI workflows are defined
fj-ex actions smoke-test --local > /tmp/smoke-test.json

SMOKE_RESULT=$(jq -r '.status' /tmp/smoke-test.json)
if [ "$SMOKE_RESULT" != "passed" ]; then
  echo "❌ Smoke test failed. Fix before pushing."
  jq -r '.errors[]' /tmp/smoke-test.json
  # Don't exit — might be configuration issues that CI will catch differently
  # But warn loudly
  echo "⚠️  Proceeding with push despite smoke test failure"
fi
```

### 2. Push to Remote

```bash
BRANCH=$(git branch --show-current)
git push -u origin "$BRANCH"

# If push fails (e.g., rebase needed), handle it
if [ $? -ne 0 ]; then
  echo "Push failed. Attempting pull-rebase..."
  git pull --rebase origin main
  git push -u origin "$BRANCH"
fi
```

### 3. Detect Triggered CI Run

```bash
# Wait a moment for CI to start
sleep 5

# Find the running workflow
fj-ex actions runs --branch "$BRANCH" --status in_progress > /tmp/ci-runs.json

# If no runs found, check for queued runs
RUN_COUNT=$(jq '.runs | length' /tmp/ci-runs.json 2>/dev/null || echo "0")
if [ "$RUN_COUNT" -eq 0 ]; then
  echo "No runs in progress. Checking queue..."
  fj-ex actions runs --branch "$BRANCH" > /tmp/ci-runs.json
  RUN_COUNT=$(jq '.runs | length' /tmp/ci-runs.json 2>/dev/null || echo "0")
fi

if [ "$RUN_COUNT" -eq 0 ]; then
  echo "⚠️  No CI runs detected. Check workflow configuration."
  # Record as warning, not failure — some projects have manual triggers
  jq '.gateResults["gate-f"] = {"verdict": "SKIP", "reason": "No CI workflows detected"}' \
    .sdlc/pipeline-state.json > /tmp/state.json
  mv /tmp/state.json .sdlc/pipeline-state.json
  exit 0
fi

RUN_ID=$(jq -r '.runs[0].id' /tmp/ci-runs.json)
echo "CI Run ID: $RUN_ID"
```

### 4. Check Runner Queue Visibility

```bash
# Check runner availability and queue depth
fj-ex actions runners > /tmp/runners.json

ONLINE_RUNNERS=$(jq '[.[] | select(.status == "online")] | length' /tmp/runners.json)
QUEUED_JOBS=$(jq '[.[] | select(.status == "queued")] | length' /tmp/runners.json)

echo "Online runners: $ONLINE_RUNNERS"
echo "Queued jobs: $QUEUED_JOBS"

if [ "$ONLINE_RUNNERS" -eq 0 ]; then
  echo "⚠️  No online runners. CI will queue indefinitely."
fi
```

### 5. Monitor CI Execution

```bash
# Wait for CI with details
MAX_WAIT=1800  # 30 minutes
ELAPSED=0
INTERVAL=30

while [ $ELAPSED -lt $MAX_WAIT ]; do
  fj-ex actions jobs --waiting --run-id "$RUN_ID" > /tmp/jobs-status.json

  STATUS=$(jq -r '.status' /tmp/jobs-status.json 2>/dev/null)
  echo "[$((ELAPSED/60))m] CI status: $STATUS"

  case "$STATUS" in
    completed|success)
      echo "✅ CI completed successfully"
      break
      ;;
    failure|failed)
      echo "❌ CI failed"
      break
      ;;
    *)
      sleep $INTERVAL
      ELAPSED=$((ELAPSED + INTERVAL))
      ;;
  esac
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo "⚠️  CI timed out after $((MAX_WAIT/60)) minutes"
  STATUS="timeout"
fi
```

### 6. Fetch Logs and Artifacts

```bash
# Get full CI logs regardless of outcome
fj-ex actions logs "$RUN_ID" --output /tmp/ci-logs.txt

# Download all artifacts (test results, coverage, screenshots)
fj-ex actions artifacts download "$RUN_ID" --output-dir /tmp/ci-artifacts/

# Summary
echo "CI Logs: $(wc -l < /tmp/ci-logs.txt) lines"
echo "Artifacts: $(ls /tmp/ci-artifacts/ | wc -l) files"
```

### 7. Auto-Retry with Model Escalation

If CI fails, fix and retry with escalating model quality:

```bash
RETRY_COUNT=0
MAX_RETRIES=$(jq -r '.gates.ci.autoRetry // 3' .sdlc/config.json)

while [ "$STATUS" = "failed" ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "🔄 Retry attempt $RETRY_COUNT/$MAX_RETRIES"

  # Model escalation: sonnet → sonnet → opus
  if [ $RETRY_COUNT -le 2 ]; then
    FIX_MODEL=$(jq -r '.cook.perStepModels.work' .sdlc/config.json)
  else
    FIX_MODEL=$(jq -r '.models.worker' .sdlc/config.json)
  fi

  echo "   Using model: $FIX_MODEL"

  # Spawn fix agent with CI logs
  claude-code --agent worker \
    --mode fix \
    --ci-logs /tmp/ci-logs.txt \
    --model "$FIX_MODEL" \
    --branch "$BRANCH"

  # Push fix
  git push -f origin "$BRANCH"

  # Re-monitor (steps 3-6)
  # ... (repeat monitoring loop)
done

if [ "$STATUS" = "failed" ]; then
  echo "❌ CI failed after $MAX_RETRIES retries"
fi
```

### 8. Record Evidence

```bash
CONCLUSION=$(jq -r '.conclusion // .status' /tmp/jobs-status.json)

# Swamp report
# Evidence: write JSON to gate-evidence/ (swamp data query reads via CEL predicate)
cp /tmp/gate-result.json gate-evidence/gate-$(date +%s).json
    '{run_id: $run_id, conclusion: $conclusion, retry_count: ($retries | tonumber), artifacts_downloaded: true}')" \
  2>/dev/null || echo '{"gate":"f","run_id":"'"$RUN_ID"'","conclusion":"'"$CONCLUSION"'","retries":"'"$RETRY_COUNT"'"}' > gate-evidence/gate-f.json

# Update pipeline state
jq --arg verdict "$( [ "$CONCLUSION" = "success" ] && echo PASS || echo FAIL )" \
   --arg run "$RUN_ID" \
   --arg retries "$RETRY_COUNT" \
   '.gateResults["gate-f"] = {"verdict": $verdict, "run_id": $run, "retries": ($retries | tonumber)} | .completedPhases += ["gate-f"]' \
   .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

| Artifact | Location | Labels |
|----------|----------|--------|
| Smoke test | `/tmp/smoke-test.json` | `["gate-f", "smoke"]` |
| CI logs | `/tmp/ci-logs.txt` | `["gate-f", "ci-logs"]` |
| CI artifacts | `/tmp/ci-artifacts/` | `["gate-f", "ci-artifacts"]` |
| Run metadata | `/tmp/ci-runs.json` | `["gate-f", "run-metadata"]` |
| Runner status | `/tmp/runners.json` | `["gate-f", "runners"]` |
| Swamp report | (Swamp backend) | `["gate-f", "ci"]` |

## Failure Handling

| Condition | Action |
|-----------|--------|
| LOW/MEDIUM classification | SKIP |
| Smoke test fails | Warn, proceed (CI may handle differently) |
| Push fails | Pull-rebase, retry push |
| No CI workflows | SKIP with warning |
| CI timeout (30min) | FAIL |
| CI failure, retries < 3 | Fix with model escalation, retry |
| CI failure, retries = 3 | FAIL, escalate to human |
| No online runners | Warn, queue until available |

## Success Criteria

- [ ] Smoke test passed (or warning documented)
- [ ] Branch pushed to remote
- [ ] CI run detected and monitored to completion
- [ ] CI run concluded successfully (or all retries exhausted)
- [ ] Full logs captured
- [ ] All artifacts downloaded
- [ ] Runner queue visibility checked
- [ ] Swamp evidence written with gate-f labels
- [ ] Pipeline state updated