---
name: sdlc-gate-structural
description: Gate B - Structural verification with tests, lint, and build
triggers: [gate-b, gate-structural, structural-tests]
---

# Gate B: Structural Verification

Automated structural quality check ensuring tests pass, lint passes, and build succeeds.

## When to use

Run after Gate A to validate code structure, tests, and buildability.

## Prerequisites

- Gate A passed
- Test suite configured
- Build toolchain detected

## Steps

### 1. Run sdlc-gate.py Verification

```bash
python3 sdlc-gate.py verify $(pwd) $(git rev-parse --abbrev-ref HEAD) > /tmp/gate-verify.json
TESTS_PASSED=$(jq -r '.tests.passed' /tmp/gate-verify.json)
LINT_PASSED=$(jq -r '.lint.passed' /tmp/gate-verify.json)
BUILD_PASSED=$(jq -r '.build.passed' /tmp/gate-verify.json)
```

### 2. Decapod Validate (MANDATORY)

```bash
decapod validate --cwd $(pwd) --output json > /tmp/decapod-validate.json
VALIDATION_SCORE=$(jq -r '.score' /tmp/decapod-validate.json)
```

### 3. Decapod Gate Evaluation

```bash
decapod eval gate --aggregate-id $(git rev-parse --abbrev-ref HEAD) --gate-id gate-b > /tmp/decapod-gate-eval.json
```

### 4. SoulForge Project Auto-Detect

```bash
SF=/home/node/.openclaw/devbox-env/node_modules/@proxysoul/soulforge/dist/bin.sh
$SF --headless --json "describe project structure and technology stack" --no-repomap --cwd $(pwd) > /tmp/soulforge-project.json
TOOLCHAIN=$(jq -r '.toolchain' /tmp/soulforge-project.json)
ECOSYSTEM=$(jq -r '.ecosystem' /tmp/soulforge-project.json)
```

### 5. Playwright Zombie Prevention

```bash
playwright close-all
```

### 5a. Decapod QA (Additional Quality Checks)

```bash
# Run Decapod's built-in quality assurance checks
decapod qa --cwd $(pwd) --output json > /tmp/decapod-qa.json
QA_ISSUES=$(jq -r '.issues | length' /tmp/decapod-qa.json)
echo "Decapod QA issues: $QA_ISSUES"
```

### 5b. SoulForge Unused Code Detection

```bash
# Detect dead code introduced by the change
soulforge --headless --diff "$(git diff main...HEAD)" soul_find --pattern "unused" --cwd $(pwd) > /tmp/soul-unused.json
UNUSED=$(jq -r '.results | length' /tmp/soul-unused.json)
if [ "$UNUSED" -gt 0 ]; then
  echo "⚠️  $UNUSED unused code patterns detected"
fi
```

### 6. Generate Verdict

```bash
python3 << 'PYSCRIPT'
import json

tests = json.load(open('/tmp/gate-verify.json'))['tests']['passed']
lint = json.load(open('/tmp/gate-verify.json'))['lint']['passed']
build = json.load(open('/tmp/gate-verify.json'))['build']['passed']
validation = json.load(open('/tmp/decapod-validate.json'))['score']

# All must pass for PASS verdict
if tests and lint and build and validation >= 80:
    verdict = "PASS"
    score = 100
    notes = []
elif validation >= 60:
    verdict = "REVISE"
    score = 70
    notes = []
    if not tests:
        notes.append("Fix failing tests")
    if not lint:
        notes.append("Fix linting errors")
    if not build:
        notes.append("Fix build failures")
else:
    verdict = "FAIL"
    score = 40
    notes = ["Critical structural issues"]

result = {
    'verdict': verdict,
    'score': score,
    'checks': {
        'tests': tests,
        'lint': lint,
        'build': build,
        'validation': validation
    },
    'toolchain': json.load(open('/tmp/soulforge-project.json'))['toolchain'],
    'revisionNotes': notes
}

with open('/tmp/gate-b-result.json', 'w') as f:
    json.dump(result, f)
print(json.dumps(result, indent=2))
PYSCRIPT
```

### 7. Record Evidence in Swamp

```bash
# Write evidence to gate-evidence/ (swamp data query can read via workflow)
cp /tmp/gate-b-result.json gate-evidence/$(echo '["gate-b","structural"]' | tr -d '[]\"' | tr ',' '-')-$(date +%s).json
```

### 8. Update Pipeline State

```bash
jq --slurpfile result /tmp/gate-b-result.json '.gateResults["gate-b"] = $result[0]' .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

**Swamp Report:** Labels `["gate-b", "structural"]`

**Format:**
```json
{
  "verdict": "PASS|REVISE|FAIL",
  "score": 100,
  "checks": {
    "tests": true,
    "lint": true,
    "build": true,
    "validation": 85
  },
  "toolchain": "npm",
  "revisionNotes": []
}
```

## Failure Handling

- Tests fail: Extract failure details, trigger fix cycle
- Lint fail: Apply auto-fixes if available, else trigger manual fix
- Build fail: Analyze build logs, trigger dependency/config fix
- Decapod validate unavailable: Use tests/lint/build only

## Success Criteria

- All checks pass (tests, lint, build)
- Decapod validation score >= 80
- Playwright zombies cleaned up
- Evidence recorded in Swamp
