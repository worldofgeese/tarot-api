// Swamp extension models use Deno's npm: specifier in bundled versions.
// For local development and testing, we use the installed 'zod' package.
// The Swamp bundler resolves this correctly at publish time via manifest.yaml.
import { z } from "zod";

// Zod schema for Forgejo workflow run data
const WorkflowRunSchema = z.object({
  id: z.number(),
  status: z.string(), // "success", "failure", "pending", "cancelled", etc.
  commit_sha: z.string(),
  workflow_name: z.string(),
  created_at: z.string(), // ISO 8601 datetime
  updated_at: z.string(), // ISO 8601 datetime
});

// Zod schema for trigger metadata
const TriggerMetadataSchema = z.object({
  workflow_name: z.string(),
  branch: z.string(),
  triggered_at: z.string(), // ISO 8601 datetime
  inputs: z.record(z.string(), z.unknown()).optional(),
});

// Zod schema for workflow logs
const RunLogsSchema = z.object({
  run_id: z.number(),
  logs: z.string(),
  retrieved_at: z.string(), // ISO 8601 datetime
});

// Global arguments schema for the model
const GlobalArgsSchema = z.object({
  base_url: z.string().url(),
  repo_owner: z.string(),
  repo_name: z.string(),
  token: z.string(), // marked sensitive in Swamp via .meta({ sensitive: true })
});

