import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Readings API Tests", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    // Use in-memory DB for tests (no side effects, no file on disk)
    app = createApp(":memory:");
    baseUrl = "http://localhost:3002";
    app.listen(3002);
  });

  afterAll(() => {
    app.stop();
  });

  // POST /api/readings tests
  test("POST /api/readings with valid body returns 201", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "three-card",
        cards_json: "[1,5,22]",
        notes: "My first reading"
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("spread_type", "three-card");
    expect(data).toHaveProperty("cards_json", "[1,5,22]");
    expect(data).toHaveProperty("notes", "My first reading");
    expect(data).toHaveProperty("created_at");
  });

  test("POST /api/readings without notes is valid", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[0]"
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data.notes).toBeNull();
  });

  test("POST /api/readings with missing spread_type returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards_json: "[1,5]" })
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("POST /api/readings with invalid spread_type returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread_type: "zodiac", cards_json: "[1]" })
    });
    expect(response.status).toBe(400);
  });

  test("POST /api/readings with missing cards_json returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread_type: "single" })
    });
    expect(response.status).toBe(400);
  });

  test("POST /api/readings with non-JSON cards_json returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread_type: "single", cards_json: "not-json" })
    });
    expect(response.status).toBe(400);
  });

  test("POST /api/readings with non-integer card IDs returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread_type: "single", cards_json: '["ace","two"]' })
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("integer");
  });

  test("POST /api/readings with notes > 2000 chars returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[0]",
        notes: "x".repeat(2001)
      })
    });
    expect(response.status).toBe(400);
  });

  test("GET /api/readings returns array", async () => {
    const response = await fetch(`${baseUrl}/api/readings`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/readings with pagination works", async () => {
    const response = await fetch(`${baseUrl}/api/readings?limit=1&offset=0`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/readings/:id returns reading", async () => {
    // Create one first
    const post = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread_type: "single", cards_json: "[0]", notes: "test" })
    });
    const created = await post.json();

    const response = await fetch(`${baseUrl}/api/readings/${created.id}`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(created.id);
    expect(data.notes).toBe("test");
  });

  test("GET /api/readings/:id with missing id returns 404", async () => {
    const response = await fetch(`${baseUrl}/api/readings/99999`);
    expect(response.status).toBe(404);
  });

  test("GET /api/readings/:id with non-numeric id returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings/abc`);
    expect(response.status).toBe(400);
  });
});
