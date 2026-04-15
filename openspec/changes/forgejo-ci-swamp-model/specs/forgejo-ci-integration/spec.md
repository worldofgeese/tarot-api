## ADDED Requirements

### Requirement: Get latest workflow run
The system SHALL retrieve the most recent workflow run for a specified repository and workflow name.

#### Scenario: Latest run exists
- **WHEN** a workflow has at least one run in history
- **THEN** system returns the most recent run with id, status, commit SHA, branch, and timestamps

#### Scenario: No runs exist
- **WHEN** a workflow has never been executed
- **THEN** system returns an empty result or null with appropriate status message

#### Scenario: Authentication failure
- **WHEN** the API token is invalid or expired
- **THEN** system returns a clear authentication error with remediation guidance

### Requirement: Trigger workflow
The system SHALL start a new workflow run with optional input parameters.

#### Scenario: Successful trigger with inputs
- **WHEN** user triggers a workflow with valid branch and input parameters
- **THEN** system initiates the workflow run and returns the new run ID

#### Scenario: Successful trigger without inputs
- **WHEN** user triggers a workflow with only branch specified
- **THEN** system initiates the workflow run with default inputs

#### Scenario: Invalid workflow name
- **WHEN** the specified workflow does not exist in the repository
- **THEN** system returns a descriptive error indicating the workflow was not found

#### Scenario: Invalid branch
- **WHEN** the specified branch does not exist
- **THEN** system returns an error indicating the branch is invalid

### Requirement: Get workflow run logs
The system SHALL retrieve console output logs for a specific workflow run.

#### Scenario: Logs available
- **WHEN** a workflow run has completed or is in progress
- **THEN** system returns the full console output with timestamps and step information

#### Scenario: Run not found
- **WHEN** the specified run ID does not exist
- **THEN** system returns an error indicating the run was not found

#### Scenario: Logs not yet available
- **WHEN** a workflow run has just started and logs are not yet generated
- **THEN** system returns empty logs or a status indicating logs are pending

### Requirement: Data model integration
The system SHALL store workflow run data in swamp's data model for downstream use.

#### Scenario: Run data stored as artifact
- **WHEN** any method retrieves or creates workflow run data
- **THEN** system stores the data as a swamp data artifact with appropriate name and metadata

#### Scenario: CEL expression access
- **WHEN** a swamp workflow references workflow run data via CEL
- **THEN** system resolves the expression correctly using data.latest() pattern

### Requirement: Error handling
The system SHALL provide clear, actionable error messages for all failure modes.

#### Scenario: Network timeout
- **WHEN** the Forgejo API does not respond within timeout period
- **THEN** system returns a timeout error with retry guidance

#### Scenario: API rate limit
- **WHEN** the API rate limit is exceeded
- **THEN** system returns a rate limit error with backoff recommendation

#### Scenario: Malformed response
- **WHEN** the API returns data that fails Zod schema validation
- **THEN** system returns a validation error with schema mismatch details

### Requirement: Type safety
The system SHALL validate all API responses using Zod schemas.

#### Scenario: Valid response structure
- **WHEN** the API returns data matching the expected schema
- **THEN** system successfully validates and processes the response

#### Scenario: Schema violation
- **WHEN** the API returns data with missing or wrong-typed fields
- **THEN** system throws a validation error and does not proceed with invalid data
