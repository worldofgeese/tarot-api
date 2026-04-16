import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("GET /api/cards/suit/:suit/random", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3010";

    // Start server on test port
    app.listen(3010);
  });

  afterAll(() => {
    app.stop();
  });

  test("returns a single card from the specified suit", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/wands/random`);

    expect(response.status).toBe(200);

    const card = await response.json();
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("name");
    expect(card).toHaveProperty("suit");
    expect(card.suit.toLowerCase()).toBe("wands");
    expect(Array.isArray(card.keywords)).toBe(true);
  });

  test("returns a card from cups suit", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/cups/random`);

    expect(response.status).toBe(200);

    const card = await response.json();
    expect(card.suit.toLowerCase()).toBe("cups");
  });

  test("returns a card from swords suit", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/swords/random`);

    expect(response.status).toBe(200);

    const card = await response.json();
    expect(card.suit.toLowerCase()).toBe("swords");
  });

  test("returns a card from pentacles suit", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/pentacles/random`);

    expect(response.status).toBe(200);

    const card = await response.json();
    expect(card.suit.toLowerCase()).toBe("pentacles");
  });

  test("returns 400 for invalid suit", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/invalid/random`);

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("returns 400 for major arcana (not a suit)", async () => {
    const response = await fetch(`${baseUrl}/api/cards/suit/major/random`);

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("multiple calls return different cards from the same suit", async () => {
    const cards = new Set<number>();

    // Make 10 calls to increase likelihood of getting different cards
    for (let i = 0; i < 10; i++) {
      const response = await fetch(`${baseUrl}/api/cards/suit/wands/random`);
      const card = await response.json();
      cards.add(card.id);
    }

    // With 14 cards in a suit, 10 random draws should give us at least 2 different cards
    expect(cards.size).toBeGreaterThanOrEqual(2);
  });
});
