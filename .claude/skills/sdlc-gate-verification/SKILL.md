---
name: sdlc-gate-verification
description: Gate E — L4/L5 verification integrity, SoulForge challenge mode, security audit personas
triggers: [gate-e, gate-verification, verification, security-review, challenge-mode]
---

# Gate E: Verification and Security

Deep verification layer combining Copilot LLM integrity checks, SoulForge adversarial challenge mode, and security keyword detection. This gate catches what structural and behavioral gates miss: architectural drift, security vulnerabilities, and pipeline integrity issues.

## When to Use

- After Gate D (Judge) passes for MEDIUM, HIGH, or MAXIMUM classification levels
- Always runs for changes touching auth, crypto, secrets, permissions, or payment flows
- Security keyword detection automatically escalates classification to at least HIGH

## Prerequisites

- Gate D passed
- Classification level MEDIUM or higher (LOW skips this gate)
- Copilot LLM script available (`scripts/copilot_llm.py`)
- SoulForge CLI available (if `soulforge: true` in config)
- Decapod CLI available (if `decapod: true` in config)
- SoulForge session ID from DESIGN phase (`.sdlc/soulforge-session-id`)

## Classification Threshold

```bash
GATE_LEVEL=$(jq -r '.classification.gateLevel' .sdlc/pipeline-state.json)

# LOW classification: SKIP
if [ "$GATE_LEVEL" = "LOW" ]; then
  echo "Gate E: SKIPPED (LOW classification)"
  jq '.gateResults["gate-e"] = {"verdict": "SKIP", "reason": "LOW classification"}' \
    .sdlc/pipeline-state.json > /tmp/state.json
  mv /tmp/state.json .sdlc/pipeline-state.json
  exit 0
fi
```

## Steps

### 1. L4 Verification Integrity Check

Run the Copilot LLM L4 layer to verify that the implementation actually matches what was specified:

```bash
# Find the spec plan for comparison
SPEC_PLAN=$(jq -r '.specPlan' .sdlc/pipeline-state.json)
DIFF=$(git diff main...HEAD)

python3 scripts/copilot_llm.py \
  --level L4 \
  --spec "$SPEC_PLAN" \
  --diff "$DIFF" \
  > /tmp/verification-l4.json

L4_SCORE=$(jq -r '.score' /tmp/verification-l4.json)
L4_ISSUES=$(jq -r '.issues | length' /tmp/verification-l4.json)
echo "L4 Score: $L4_SCORE, Issues: $L4_ISSUES"
```

**L4 checks:**
- Spec-to-implementation alignment: did we build what we said we'd build?
- Feature completeness: all acceptance criteria addressed
- Edge case coverage: error paths, boundary conditions, empty states
- Interface consistency: API contracts match between components

### 2. L5 Pipeline Integrity Check

Run the Copilot LLM L5 layer to verify the pipeline itself worked correctly:

```bash
python3 scripts/copilot_llm.py \
  --level L5 \
  --pipeline-state .sdlc/pipeline-state.json \
  --gate-evidence gate-evidence/ \
  > /tmp/verification-l5.json

L5_SCORE=$(jq -r '.score' /tmp/verification-l5.json)
echo "L5 Score: $L5_SCORE"
```

**L5 checks:**
- Gate execution order: did gates run in sequence?
- Evidence completeness: does each gate have its Swamp report?
- Score progression: are gate scores improving or regressing?
- Pipeline health: no stale state, no skipped gates without justification

### 3. SoulForge Challenge Mode (Adversarial Review)

Use the saved session from the DESIGN phase for continuity. Challenge mode thinks like an attacker:

```bash
SESSION_ID=$(cat .sdlc/soulforge-session-id 2>/dev/null)

if [ -n "$SESSION_ID" ]; then
  # Continue existing session in challenge mode
  soulforge --headless \
    --mode challenge \
    --session "$SESSION_ID" \
    --max-steps 12 \
    --diff "$(git diff main...HEAD)" \
    --output json \
    > /tmp/soulforge-challenge.json
else
  # Fresh challenge session
  soulforge --headless \
    --mode challenge \
    --max-steps 12 \
    --cwd $(pwd) \
    --include "$(git diff main...HEAD --name-only)" \
    --output json \
    > /tmp/soulforge-challenge.json
fi

CHALLENGE_SCORE=$(jq -r '.overall_score // .score // "N/A"' /tmp/soulforge-challenge.json)
CRITICAL_FINDINGS=$(jq -r '.findings[] | select(.severity == "Critical") | .description' /tmp/soulforge-challenge.json 2>/dev/null)
```

### 4. Security Keyword Detection

