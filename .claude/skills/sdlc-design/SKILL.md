---
name: sdlc-design
description: DESIGN phase — SoulForge architect mode, Swamp model discovery, Decapod decisions, impact prediction
triggers: [design, architecture, soulforge, swamp-model, decapod-decide, impact-predict]
---

# DESIGN Phase

Architecture design using SoulForge in architect mode, Swamp for model type discovery and secret management, and Decapod for decision tracking and impact prediction. This phase produces the design document that Gate A validates against.

## When to Use

- After SPEC phase produces an RPI plan
- Before IMPLEMENT phase begins coding
- When architectural decisions need formal recording
- When external system integration requires Swamp model types

## Prerequisites

- RPI plan from SPEC phase (`.rpi/plans/`)
- SoulForge CLI available (if `soulforge: true` in config)
- Swamp CLI available (if `swamp: true` in config)
- Decapod CLI available (if `decapod: true` in config)
- Feature branch checked out

## Steps

### 1. SoulForge Architect Session (Core Design)

Launch SoulForge in architect mode with the full repo map. Save the session for reuse at Gates A and E:

```bash
# Phase 1: Zero-LLM blast radius analysis
soulforge --headless --mode architect \
  --max-steps 8 \
  --save-session \
  --cwd $(pwd) \
  --include "$(git diff main...HEAD --name-only)" \
  > /tmp/soulforge-design.txt

# Extract session ID for Gate A/E reuse
SESSION_ID=$(grep "Session ID" /tmp/soulforge-design.txt | awk '{print $3}')
echo $SESSION_ID > .sdlc/soulforge-session-id
```

**SoulForge commands to invoke within the session:**
- `soul_impact <changed-files>` — blast radius analysis
- `soul_analyze` — duplication and dependency analysis
- `soul_find <pattern>` — locate existing code patterns to reuse

**If SoulForge is unavailable:** Document architecture manually in `.rpi/designs/`. Include component diagram, data flow, and API contracts. Note that Gate A will operate in degraded mode.

### 2. Swamp Model Type Discovery

Search for existing model types that match the design requirements:

```bash
# Search for relevant model types
swamp model type search --keywords "authentication,payment,notification" > /tmp/swamp-models.json

# Check if extensions need to be built
MATCHING=$(jq '.results | length' /tmp/swamp-models.json)
if [ "$MATCHING" -eq 0 ]; then
  echo "No existing Swamp model types. Building new extension."
  # Design the model type before implementation (Swamp rule)
  # Design extension model: swamp model create <type> <name>  (then edit with: swamp model edit)
fi
```

### 3. Swamp Extension Pull/Build

```bash
# Pull existing extensions
cat /tmp/swamp-models.json | jq -r '.results[].extensionId' | while read ext; do
  swamp extension pull "$ext"
done

# Build new extensions if needed
if [ -f .swamp/model-design.json ]; then
  # Build extension: swamp extension push <manifest-path>  (after authoring)
  # Generate driver: swamp extension pull <extension-name>  (pull from registry)
fi
```

**If Swamp is unavailable:** Skip model type discovery. Note in design document that Swamp integration is deferred.

### 4. Secret Management (Swamp Vault)

```bash
# Check for required secrets
swamp vault list --format json > /tmp/vault-inventory.json

# Retrieve secrets needed for the design
swamp vault get api-keys --format json > /tmp/secrets.json

# Verify secrets are not in code
grep -r "api_key\|secret\|password\|token" src/ && echo "ERROR: secrets in source" || echo "OK: no secrets in source"
```

### 5. Decapod Preflight and Impact Prediction

```bash
# Preflight check: validates plan against governance rules
decapod preflight --plan .rpi/plans/*.md --output json > /tmp/preflight.json

# Impact prediction: assesses blast radius of proposed changes
decapod impact predict --files "$(git diff main...HEAD --name-only | tr '\n' ',')" > /tmp/impact.json

# Review results
PREFLIGHT_STATUS=$(jq -r '.status' /tmp/preflight.json)
if [ "$PREFLIGHT_STATUS" = "BLOCKED" ]; then
  echo "ERROR: Decapod preflight blocked. Review governance rules."
  jq -r '.blockers[]' /tmp/preflight.json
  exit 1
fi
```

