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

  test("GET /api/health returns dbConnected boolean", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();
    expect(typeof data.dbConnected).toBe("boolean");
    expect(data.dbConnected).toBe(true);
  });

  test("GET /api/health returns uptime in seconds", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();

    // Verify uptime exists and is a number
    expect(typeof data.uptime).toBe("number");

    // Verify uptime is positive
    expect(data.uptime).toBeGreaterThan(0);

    // Verify uptime is reasonable (not in milliseconds)
    expect(data.uptime).toBeLessThan(1000000);
  });

  test("GET /api/health response time is under 100ms", async () => {
    const startTime = performance.now();
    const response = await fetch(`${baseUrl}/api/health`);
    await response.json();
    const endTime = performance.now();

    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(100);
  });
});
