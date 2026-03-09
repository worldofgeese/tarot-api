# Tarot API — Experiment Batch Plan

Six experiments, all using tarot-api as the testbed. Each gets its own branch.

## Experiments

### 1. Plan.md Pattern (from queue)
**Branch:** `exp/plan-md-pattern`
**What:** Formalize the project.md → plan.md → todo → execute workflow. Write a `plan.md` generator that reads a PROJECT_SUMMARY.md or README and produces a structured plan with numbered tasks, dependencies, and acceptance criteria. Then execute one task from it via TDD.
**Concrete task:** Add a "Daily Card" feature (SPEC_DAILY_CARD.md exists). Generate the plan from spec, execute via TDD.
**Success:** Feature ships. Plan.md pattern documented as reusable.

### 2. Pub/Sub Escalation Pattern (from queue)
**Branch:** `exp/pubsub-escalation`
**What:** Wire up `scripts/agent-escalation-monitor.sh` to actually fire during a real task. Create a deliberately slow/complex task, set a tight timeout, and verify the escalation monitor catches and reports it.
**Concrete task:** Add reversed card lookup (SPEC_REVERSED_LOOKUP.md exists). Set 3-min timeout. Run escalation monitor in parallel. Verify alerts surface.
**Success:** Escalation alert fires correctly for overdue task. No false positives.

### 3. Pre-flight Safety Checks (MOSAIC pattern)
**Branch:** `exp/mosaic-safety`
**What:** Add a pre-flight check script that validates tool calls before execution. For tarot-api: add input validation middleware to all API endpoints (SQL injection protection, param sanitization). Mirror the pattern in our agent safety (check before act).
**Concrete task:** Add input validation + sanitization middleware to Elysia routes. Write tests that attempt SQL injection, XSS, and malformed params.
**Success:** All injection tests caught and rejected. Middleware documented as pattern.

### 4. Event-Triggered Agent Spawning (Cursor pattern)  
**Branch:** `exp/event-triggered`
**What:** Set up a Forgejo webhook that fires on push → triggers an OpenClaw hook → spawns a reviewer agent that reads CI logs and posts a summary.
**Concrete task:** Configure Forgejo webhook for tarot-api repo. Write the hook handler. Push a commit, verify reviewer spawns and posts.
**Success:** Push triggers automated review without polling.

### 5. Queryable Traces (Arize pattern)
**Branch:** `exp/queryable-traces`
**What:** Add structured JSONL logging to subagent-tracker. Every dispatch writes: task, spawn time, completion time, outcome, self-review output, CI result. Build grep-based query interface.
**Concrete task:** Instrument the other experiments in this batch to produce traces. After batch completes, query: "which experiments had self-review concerns?" "which had CI failures?"
**Success:** JSONL traces exist for all dispatches. Queries return meaningful results.

### 6. Skill Composability Test (Codex pattern)
**Branch:** `exp/skill-composability`
**What:** Test whether forgejo-ci → forgesync → deployment chains without manual wiring. For tarot-api: push to Forgejo → CI passes → auto-mirror to GitHub → verify mirror is current.
**Concrete task:** Trigger the full forgejo-ci → forgesync chain for tarot-api. Document friction points and manual steps.
**Success:** Chain executes with ≤1 manual intervention. Friction documented.

## Execution Order

Experiments 5 (traces) runs across ALL others — start it first.
Then run 1-4 in parallel (they're independent branches).
Experiment 6 runs last (needs commits from others to test the chain).

## Dispatch Strategy

- Exp 5: Instrument subagent-tracker first (workspace task, no branch needed)
- Exp 1-2: ACP dispatch to tarot-api repo, TDD pipeline
- Exp 3: ACP dispatch to tarot-api repo, TDD pipeline
- Exp 4: Manual (webhook setup requires Forgejo admin + OpenClaw config)
- Exp 6: Manual chain test after others merge