```bash
CHANGED_FILES=$(git diff main...HEAD --name-only)
SECURITY_KEYWORDS="auth|crypto|secret|password|token|key|cert|permission|encrypt|decrypt|hash|salt|session|cookie|jwt|oauth|rbac|acl"

SECURITY_FILES=$(echo "$CHANGED_FILES" | grep -iE "$SECURITY_KEYWORDS" || true)

if [ -n "$SECURITY_FILES" ]; then
  echo "⚠️  Security-relevant files detected:"
  echo "$SECURITY_FILES" | sed 's/^/   /'

  # Run with security auditor persona
  soulforge --headless \
    --mode challenge \
    --system "you are a security auditor. focus on OWASP top 10 vulnerabilities. check for: injection, broken auth, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialization, known-vulnerable components, insufficient logging." \
    --diff "$(git diff main...HEAD -- $SECURITY_FILES)" \
    --output json \
    > /tmp/soulforge-security.json

  SECURITY_CRITICAL=$(jq -r '.findings[] | select(.severity == "Critical") | .description' /tmp/soulforge-security.json 2>/dev/null)

  if [ -n "$SECURITY_CRITICAL" ]; then
    echo "🔴 CRITICAL security findings:"
    echo "$SECURITY_CRITICAL" | sed 's/^/   /'
    echo "Gate E: BLOCKED on Critical security findings"
    jq '.gateResults["gate-e"] = {"verdict": "FAIL", "reason": "Critical security findings", "findings": $sec}' \
      --argsec "$(echo "$SECURITY_CRITICAL" | tr '\n' ';')" \
      .sdlc/pipeline-state.json > /tmp/state.json
    mv /tmp/state.json .sdlc/pipeline-state.json
    exit 1
  fi
fi
```

### 5. Decapod Impact Prediction

```bash
if command -v decapod &>/dev/null && [ -d .decapod ]; then
  decapod impact predict --files "$(echo "$CHANGED_FILES" | tr '\n' ',')" > /tmp/decapod-impact.json

  IMPACT_LEVEL=$(jq -r '.impact_level // "low"' /tmp/decapod-impact.json)
  echo "Decapod impact prediction: $IMPACT_LEVEL"

  # Run governance health check
  decapod govern health --format json > /tmp/decapod-governance.json
  GOVERN_HEALTH=$(jq -r '.status' /tmp/decapod-governance.json)
  echo "Decapod governance health: $GOVERN_HEALTH"
fi
```

### 6. Compute Final Verdict

```bash
# Weighted scoring: L4 (30%) + L5 (20%) + Challenge (30%) + Security (20%)
L4_WEIGHT=0.30
L5_WEIGHT=0.20
CHALLENGE_WEIGHT=0.30
SECURITY_WEIGHT=0.20

# Handle missing scores gracefully
L4=${L4_SCORE:-75}
L5=${L5_SCORE:-75}
CHALLENGE=${CHALLENGE_SCORE:-75}
SECURITY=100  # 100 if no critical findings, 0 if critical (already blocked above)

FINAL_SCORE=$(echo "$L4 * $L4_WEIGHT + $L5 * $L5_WEIGHT + $CHALLENGE * $CHALLENGE_WEIGHT + $SECURITY * $SECURITY_WEIGHT" | bc)

VERDICT="PASS"
if (( $(echo "$FINAL_SCORE < 60" | bc -l) )); then
  VERDICT="FAIL"
elif (( $(echo "$FINAL_SCORE < 80" | bc -l) )); then
  VERDICT="REVISE"
fi

echo "Gate E Final Score: $FINAL_SCORE → $VERDICT"
```

### 7. Record Evidence

```bash
# Swamp report
# Evidence: write JSON to gate-evidence/ (swamp data query reads via CEL predicate)
cp /tmp/gate-result.json gate-evidence/gate-$(date +%s).json
    '{l4_score: $l4, l5_score: $l5, challenge_score: $challenge, verdict: $verdict, final_score: $final}')" \
  2>/dev/null || echo '{"gate":"e","l4_score":"'$L4_SCORE'","l5_score":"'$L5_SCORE'","challenge_score":"'$CHALLENGE_SCORE'","verdict":"'$VERDICT'","final_score":"'$FINAL_SCORE'"}' > gate-evidence/gate-e.json

# Update pipeline state
jq --arg verdict "$VERDICT" --arg score "$FINAL_SCORE" \
  '.gateResults["gate-e"] = {"verdict": $verdict, "score": ($score | tonumber)} | .completedPhases += ["gate-e"]' \
  .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

| Artifact | Location | Labels |
|----------|----------|--------|
| L4 verification | `/tmp/verification-l4.json` | `["gate-e", "l4"]` |
| L5 verification | `/tmp/verification-l5.json` | `["gate-e", "l5"]` |
| SoulForge challenge | `/tmp/soulforge-challenge.json` | `["gate-e", "challenge"]` |
| Security audit | `/tmp/soulforge-security.json` | `["gate-e", "security"]` |
| Decapod impact | `/tmp/decapod-impact.json` | `["gate-e", "impact"]` |
| Swamp report | (Swamp backend) | `["gate-e", "verification"]` |

## Failure Handling

| Condition | Action |
|-----------|--------|
| LOW classification | SKIP (document reason) |
| Any Critical security finding | BLOCK → FAIL immediately |
| Final score < 60 | FAIL with findings |
| Final score 60-79 | REVISE — spawn fix agent, re-run Gate E |
| SoulForge unavailable | Proceed with L4/L5 only, note degraded mode |
| L4 or L5 unavailable | Weight remaining scores proportionally |
| Max REVISE cycles exceeded (3) | FAIL, escalate to human |
| Decapod governance unhealthy | Warning only (non-blocking) |

## Success Criteria

- [ ] L4 verification integrity score recorded
- [ ] L5 pipeline integrity score recorded
- [ ] SoulForge challenge mode completed (or documented as unavailable)
- [ ] Security keyword scan performed — zero Critical findings
- [ ] Decapod impact prediction reviewed
- [ ] Weighted final score ≥ 80 for PASS
- [ ] Swamp evidence written with gate-e labels
- [ ] Pipeline state updated with verdict and score