### 6. Architecture Decision Records (Decapod Decide)

Record each significant architectural decision:

```bash
# Example: Authentication decision
decapod decide \
  --decision "Use JWT for authentication" \
  --rationale "Stateless, scalable, industry standard, compatible with existing API gateway" \
  --alternatives "Session cookies (server-bound), OAuth2 (complex setup), API keys (no user context)" \
  --context "From SPEC phase: requirement for stateless horizontal scaling"

# Example: Data storage decision
decapod decide \
  --decision "Use PostgreSQL with JSONB columns" \
  --rationale "Structured + semi-structured data, GIN indexes, existing team expertise" \
  --alternatives "MongoDB (document store), SQLite (single-server), DynamoDB (AWS-only)"
```

**If Decapod is unavailable:** Record decisions in `.rpi/designs/decisions.md` using ADR format (Context, Decision, Consequences, Alternatives).

### 7. Produce Design Document

Synthesize all outputs into the design document:

```bash
cat > .rpi/designs/$(date +%Y-%m-%d)-$(git branch --show-current | sed 's/feat\///').md <<EOF
# Design: [Feature Name]

## SoulForge Session
- Session ID: $(cat .sdlc/soulforge-session-id)
- Blast radius: $(jq -r '.blast_radius' /tmp/soulforge-design.txt 2>/dev/null || echo "N/A")

## Architecture Decisions
$(decapod decide --list --format markdown 2>/dev/null || cat .rpi/designs/decisions.md 2>/dev/null || echo "No decisions recorded")

## Swamp Model Types
$(jq -r '.results[] | "- \(.name): \(.description)"' /tmp/swamp-models.json 2>/dev/null || echo "No Swamp model types")

## Impact Assessment
$(jq '.' /tmp/impact.json 2>/dev/null || echo "No impact prediction")

## Component Diagram
[Describe or link to diagram]

## API Contracts
[Define interfaces between components]

## Data Flow
[Describe data transformation pipeline]
EOF
```

### 8. Update Pipeline State

```bash
jq --arg session "$(cat .sdlc/soulforge-session-id 2>/dev/null || echo 'none')" \
   '.currentPhase = "design" |
    .completedPhases += ["design"] |
    .soulForgeSessionId = $session' \
   .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

| Artifact | Location | Purpose |
|----------|----------|---------|
| SoulForge session | `.sdlc/soulforge-session-id` | Reused at Gates A and E |
| Swamp model types | `/tmp/swamp-models.json` | Gate C behavioral verification |
| Impact prediction | `/tmp/impact.json` | Gate A architecture validation |
| Decapod decisions | (Decapod internal) | Gate E governance check |
| Design document | `.rpi/designs/<date>-<topic>.md` | Canonical design reference |
| Preflight results | `/tmp/preflight.json` | Gate A pre-condition |

## Failure Handling

| Failure | Action |
|---------|--------|
| SoulForge unavailable | Manual design in `.rpi/designs/`, note degraded Gate A |
| Swamp unavailable | Skip model discovery, defer to implementation |
| Decapod preflight BLOCKED | Stop pipeline, review governance blockers |
| Decapod decide unavailable | Record ADRs in markdown |
| No matching Swamp models | Design and build new extension (per Swamp rule) |
| SoulForge session fails | Retry once, then proceed with manual design |

## Success Criteria

- [ ] SoulForge architect session completed with saved session ID
- [ ] Swamp model types identified (or new extension designed)
- [ ] Secrets verified not in source code
- [ ] Decapod preflight passed (not BLOCKED)
- [ ] Impact prediction completed
- [ ] Architecture decisions recorded (Decapod or ADR markdown)
- [ ] Design document produced with component diagram, API contracts, data flow
- [ ] Pipeline state updated