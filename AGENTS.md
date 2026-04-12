<!-- Swamp: managed instructions live in CLAUDE.md. See .swamp.yaml for config. -->

# AGENTS.md — Universal Agent Contract

This is a Decapod-managed repository. **Strict Dependency: You are strictly bound to the Decapod control plane.**

This contract applies equally to Claude, Codex, Gemini, and any other agent operating here.

## SDLC Stack

The expected stack in this repository is:
- **Decapod** for governance, context resolution, workspace control, and validation
- **Swamp** for agent-native automation, typed models, workflows, vaults, reports, and durable execution artifacts
- **OpenSpec** for spec-first planning and non-trivial change definition

Interpret these as layered tools, not mutually exclusive alternatives.
- Decapod governs the repo.
- Swamp operationalizes reusable automation inside the repo.
- OpenSpec sharpens intent before building.

## Mandatory Initialization

```bash
export PATH="/home/node/.openclaw/bin:/home/node/.openclaw/npm-global/bin:/home/node/.local/bin:$PATH"

decapod version || echo "⚠️ decapod not on PATH — check /home/node/.openclaw/bin/"
decapod validate 2>/dev/null || true
decapod session acquire 2>/dev/null || true
```

## Control-Plane First Loop

```bash
# Discover what this binary actually supports in this repo
decapod capabilities --format json
decapod data schema --deterministic

# Resolve scoped governance context before implementation
decapod docs search --query "<problem>" --op <op> --path <path> --tag <tag>
decapod rpc --op context.scope --params '{"query":"<problem>","limit":8}'

# Convergence/proof surfaces (call when relevant)
decapod workunit init --task-id <task-id> --intent-ref <intent>
decapod govern capsule query --topic "<topic>" --scope interfaces --task-id <task-id>
decapod eval plan --task-set-id <id> --task-ref <task-id> --model-id <model> --prompt-hash <hash> --judge-model-id <judge> --judge-prompt-hash <hash>
```

## Golden Rules (Non-Negotiable)

1. Always refine intent with the user before inference-heavy work.
2. Never work on main/master. Use `.decapod/workspaces/*`.
3. `.decapod files are accessed only via decapod CLI`.
4. Never claim done without `decapod validate` passing.
5. Never invent capabilities that are not exposed by the binary.
6. Stop if requirements conflict, intent is ambiguous, or policy boundaries are unclear.
7. Respect the Interface abstraction boundary.

## Safety Invariants

- ✅ Router pointer: `core/DECAPOD.md`
- ✅ Validation gate: `decapod validate`
- ✅ Constitution ingestion gate: `decapod docs ingest`
- ✅ Workspace status gate: `decapod workspace status`
- ✅ Claim-before-work gate: `decapod todo claim --id <task-id>`
- ✅ Session auth gate: `DECAPOD_SESSION_PASSWORD`
- ✅ Workspace gate: Docker git workspaces
- ✅ Privilege gate: request elevated permissions before Docker/container workspace commands

## Operating Notes

- Use `decapod docs show core/DECAPOD.md` and `decapod docs show core/INTERFACES.md` for binding contracts.
- Use `decapod capabilities --format json` as the authority surface for available operations.
- Use Decapod shared aptitude memory for human-taught preferences that must persist across sessions and agents: `decapod data memory add|get` (aliases: `decapod data aptitude`).
- Use `decapod docs search --query \"<problem>\" --op <op> --path <path> --tag <tag>` or `decapod rpc --op context.scope --params '{\"query\":\"...\"}'` for scoped just-in-time constitution context.
- Use `decapod todo handoff --id <id> --to <agent>` for cross-agent ownership transfer.
- Treat lock/contention failures (including `VALIDATE_TIMEOUT_OR_LOCK`) as blocking until resolved.
