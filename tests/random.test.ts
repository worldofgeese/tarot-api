import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Random Cards Endpoint Tests", () => {
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

  test("GET /api/cards/random returns 200 status", async () => {
    const response = await fetch(`${baseUrl}/api/cards/random`);
    expect(response.status).toBe(200);
  });

  test("GET /api/cards/random returns single card with expected fields", async () => {
    const response = await fetch(`${baseUrl}/api/cards/random`);
    const card = await response.json();

    // Verify it's an object (single card, not array)
    expect(Array.isArray(card)).toBe(false);
    expect(typeof card).toBe("object");

    // Check expected fields
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("name");
    expect(card).toHaveProperty("arcana");
    expect(card).toHaveProperty("suit");
    expect(card).toHaveProperty("number");
    expect(card).toHaveProperty("image_desc");
    expect(card).toHaveProperty("keywords");
    expect(card).toHaveProperty("upright_meaning");
    expect(card).toHaveProperty("reversed_meaning");

    // Verify types
    expect(typeof card.id).toBe("number");
    expect(typeof card.name).toBe("string");
    expect(typeof card.arcana).toBe("string");
  });

  test("GET /api/cards/random?count=3 returns exactly 3 cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/random?count=3`);
    const cards = await response.json();

    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBe(3);

    // Verify each card has expected structure
    cards.forEach((card: any) => {
      expect(card).toHaveProperty("id");
      expect(card).toHaveProperty("name");
      expect(card).toHaveProperty("arcana");
    });
  });

  test("GET /api/cards/random?count=0 returns 400 error", async () => {
    const response = await fetch(`${baseUrl}/api/cards/random?count=0`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Count must be between 1 and 10");
  });

  test("GET /api/cards/random?count=11 returns 400 error", async () => {
    const response = await fetch(`${baseUrl}/api/cards/random?count=11`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Count must be between 1 and 10");
  });

  test("GET /api/cards/random (no count param) returns 1 card", async () => {
    const response = await fetch(`${baseUrl}/api/cards/random`);
    const card = await response.json();

    // Should return a single card object, not an array
    expect(Array.isArray(card)).toBe(false);
    expect(typeof card).toBe("object");
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("name");
  });
});
