# @tarot/forgejo-ci — Swamp Extension Model

## What this is

A Swamp *extension model* that wraps the Forgejo Actions API. Agents can call
`get_latest_run`, `trigger_workflow`, and `get_run_logs` as typed method calls,
with vault-stored credentials and Zod-validated, immutable artifact outputs.

## What this is NOT

A replacement for `fj-ex`. For everything the SDLC pipeline does today — reading
CI status in gate scripts, retry loops, log downloads — use `fj-ex` instead:

```bash
fj-ex actions runs --latest --workflow ci.yaml --repo owner/name
fj-ex actions trigger --workflow ci.yaml --ref main --repo owner/name
fj-ex actions logs run --latest --repo owner/name
fj-ex actions cancel / rerun ...
```

`fj-ex` is already wired into `sdlc-gate.py` and `cc-ci-retry.py`. It
auto-resolves repo from `git remote`, needs no Swamp server, and covers more
surface (cancel, rerun, job-level logs, artifacts) than this model does.

## When to use this model instead

Only when you're building a **Swamp workflow graph** that needs CI data as typed,
versioned artifacts — e.g.:

```
get_latest_run → [status == success] → trigger_deploy → smoke_test → report
```

In that context, the model is the right primitive: outputs are immutable Swamp
artifacts, chainable by other workflow steps, with a full audit trail.

For one-off agent queries or gate scripts: `fj-ex`.

## Reference implementation notes

Built 2026-04-15. Key lessons for anyone building a similar model:

- **`npm:zod@4`** — Swamp's Deno bundler requires this specifier. Not `zod` (v3).
- **Forgejo API field names**: `commit_sha`, `created`, `updated` — NOT `head_sha`,
  `created_at`, `updated_at`. The `*_at` variants are GitHub conventions.
- **Reserved resource name**: `"latest"` cannot be used in `writeResource`. Use
  `run_<id>` or `trigger_<timestamp>` instead.
- **`trigger_workflow` returns 204 No Content** — not a JSON body. Don't try to
  parse the response.
- **Vault token**: stored via `swamp vault secret create forgejo-api --key token
  --value <token>`. Referenced in model YAML as `${{ vault.get(forgejo-api, token) }}`.
- **`globalArguments` must be flat** — keys match method argument names directly,
  not nested under method name.
- **Council review must run before merge** — post-merge diff is empty, producing
  a false BLOCK verdict.

## Status

Parked as reference implementation. Tests pass (7/7), CI green, live smoke test
confirmed (run_103 artifact, workflow triggered successfully).

Not hardened for general use: tests are structural (file content assertions), not
behavioural (HTTP mock + response parsing). Elevate if/when a Swamp workflow graph
actually needs this as a dependency.
