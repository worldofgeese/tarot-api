import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Readings API Tests", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3001";

    app.listen(3001);
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
      body: JSON.stringify({
        cards_json: "[1,2,3]"
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("POST /api/readings with invalid spread_type returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "invalid-spread",
        cards_json: "[1,2,3]"
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("POST /api/readings with missing cards_json returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single"
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("POST /api/readings with non-JSON cards_json returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "not valid json"
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("POST /api/readings with notes > 2000 chars returns 400", async () => {
    const longNotes = "a".repeat(2001);
    const response = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "celtic-cross",
        cards_json: "[1,2,3,4,5,6,7,8,9,10]",
        notes: longNotes
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  // GET /api/readings tests
  test("GET /api/readings returns array", async () => {
    // First create a reading
    await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[0]",
        notes: "Test reading for list"
      })
    });

    const response = await fetch(`${baseUrl}/api/readings`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("GET /api/readings with pagination works", async () => {
    const response = await fetch(`${baseUrl}/api/readings?limit=5&offset=0`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(5);
  });

  // GET /api/readings/:id tests
  test("GET /api/readings/:id returns reading", async () => {
    // First create a reading
    const createResponse = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "three-card",
        cards_json: "[5,10,15]",
        notes: "Past, present, future"
      })
    });

    const created = await createResponse.json();
    const id = created.id;

    // Now fetch it
    const response = await fetch(`${baseUrl}/api/readings/${id}`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("id", id);
    expect(data).toHaveProperty("spread_type", "three-card");
    expect(data).toHaveProperty("cards_json", "[5,10,15]");
    expect(data).toHaveProperty("notes", "Past, present, future");
    expect(data).toHaveProperty("created_at");
  });

  test("GET /api/readings/:id with invalid id returns 404", async () => {
    const response = await fetch(`${baseUrl}/api/readings/99999`);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("GET /api/readings/:id with non-numeric id returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/readings/abc`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });
});
