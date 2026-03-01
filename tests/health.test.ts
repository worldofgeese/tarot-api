import { describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { apiRoutes } from "../src/routes/api";

describe("GET /api/health", () => {
  const db = new Database(":memory:");
  const app = new Elysia().use(apiRoutes(db));

  test("returns 200 status", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );
    expect(response.status).toBe(200);
  });

  test("response has status: ok", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  test("response has timestamp as valid ISO 8601 string", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );
    const data = await response.json();
    expect(data.timestamp).toBeDefined();
    expect(typeof data.timestamp).toBe("string");
    
    // Validate ISO 8601 format
    const timestamp = new Date(data.timestamp);
    expect(timestamp.toISOString()).toBe(data.timestamp);
  });

  test("response has database: connected", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );
    const data = await response.json();
    expect(data.database).toBe("connected");
  });

  test("response has version matching package.json", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );
    const data = await response.json();
    
    // Read package.json to verify
    const pkg = await import("../package.json");
    expect(data.version).toBe(pkg.version);
  });

  test("response Content-Type is application/json", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );
    const contentType = response.headers.get("content-type");
    expect(contentType).toContain("application/json");
  });

  test("response has cardCount field", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );
    const data = await response.json();
    expect(data.cardCount).toBeDefined();
  });

  test("cardCount is a number", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );
    const data = await response.json();
    expect(typeof data.cardCount).toBe("number");
  });
});