// Helper function to make authenticated API requests
async function forgejoFetch(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {});
  // Forgejo uses token authentication (not Bearer)
  headers.set("Authorization", `token ${token}`);
  headers.set("Accept", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

export const model = {
  type: "@tarot/forgejo-ci",
  version: "2026.04.15.1",
  globalArguments: GlobalArgsSchema,
  resources: {
    workflow_run: {
      description: "Forgejo workflow run data",
      schema: WorkflowRunSchema,
      lifetime: "infinite" as const,
      garbageCollection: 10,
    },
    trigger_metadata: {
      description: "Metadata about triggered workflow",
      schema: TriggerMetadataSchema,
      lifetime: "infinite" as const,
      garbageCollection: 10,
    },
    run_logs: {
      description: "Console output logs from workflow run",
      schema: RunLogsSchema,
      lifetime: "7d" as const,
      garbageCollection: 5,
    },
  },
  methods: {
    get_latest_run: {
      description: "Retrieve the most recent workflow run for a specific workflow",
      arguments: z.object({
        workflow_name: z.string(),
      }),
      execute: async (args: { workflow_name: string }, context: any) => {
        const { base_url, repo_owner, repo_name, token } = context.globalArgs;

        context.logger.info(
          `Fetching latest run for workflow: ${args.workflow_name}`
        );

        // Forgejo API endpoint for workflow runs
        const url = `${base_url}/repos/${repo_owner}/${repo_name}/actions/runs?workflow_id=${args.workflow_name}&limit=1`;

        const response = await forgejoFetch(url, token);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              `Authentication failed (${response.status}). Check your token.`
            );
          }
          throw new Error(
            `Failed to fetch workflow runs: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        // Forgejo returns runs in a "workflow_runs" array
        if (!data.workflow_runs || data.workflow_runs.length === 0) {
          context.logger.warn(
            `No runs found for workflow: ${args.workflow_name}`
          );
          // Return empty result
          return { dataHandles: [] };
        }

        const latestRun = data.workflow_runs[0];

        // Transform and validate the run data
        // NOTE: Forgejo API uses 'commit_sha', 'created', 'updated' (not head_sha/created_at/updated_at)
        const workflowRun = {
          id: latestRun.id,
          status: latestRun.status,
          commit_sha: latestRun.commit_sha,
          workflow_name: args.workflow_name,
          created_at: latestRun.created,
          updated_at: latestRun.updated,
        };

        // Validate with Zod schema
        const validatedRun = WorkflowRunSchema.parse(workflowRun);

        // Store as swamp data artifact
        const runName = `run_${validatedRun.id}`;
        const handle = await context.writeResource(
          "workflow_run",
          runName,
          validatedRun
        );

        context.logger.info(
          `Successfully retrieved run ${validatedRun.id} with status: ${validatedRun.status}`
        );

        return { dataHandles: [handle] };
      },
    },

    trigger_workflow: {
      description:
        "Trigger a workflow dispatch event (returns 204 No Content per Forgejo API)",
      arguments: z.object({
        workflow_name: z.string(),
        branch: z.string(),
        inputs: z.record(z.string(), z.unknown()).optional(),
      }),
      execute: async (
        args: { workflow_name: string; branch: string; inputs?: Record<string, unknown> },
        context: any
      ) => {
        const { base_url, repo_owner, repo_name, token } = context.globalArgs;

        context.logger.info(
          `Triggering workflow: ${args.workflow_name} on branch: ${args.branch}`
        );

        // Forgejo API endpoint for workflow dispatches
        const url = `${base_url}/repos/${repo_owner}/${repo_name}/actions/workflows/${args.workflow_name}/dispatches`;

        const requestBody = {
          ref: args.branch,
          inputs: args.inputs || {},
        };

        const response = await forgejoFetch(url, token, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        // Forgejo returns 204 No Content on success
        if (response.status === 204) {
          const metadata = {
            workflow_name: args.workflow_name,
            branch: args.branch,
            triggered_at: new Date().toISOString(),
            inputs: args.inputs,
          };

          const validatedMetadata = TriggerMetadataSchema.parse(metadata);

          const handle = await context.writeResource(
            "trigger_metadata",
            `trigger_${new Date().toISOString().slice(0,19).replace(/[:-]/g,'_')}`,
            validatedMetadata
          );

          context.logger.info(
            `Successfully triggered workflow: ${args.workflow_name}`
          );

          return { dataHandles: [handle] };
        }

        // Handle error responses
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            `Authentication failed (${response.status}). Check your token.`
          );
        }

        if (response.status === 404) {
          throw new Error(
            `Workflow not found: ${args.workflow_name}. Check workflow name and branch.`
          );
        }

        // Try to get error details from response body
        let errorMessage = `Failed to trigger workflow: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = `${errorMessage} - ${errorData.message}`;
          }
        } catch {
          // Ignore JSON parse errors
        }

        throw new Error(errorMessage);
      },
    },

    get_run_logs: {
      description: "Retrieve console output logs for a specific workflow run",
      arguments: z.object({
        run_id: z.number(),
      }),
      execute: async (args: { run_id: number }, context: any) => {
        const { base_url, repo_owner, repo_name, token } = context.globalArgs;

        context.logger.info(`Fetching logs for run ID: ${args.run_id}`);

        // Forgejo API endpoint for run logs
        const url = `${base_url}/repos/${repo_owner}/${repo_name}/actions/runs/${args.run_id}/logs`;

        const response = await forgejoFetch(url, token);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              `Authentication failed (${response.status}). Check your token.`
            );
          }
          if (response.status === 404) {
            throw new Error(
              `Run not found: ${args.run_id}. The run may not exist or logs may not be available yet.`
            );
          }
          throw new Error(
            `Failed to fetch run logs: ${response.status} ${response.statusText}`
          );
        }

        // Logs are returned as plain text
        const logs = await response.text();

        const runLogs = {
          run_id: args.run_id,
          logs: logs,
          retrieved_at: new Date().toISOString(),
        };

        const validatedLogs = RunLogsSchema.parse(runLogs);

        const handle = await context.writeResource(
          "run_logs",
          `run_${args.run_id}`,
          validatedLogs
        );

        context.logger.info(
          `Successfully retrieved logs for run ${args.run_id} (${logs.length} bytes)`
        );

        return { dataHandles: [handle] };
      },
    },
  },
};
