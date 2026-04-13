# Proposal: Enshrine SDLC Five Experiments

## What

Make tarot-api the first honest repo where the promoted SDLC stack is **enshrined and used throughout** by implementing five specific workflow experiments as concrete, load-bearing repo artifacts:

- **EX-005**: Plan-before-code impact map gate
- **EX-006**: Design boundaries in ACP briefs  
- **EX-007**: Pre-completion checklist with evidence
- **EX-012**: Behavioral review pass after code review
- **EX-014**: Resource headroom annotations in task briefs

This transforms the repo from advertising the stack (`Decapod → Swamp → OpenSpec → Cook → TDD`) to forcing or strongly steering contributors through it.

## Why

**Current state**: tarot-api has the control stack wired up (`.decapod/`, `.swamp.yaml`, `.cook/config.json`, `.claude/commands/opsx/`) but usage is uneven:
- Contracts mention the tools but don't enforce their use
- Unit/API tests pass but E2E path is broken (`bun test` drags in browser tests without a managed server → `ERR_CONNECTION_REFUSED`)
- Workspace preflight (`cc-preflight.py`) crashes on missing Playwright binary instead of degrading cleanly
- No clear workflow forcing Impact Map, Design Boundaries, Resource Headroom, or Completion Checklist before claiming "done"
- Behavioral review is mentioned but not operationalized

**Risk**: The SDLC stack remains decorative rather than load-bearing. Contributors can bypass it entirely.

**Opportunity**: Use tarot-api as the proving ground to validate these five experiments materially improve work quality, reduce rework, and catch issues earlier.

## Success Criteria

1. **Enshrinement visible**: Each experiment has a concrete repo artifact (template, script, config, or checklist) that makes its use discoverable and expected
2. **Behavioral path honest**: E2E tests run through a managed server, tests pass, verification commands documented
3. **Stack usage real**: Swamp/Cook/Decapod materially used, not just initialized
4. **TDD enforced**: Test-first pattern clear in workflow docs/scripts
5. **Evidence-backed evaluation**: Final report includes experiment-by-experiment assessment with concrete friction/value data

## Non-Goals

- Product feature work unrelated to SDLC (no new tarot endpoints unless needed for behavioral validation)
- Broad UI redesign
- Cross-repo harmonization beyond what tarot-api needs
- Ornamental framework sprawl without honest usage

## Open Questions

1. Should Impact Map template live in `.decapod/templates/` or `docs/workflow/`?
2. How prescriptive should Design Boundaries be (hard gate vs. strong nudge)?
3. Should Resource Headroom be a YAML frontmatter field or prose section?
4. Where does Behavioral Review checklist belong (CI script, manual doc, or Cook step)?

## Dependencies

- Decapod CLI functional (`decapod validate`, `decapod capabilities`)
- Swamp initialized (`.swamp.yaml` exists)
- Cook config present (`.cook/config.json`)
- Playwright/E2E dependencies available
- Branch workflow (not touching main directly)
