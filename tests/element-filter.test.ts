import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Element Filter Endpoint Tests", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3005";

    // Start server on test port
    app.listen(3005);
  });

  afterAll(() => {
    app.stop();
  });

  // AC1: GET /cards/element/fire → 200, returns 14 cards, all suit=Wands
  test("GET /api/cards/element/fire returns 200 status", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/fire`);
    expect(response.status).toBe(200);
  });

  test("GET /api/cards/element/fire returns exactly 14 cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/fire`);
    const data = await response.json();
    expect(data).toBeArray();
    expect(data.length).toBe(14);
  });

  test("GET /api/cards/element/fire - all cards have suit=Wands", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/fire`);
    const data = await response.json();

    for (const card of data) {
      expect(card.suit).toBe("Wands");
    }
  });

  // AC2: GET /cards/element/water → 200, returns 14 cards, all suit=Cups
  test("GET /api/cards/element/water returns 200 status", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/water`);
    expect(response.status).toBe(200);
  });

  test("GET /api/cards/element/water returns exactly 14 cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/water`);
    const data = await response.json();
    expect(data).toBeArray();
    expect(data.length).toBe(14);
  });

  test("GET /api/cards/element/water - all cards have suit=Cups", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/water`);
    const data = await response.json();

    for (const card of data) {
      expect(card.suit).toBe("Cups");
    }
  });

  // AC3: GET /cards/element/air → 200, returns 14 cards, all suit=Swords
  test("GET /api/cards/element/air returns 200 status", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/air`);
    expect(response.status).toBe(200);
  });

  test("GET /api/cards/element/air returns exactly 14 cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/air`);
    const data = await response.json();
    expect(data).toBeArray();
    expect(data.length).toBe(14);
  });

  test("GET /api/cards/element/air - all cards have suit=Swords", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/air`);
    const data = await response.json();

    for (const card of data) {
      expect(card.suit).toBe("Swords");
    }
  });

  // AC4: GET /cards/element/earth → 200, returns 14 cards, all suit=Pentacles
  test("GET /api/cards/element/earth returns 200 status", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/earth`);
    expect(response.status).toBe(200);
  });

  test("GET /api/cards/element/earth returns exactly 14 cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/earth`);
    const data = await response.json();
    expect(data).toBeArray();
    expect(data.length).toBe(14);
  });

  test("GET /api/cards/element/earth - all cards have suit=Pentacles", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/earth`);
    const data = await response.json();

    for (const card of data) {
      expect(card.suit).toBe("Pentacles");
    }
  });

  // AC5: GET /cards/element/invalid → 400, error message
  test("GET /api/cards/element/invalid returns 400 status", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/invalid`);
    expect(response.status).toBe(400);
  });

  test("GET /api/cards/element/invalid returns error message", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/invalid`);
    const data = await response.json();
    expect(data.error).toBe("Invalid element. Must be one of: fire, water, air, earth");
  });

  // AC6: GET /cards/element/ (empty) → 400 or 404
  test("GET /api/cards/element/ (empty) returns 404 status", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/`);
    expect(response.status).toBe(404);
  });

  // AC7: Each card has id, name, suit, meanings
  test("GET /api/cards/element/fire - cards have required fields", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/fire`);
    const data = await response.json();

    const card = data[0];
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("name");
    expect(card).toHaveProperty("suit");
    expect(card).toHaveProperty("meanings");
    expect(card).toHaveProperty("keywords");
    expect(card.keywords).toBeArray();
  });

  // AC8: No Major Arcana cards in any element response
  test("GET /api/cards/element/fire - no Major Arcana cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/fire`);
    const data = await response.json();

    for (const card of data) {
      // Major Arcana cards have null or empty suit
      expect(card.suit).not.toBe(null);
      expect(card.suit).not.toBe("");
      expect(card.suit).toBeTruthy();
    }
  });

  test("GET /api/cards/element/water - no Major Arcana cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/water`);
    const data = await response.json();

    for (const card of data) {
      expect(card.suit).not.toBe(null);
      expect(card.suit).not.toBe("");
      expect(card.suit).toBeTruthy();
    }
  });

  test("GET /api/cards/element/air - no Major Arcana cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/air`);
    const data = await response.json();

    for (const card of data) {
      expect(card.suit).not.toBe(null);
      expect(card.suit).not.toBe("");
      expect(card.suit).toBeTruthy();
    }
  });

  test("GET /api/cards/element/earth - no Major Arcana cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/element/earth`);
    const data = await response.json();

    for (const card of data) {
      expect(card.suit).not.toBe(null);
      expect(card.suit).not.toBe("");
      expect(card.suit).toBeTruthy();
    }
  });
});
