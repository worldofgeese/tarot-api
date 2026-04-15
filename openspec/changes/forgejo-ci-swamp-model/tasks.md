## 1. Setup and Project Structure

- [ ] 1.1 Create `extensions/` directory if it doesn't exist
- [ ] 1.2 Create `extensions/models/` directory if it doesn't exist
- [ ] 1.3 Create empty `extensions/models/forgejo_ci.ts` file
- [ ] 1.4 Create manifest.yaml skeleton for the forgejo_ci extension model

## 2. Define Schemas and Types (TDD: Schema First)

- [ ] 2.1 Define Zod schema for ForgejoWorkflowRun (id, status, commit_sha, workflow_name, created_at, updated_at)
- [ ] 2.2 Define Zod schema for TriggerWorkflowInput (workflow_name, branch, optional inputs object)
- [ ] 2.3 Define Zod schema for WorkflowLogs (raw string content)
- [ ] 2.4 Define model attributes schema (base_url, repo_owner, repo_name, token via vault)

## 3. Get Latest Run Method (TDD: Test → Implement)

- [ ] 3.1 Write smoke test for `get_latest_run` against live Forgejo instance
- [ ] 3.2 Write test for empty results (no runs exist) scenario
- [ ] 3.3 Write test for authentication failure scenario
- [ ] 3.4 Implement `get_latest_run` method with workflow_name input parameter
- [ ] 3.5 Add fetch call to Forgejo API `/repos/{owner}/{repo}/actions/runs` endpoint
- [ ] 3.6 Implement response parsing and Zod validation for workflow run data
- [ ] 3.7 Handle authentication errors with clear error messages
- [ ] 3.8 Handle empty results gracefully
- [ ] 3.9 Store workflow run data as swamp data artifact with appropriate name
- [ ] 3.10 Verify all get_latest_run tests pass

## 4. Trigger Workflow Method (TDD: Test → Implement)

- [ ] 4.1 Write test for successful workflow trigger (204 No Content)
- [ ] 4.2 Write test for invalid workflow name error
- [ ] 4.3 Write test for invalid branch error
- [ ] 4.4 Write test for authentication failure
- [ ] 4.5 Implement `trigger_workflow` method with workflow_name, branch, and inputs parameters
- [ ] 4.6 Add fetch call to Forgejo API `/repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches` endpoint
- [ ] 4.7 Implement request body construction with branch and input parameters
- [ ] 4.8 Handle 204 No Content success response (note: does NOT return run ID)
- [ ] 4.9 Handle invalid workflow name errors with descriptive messages
- [ ] 4.10 Handle invalid branch errors with descriptive messages
- [ ] 4.11 Store trigger metadata as swamp data artifact (timestamp, workflow, branch)
- [ ] 4.12 Verify all trigger_workflow tests pass

## 5. Get Run Logs Method (TDD: Test → Implement)

- [ ] 5.1 Write test for successful log retrieval with completed run
- [ ] 5.2 Write test for run not found error
- [ ] 5.3 Write test for logs not yet available (pending state)
- [ ] 5.4 Write test for authentication failure
- [ ] 5.5 Implement `get_run_logs` method with run_id input parameter
- [ ] 5.6 Add fetch call to Forgejo API `/repos/{owner}/{repo}/actions/runs/{run_id}/logs` endpoint
- [ ] 5.7 Implement log parsing and formatting with timestamps
- [ ] 5.8 Handle run not found errors
- [ ] 5.9 Handle logs not yet available (pending state)
- [ ] 5.10 Store logs as swamp data artifact
- [ ] 5.11 Verify all get_run_logs tests pass

## 6. Error Handling and Resilience

- [ ] 6.1 Write test for API rate limiting scenario
- [ ] 6.2 Write test for network timeout scenario
- [ ] 6.3 Write test for Zod schema validation failure
- [ ] 6.4 Implement exponential backoff for API rate limiting
- [ ] 6.5 Add timeout handling with configurable timeout period
- [ ] 6.6 Implement Zod schema validation error messages
- [ ] 6.7 Add network error handling with retry guidance
- [ ] 6.8 Create helper function for consistent error formatting
- [ ] 6.9 Verify all error handling tests pass

## 7. Authentication (TDD: Test → Implement)

- [ ] 7.1 Write test for vault expression resolution
- [ ] 7.2 Write test for token expiry error handling
- [ ] 7.3 Implement vault expression resolution for API token
- [ ] 7.4 Add bearer token authentication to all API requests
- [ ] 7.5 Handle token expiry errors with remediation guidance
- [ ] 7.6 Verify all authentication tests pass

## 8. Integration Testing

- [ ] 8.1 Run full smoke test suite against live Forgejo instance at https://paphos.hound-celsius.ts.net/api/v1/
- [ ] 8.2 Test end-to-end flow: trigger workflow → wait → get latest run → get logs
- [ ] 8.3 Verify all test scenarios pass (success and error cases)
- [ ] 8.4 Verify data artifacts are created correctly in swamp data model

## 9. Documentation

- [ ] 9.1 Add model description with usage examples to manifest.yaml
- [ ] 9.2 Document required vault token setup in manifest.yaml
- [ ] 9.3 Add example swamp workflow using the forgejo_ci model
- [ ] 9.4 Document CEL expression patterns for accessing workflow run data
- [ ] 9.5 Document the 204 No Content behavior for trigger_workflow
