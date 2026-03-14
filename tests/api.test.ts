import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("API Integration Tests", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    // Import the app (will be created later)
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3001";

    // Start server on test port
    app.listen(3001);
  });

  afterAll(() => {
    app.stop();
  });

  test("GET /api/cards returns 200 and valid JSON", async () => {
    const response = await fetch(`${baseUrl}/api/cards`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("GET /api/cards/:id returns card with correct schema", async () => {
    const response = await fetch(`${baseUrl}/api/cards/0`);
    expect(response.status).toBe(200);

    const card = await response.json();
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("name");
    expect(card).toHaveProperty("arcana");
    expect(card).toHaveProperty("upright_meaning");
    expect(card).toHaveProperty("reversed_meaning");
    expect(card).toHaveProperty("keywords");
    expect(Array.isArray(card.keywords)).toBe(true);
    expect(card).toHaveProperty("image_desc");
  });

  test("GET /api/cards/:id with invalid id returns 404", async () => {
    const response = await fetch(`${baseUrl}/api/cards/999`);
    expect(response.status).toBe(404);
  });

  test("GET /api/spread/3-card returns 3 cards", async () => {
    const response = await fetch(`${baseUrl}/api/spread/3-card`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
  });

  test("GET /api/spread/celtic-cross returns 10 cards", async () => {
    const response = await fetch(`${baseUrl}/api/spread/celtic-cross`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(10);
  });

  test("GET /api/spread/single returns 1 card", async () => {
    const response = await fetch(`${baseUrl}/api/spread/single`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
  });

  test("GET /api/spread/single?count=1 returns 1 card", async () => {
    const response = await fetch(`${baseUrl}/api/spread/single?count=1`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
  });

  test("GET /api/spread/single?count=3 returns 3 cards", async () => {
    const response = await fetch(`${baseUrl}/api/spread/single?count=3`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
  });

  test("GET /api/spread/single with no count defaults to 1", async () => {
    const response = await fetch(`${baseUrl}/api/spread/single`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
  });

  test("GET /api/spread/single?count=0 returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/spread/single?count=0`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("GET /api/spread/single?count=11 returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/spread/single?count=11`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("GET /api/search with empty query returns error", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=`);
    expect(response.status).toBe(400);
  });

  test("GET /api/search with valid query returns results", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=love`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("spread cards are randomized", async () => {
    const spreads = await Promise.all(
      Array(10).fill(null).map(() =>
        fetch(`${baseUrl}/api/spread/3-card`).then(r => r.json())
      )
    );

    // Check that not all spreads are identical
    const firstSpreadIds = spreads[0].map((c: any) => c.id).join(",");
    const allIdentical = spreads.every(
      (spread: any) => spread.map((c: any) => c.id).join(",") === firstSpreadIds
    );
    expect(allIdentical).toBe(false);
  });

  test("GET /api/cards with pagination works", async () => {
    const response = await fetch(`${baseUrl}/api/cards?limit=10&offset=0`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.length).toBeLessThanOrEqual(10);
  });

  test("GET /api/cards with arcana filter works", async () => {
    const response = await fetch(`${baseUrl}/api/cards?arcana=major`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.length).toBe(22);
    expect(data.every((c: any) => c.arcana === "major")).toBe(true);
  });

  test("GET /api/cards with suit filter works", async () => {
    const response = await fetch(`${baseUrl}/api/cards?suit=cups`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.length).toBe(14);
    expect(data.every((c: any) => c.suit === "cups")).toBe(true);
  });
});
