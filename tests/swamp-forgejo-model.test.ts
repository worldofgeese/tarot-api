/**
 * tests/swamp-forgejo-model.test.ts
 * TDD-RED: Tests for Forgejo CI Swamp extension model
 * These tests verify the extension model file exists and exports valid structure.
 * Written BEFORE implementation — will fail until forgejo_ci.ts is implemented.
 */
import { test, expect, describe } from "bun:test";
import { readFileSync, existsSync } from "fs";

describe("Forgejo CI Swamp Extension Model", () => {
  const MODEL_PATH = "extensions/models/forgejo_ci.ts";

  test("extension model file exists", () => {
    expect(existsSync(MODEL_PATH)).toBe(true);
  });

  test("extension model file exports a valid Swamp model definition", async () => {
    // Swamp extension models export either 'model' or 'extension' named export
    // We verify the file contains required Swamp model structure
    const content = readFileSync(MODEL_PATH, "utf-8");

    // Must import Zod for schema definitions
    expect(content).toMatch(/import.*zod/i);

    // Must define model type with @collective/name format or local name
    expect(content).toMatch(/type:|"type":|type =|type:/);

    // Must define at least one method
    expect(content).toMatch(/get_latest_run|trigger_workflow|get_run_logs/);

    // Must have execute or similar method implementation
    expect(content).toMatch(/async|fetch|execute/);
  });

  test("model includes get_latest_run method definition", () => {
    const content = readFileSync(MODEL_PATH, "utf-8");
    expect(content).toContain("get_latest_run");
  });

  test("model includes trigger_workflow method definition", () => {
    const content = readFileSync(MODEL_PATH, "utf-8");
    expect(content).toContain("trigger_workflow");
  });

  test("model includes get_run_logs method definition", () => {
    const content = readFileSync(MODEL_PATH, "utf-8");
    expect(content).toContain("get_run_logs");
  });

  test("model uses Forgejo API base URL", () => {
    const content = readFileSync(MODEL_PATH, "utf-8");
    expect(content).toMatch(/forgejo|paphos\.hound-celsius|api\/v1/i);
  });

  test("model handles authentication via token", () => {
    const content = readFileSync(MODEL_PATH, "utf-8");
    expect(content).toMatch(/token|auth|Authorization/i);
  });
});
