import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Reversed Meaning Lookup Endpoint Tests", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3003";

    // Start server on test port
    app.listen(3003);
  });

  afterAll(() => {
    app.stop();
  });

  test("GET /api/cards/reversed?q=fear returns 200", async () => {
    const response = await fetch(`${baseUrl}/api/cards/reversed?q=fear`);
    expect(response.status).toBe(200);
  });

  test("Response is an array", async () => {
    const response = await fetch(`${baseUrl}/api/cards/reversed?q=fear`);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("Every result's reversed_meaning contains the query string (case-insensitive)", async () => {
    const response = await fetch(`${baseUrl}/api/cards/reversed?q=fear`);
    const data = await response.json();

    for (const card of data) {
      const reversedMeaning = card.reversed_meaning.toLowerCase();
      expect(reversedMeaning).toContain("fear");
    }
  });

  test("GET /api/cards/reversed (no q param) returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/cards/reversed`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("query parameter q is required");
  });

  test("GET /api/cards/reversed?q= (empty q) returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/cards/reversed?q=`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("query parameter q is required");
  });

  test("GET /api/cards/reversed?q=xyznonexistent returns 200 with empty array", async () => {
    const response = await fetch(`${baseUrl}/api/cards/reversed?q=xyznonexistent`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  test("Results include id, name, arcana, reversed_meaning fields", async () => {
    const response = await fetch(`${baseUrl}/api/cards/reversed?q=loss`);
    const data = await response.json();

    if (data.length > 0) {
      const card = data[0];
      expect(card).toHaveProperty("id");
      expect(card).toHaveProperty("name");
      expect(card).toHaveProperty("arcana");
      expect(card).toHaveProperty("reversed_meaning");
    }
  });

  test("GET /api/cards/reversed?q=loss returns at least 1 result", async () => {
    const response = await fetch(`${baseUrl}/api/cards/reversed?q=loss`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});
