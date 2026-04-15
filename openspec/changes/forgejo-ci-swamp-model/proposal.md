## Why

Forgejo CI workflows need to be automated and monitored programmatically. Currently, there's no swamp model for Forgejo CI operations, forcing users to write custom shell scripts or manual API calls. A dedicated Forgejo CI model enables workflow automation, status monitoring, and log retrieval through swamp's data model and workflow system.

## What Changes

- Add a new `forgejo_ci` swamp extension model to integrate with Forgejo's REST API
- Implement methods to retrieve latest workflow runs, trigger workflows, and fetch run logs
- Enable swamp workflows to automate CI/CD operations on Forgejo instances
- Provide typed schemas for Forgejo workflow run data and API responses

## Capabilities

### New Capabilities
- `forgejo-ci-integration`: Integration with Forgejo REST API for CI workflow automation including get_latest_run, trigger_workflow, and get_run_logs methods

### Modified Capabilities
<!-- No existing capabilities are being modified -->

## Impact

- New extension model file at `extensions/models/forgejo_ci.ts`
- New model type available via `swamp model type search forgejo`
- Enables automation of Forgejo CI workflows through swamp workflows
- Depends on Forgejo REST API at `https://paphos.hound-celsius.ts.net/api/v1/`
