import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Health Endpoint Tests", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3002";

    // Start server on test port
    app.listen(3002);
  });

  afterAll(() => {
    app.stop();
  });

  test("GET /api/health returns 200 status", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
  });

  test("GET /api/health returns status 'ok'", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  test("GET /api/health returns cardCount of 78", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();
    expect(data.cardCount).toBe(78);
  });

  test("GET /api/health returns valid ISO 8601 timestamp", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();

    // Verify timestamp exists and is a string
    expect(typeof data.timestamp).toBe("string");

    // Verify it's a valid ISO 8601 date
    const date = new Date(data.timestamp);
    expect(date.toISOString()).toBe(data.timestamp);

    // Verify it's not an invalid date
    expect(isNaN(date.getTime())).toBe(false);
  });
});
