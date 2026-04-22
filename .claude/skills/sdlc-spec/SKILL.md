---
name: sdlc-spec
description: SPEC phase — RPI research/propose/plan chain with Decapod scaffold and ByteRover pattern query
triggers: [spec, specification, requirements, rpi-research, rpi-propose, rpi-plan]
---

# SPEC Phase

Requirements specification using RPI methodology, ByteRover pattern retrieval, and Decapod structured reasoning. This is the *first* phase in the pipeline — everything downstream depends on its quality.

## When to Use

- Starting a new feature, bug fix, or refactoring
- Refining requirements from a vague issue or idea
- Creating the RPI plan that gates will validate against
- Any time `/rpi-research` or `/rpi-propose` would be invoked

## Prerequisites

- Git repository with a feature branch (`decapod workspace ensure` or `git checkout -b feat/...`)
- ByteRover installed and `brv` available (if `byterover: true` in config)
- Decapod installed and `.decapod/` initialized (if `decapod: true` in config)
- RPI installed (if `rpi: true` or `_rpi/` directory present)
- Working directory is project root

## Steps

### 1. Context Retrieval (ByteRover)

Query existing patterns before writing anything new. Avoid reinventing decisions already made:

```bash
# Query for relevant patterns based on task description
brv query "$(git log -1 --pretty=%B)" --limit 10 --format json > /tmp/brv-patterns.json

# Also query project-specific context
brv query "project architecture decisions" --limit 5 --format json >> /tmp/brv-patterns.json
```

**If ByteRover is unavailable:** Use `qmd query` as fallback, or proceed without pattern context. Do NOT block on this step.

### 2. Research Phase (RPI)

```bash
# Create research document with gathered context
claude-code /rpi-research "$(git log -1 --pretty=%B)"
```

The research output should include:
- Problem statement and scope
- Prior art (from ByteRover patterns and web search)
- Constraints and dependencies
- Open questions for clarification

**Output:** `.rpi/research/<date>-<topic>.md`

### 3. Intent Crystallization (Decapod Scaffold)

Use Decapod's scaffold operation to refine the research into structured questions:

```bash
decapod rpc --op scaffold.next_question \
  --input "$(cat .rpi/research/*.md)" \
  --format json > /tmp/questions.json

# Present questions to user or auto-answer from context
# Record answers in .rpi/research/answers.md
```

**If Decapod is unavailable:** Skip this step. Research document serves as the question source.

### 4. Proposal Phase (RPI)

```bash
claude-code /rpi-propose --research-file .rpi/research/*.md
```

The proposal should include:
- Proposed solution with alternatives considered
- Risk assessment (from Decapod impact prediction if available)
- Success criteria (measurable, testable)
- Affected files and blast radius

**Output:** `.rpi/proposals/<date>-<topic>.md`

### 5. Plan Phase (RPI)

```bash
claude-code /rpi-plan --proposal .rpi/proposals/*.md
```

The plan MUST include:
- Implementation phases with **checkboxes** (gates validate against these)
- Testing strategy (unit, integration, manual)
- Evidence requirements per gate
- Rollback plan

**Output:** `.rpi/plans/<date>-<topic>.md` — this is the canonical reference for all downstream phases and gates.

### 6. Decapod Ingestion (Immutable Spec Storage)

```bash
# Ingest plan into Decapod's LCM (lifecycle management)
decapod lcm ingest .rpi/plans/*.md --tags "sdlc,spec-phase,$(git branch --show-current)"

# Create context adapter for worker agents
decapod internalize create .rpi/plans/*.md --type plan
```

**If Decapod is unavailable:** Store plan in `.rpi/plans/` only. Include a README noting that LCM ingest should be run when Decapod becomes available.

### 7. Update Pipeline State

```bash
jq --arg plan "$(ls .rpi/plans/*.md | head -1)" \
   '.currentPhase = "spec" | 
    .completedPhases += ["spec"] | 
    .specPlan = $plan' \
   .sdlc/pipeline-state.json > /tmp/state.json
mv /tmp/state.json .sdlc/pipeline-state.json
```

## Evidence Output

| Artifact | Location | Format |
|----------|----------|--------|
| Research | `.rpi/research/<date>-<topic>.md` | Markdown |
| Proposal | `.rpi/proposals/<date>-<topic>.md` | Markdown |
| Plan | `.rpi/plans/<date>-<topic>.md` | Markdown with checkboxes |
| ByteRover patterns | `/tmp/brv-patterns.json` | JSON |
| Decapod LCM | (stored in Decapod) | Internal |
| Pipeline state | `.sdlc/pipeline-state.json` | JSON |

## Failure Handling

| Failure | Action |
|---------|--------|
| ByteRover unavailable | Skip pattern query, proceed with research |
| Decapod unavailable | Skip scaffold/LCM, store plan files only |
| RPI not initialized | Run `rpi init /path --target opencode` first |
| No branch exists | Run `decapod workspace ensure` or `git checkout -b feat/...` |
| Vague requirements | Use Decapod scaffold to generate clarifying questions |
| Research yields no patterns | Document as "no prior art found" and continue |

## Success Criteria

- [ ] ByteRover patterns retrieved (or documented as unavailable)
- [ ] Research document complete with problem statement, constraints, open questions
- [ ] Proposal with alternatives and success criteria
- [ ] Plan with actionable checkboxes (gates validate against these)
- [ ] Plan ingested into Decapod LCM (or documented as pending)
- [ ] Pipeline state updated with spec phase completion