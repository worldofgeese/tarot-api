# SDLC Enshrinement Campaign Proposal

## Abstract
Implement and enforce the promoted SDLC stack (`OpenSpec → Swamp → Decapod → TDD → Claude/Cook → Gates`) in tarot-api through five concrete experiments. This proposal formalizes the transition from declarative documentation to lived workflow reality.

## Core Challenges
1. Current state: repo contracts reference SDLC components but lack enforcement
2. Behavioral/E2E path remains broken (`bun test` fails with `ERR_CONNECTION_REFUSED`)
3. Preflight enforcement is unreliable (crashes on missing binaries)

## Experiment Mapping
| Experiment | Focus | Success Criteria |
|------------|-------|------------------|
| EX-005     | Plan-before-code cultural gate | OpenSpec changes accepted by PR
| EX-006     | Design boundaries visibility | ACP briefs include explicit scope limits
| EX-007     | Evidence-based completion | Pre-completion checklists signed off
| EX-012     | Behavioral review integration | Code reviews require test+behavioral validation
| EX-014     | Resource headroom transparency | Task briefs include sizing metrics |

## Proposed Changes
1. **Add OpenSpec change**: `SDLC_Enshrinement-Proposal.md` with full detail
2. **Update Swamp integration**: Enforce workflow checks before Dev/Review
3. **Strengthen Cook usage**: Add orchestration steps in repo-owned paths
4. **Fix E2E path**: Create managed server script for browser tests
5. **Enhance `bun test`**: Route browser tests through managed server when `--e2e` flag used

## Validation Path
- OpenSpec: PR acceptance
- Swamp: Workflow enforcement
- Cook: Orchestration execution
- Decapod: Validation gate
- Behavioral: E2E script passes

## Resource Allocation
- Estimated: 15m dev time per experiment
- Primary artifacts: OpenSpec change, E2E server script, Swamp config update

## Risk Mitigation
- If OpenSpec fails to apply: Manual enforcement documentation
- If E2E path remains broken: Postpone EX-012/EX-014 until path fixed
