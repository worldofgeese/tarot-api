import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Cards Search Endpoint Tests", () => {
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

  test("GET /api/cards/search returns 200 with results for 'fool'", async () => {
    const response = await fetch(`${baseUrl}/api/cards/search?q=fool`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Should find "The Fool" card
    const foolCard = data.find((card: any) => card.name.toLowerCase().includes("fool"));
    expect(foolCard).toBeDefined();
  });

  test("GET /api/cards/search returns empty array for nonsense query 'xyzzy123'", async () => {
    const response = await fetch(`${baseUrl}/api/cards/search?q=xyzzy123`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  test("GET /api/cards/search returns 400 when q is missing", async () => {
    const response = await fetch(`${baseUrl}/api/cards/search`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test("GET /api/cards/search results contain expected card fields", async () => {
    const response = await fetch(`${baseUrl}/api/cards/search?q=fool`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.length).toBeGreaterThan(0);

    const card = data[0];
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("name");
    expect(card).toHaveProperty("keywords");
    expect(card).toHaveProperty("arcana");
    expect(Array.isArray(card.keywords)).toBe(true);
  });
});
