import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Cards by Suit Endpoint Tests", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3004";

    // Start server on test port
    app.listen(3004);
  });

  afterAll(() => {
    app.stop();
  });

  test("GET /api/cards/suit/Wands returns 200 with 14 cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/Wands`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(14);
  });

  test("GET /api/cards/suit/wands is case-insensitive", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/wands`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(14);
  });

  test("GET /api/cards/suit/InvalidSuit returns 404", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/InvalidSuit`);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe("No cards found for suit");
  });

  test("GET /api/cards/suit/Wands returns cards with matching suit field", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/Wands`);
    const data = await response.json();

    // All cards should have suit "wands" (stored lowercase in DB)
    for (const card of data) {
      expect(card.suit).toBe("wands");
    }
  });

  test("GET /api/cards/suit/Cups returns cards sorted by number ascending", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/Cups`);
    const data = await response.json();

    // Check that cards are sorted by number
    for (let i = 1; i < data.length; i++) {
      expect(data[i].number).toBeGreaterThanOrEqual(data[i - 1].number);
    }
  });
});
