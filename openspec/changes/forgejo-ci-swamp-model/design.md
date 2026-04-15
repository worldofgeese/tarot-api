## Context

The tarot-api project uses Forgejo for CI/CD workflows. Currently, there's no programmatic way to interact with Forgejo CI through swamp's model system. Users must resort to shell scripts or manual API calls, which don't integrate with swamp's data model, workflows, or dependency tracking.

Forgejo provides a REST API at `https://paphos.hound-celsius.ts.net/api/v1/` that exposes workflow run information, trigger endpoints, and log retrieval. This design creates a swamp extension model that wraps the Forgejo API in a type-safe, swamp-native interface.

The model will be implemented in TypeScript using Zod schemas for type safety and validation, following swamp's extension model patterns.

## Goals / Non-Goals

**Goals:**
- Create a swamp extension model for Forgejo CI operations
- Implement three core methods: `get_latest_run`, `trigger_workflow`, `get_run_logs`
- Use Zod schemas to validate Forgejo API responses
- Enable integration with swamp workflows through CEL expressions
- Support authentication via Forgejo API tokens
- Store workflow run data in swamp's data model for downstream use

**Non-Goals:**
- Full coverage of Forgejo's API surface (only CI-relevant endpoints)
- UI components or web interface
- Webhook listener or event-driven triggers (pull-based only)
- Multi-instance management (single Forgejo instance per model)
- Forgejo server administration or configuration

## Decisions

### 1. Extension Model vs Built-in Model
**Decision:** Implement as a TypeScript extension model in `extensions/models/forgejo_ci.ts`

**Rationale:** Forgejo integration is specific to this project and not general-purpose enough for swamp's core. Extension models allow per-project customization and don't require swamp upstream changes.

**Alternatives considered:**
- Built-in model: Too specific, increases swamp's maintenance burden
- Shell scripts with command/shell model: Loses type safety, error handling, and data model integration

### 2. API Client Approach
**Decision:** Use native `fetch()` with typed Zod schemas rather than a Forgejo SDK

**Rationale:**
- Forgejo's API is simple REST with minimal endpoints needed
- Direct fetch control gives better error handling and timeout management
- Zod schemas provide compile-time and runtime type safety
- No additional SDK dependencies to version-manage

**Alternatives considered:**
- Forgejo SDK (if exists): Adds dependency weight for minimal benefit
- GraphQL: Forgejo doesn't expose GraphQL

### 3. Authentication Method
**Decision:** Use bearer token authentication via swamp vault expressions

**Rationale:**
- Forgejo API tokens are the standard auth mechanism
- Swamp vaults provide secure credential storage
- Enables vault expressions in workflow YAML (e.g., `token: $vault.forgejo.token`)

**Alternatives considered:**
- Hardcoded tokens: Security risk, rejected
- OAuth: Overkill for CI automation use case

### 4. Method Design
**Decision:** Three focused methods rather than one generic "call API" method

**Rationale:**
- Each method has distinct input/output contracts
- Enables method-specific validation and error handling
- Better discoverability via `swamp model type describe`
- Clearer audit trail in swamp data

**Methods:**
- `get_latest_run`: Retrieves most recent workflow run for a repo/workflow
- `trigger_workflow`: Dispatches a new workflow run with optional inputs (returns 204 No Content per Forgejo API spec)
- `get_run_logs`: Fetches console output for a specific run ID

**Note on trigger_workflow:** Forgejo's `/repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches` endpoint returns HTTP 204 No Content on success. The method will not return a run ID directly. Users must call `get_latest_run` afterward to retrieve the newly triggered run's details.

### 5. Data Model Storage
**Decision:** Store workflow run data as swamp data artifacts

**Rationale:**
- Enables CEL expressions to reference run data (status, commit SHA, etc.)
- Provides history and audit trail
- Allows downstream workflow steps to depend on CI results
- Example: `data.latest("ci_run", "main_build").attributes.status`

## Risks / Trade-offs

**[Risk: API Rate Limiting]** → Use exponential backoff in fetch calls, document rate limit behavior in model description

**[Risk: API Schema Changes]** → Zod schemas will catch breaking changes at runtime, fail fast with validation errors

**[Risk: Token Expiry]** → Model returns clear authentication errors, user must rotate tokens in vault

**[Trade-off: Pull-based vs Event-driven]** → This design requires polling for status updates rather than webhook-triggered notifications. Acceptable for CI use case where humans trigger workflows and check status periodically.

**[Trade-off: Single Instance]** → Each model instance targets one Forgejo instance. Users needing multi-instance support must create multiple model instances with different vault tokens. This keeps the model simple and avoids complex routing logic.
