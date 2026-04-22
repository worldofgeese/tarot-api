import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("GET /api/cards/combine/:id1/:id2", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3003";

    app.listen(3003);
  });

  afterAll(() => {
    app.stop();
  });

  // AC1: Two valid Minor Arcana cards from same element → relationship "harmonious"
  test("Returns harmonious relationship for same element (Wands)", async () => {
    // Ace of Wands (id=23) and Two of Wands (id=24) - both fire element
    const response = await fetch(`${baseUrl}/api/cards/combine/23/24`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("card1");
    expect(data).toHaveProperty("card2");
    expect(data).toHaveProperty("relationship");
    expect(data).toHaveProperty("combined_keywords");

    expect(data.card1.id).toBe(23);
    expect(data.card2.id).toBe(24);
    expect(data.relationship).toBe("harmonious");
    expect(Array.isArray(data.combined_keywords)).toBe(true);
  });

  // AC2: Fire + Water cards → relationship "tension"
  test("Returns tension relationship for opposing elements (Fire + Water)", async () => {
    // Ace of Wands (id=23, fire) and Ace of Cups (id=37, water)
    const response = await fetch(`${baseUrl}/api/cards/combine/23/37`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.relationship).toBe("tension");
  });

  test("Returns tension relationship for opposing elements (Air + Earth)", async () => {
    // Ace of Swords (id=51, air) and Ace of Pentacles (id=65, earth)
    const response = await fetch(`${baseUrl}/api/cards/combine/51/65`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.relationship).toBe("tension");
  });

  // AC3: Major Arcana + any → relationship "neutral"
  test("Returns neutral relationship for Major Arcana card", async () => {
    // The Fool (id=1, Major Arcana) and Ace of Wands (id=23, fire)
    const response = await fetch(`${baseUrl}/api/cards/combine/1/23`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.relationship).toBe("neutral");
  });

  test("Returns neutral relationship for two Major Arcana cards", async () => {
    // The Fool (id=1) and The Magician (id=2)
    const response = await fetch(`${baseUrl}/api/cards/combine/1/2`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.relationship).toBe("neutral");
  });

  // AC4: Same ID → 400 error
  test("Returns 400 when both IDs are the same", async () => {
    const response = await fetch(`${baseUrl}/api/cards/combine/1/1`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toEqual({ error: "Cards must be different" });
  });

  // AC5: Invalid ID → 404
  test("Returns 404 when first card ID is not found", async () => {
    const response = await fetch(`${baseUrl}/api/cards/combine/999/1`);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toEqual({ error: "Card not found" });
  });

  test("Returns 404 when second card ID is not found", async () => {
    const response = await fetch(`${baseUrl}/api/cards/combine/1/999`);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toEqual({ error: "Card not found" });
  });

  test("Returns 400 for invalid card ID format", async () => {
    const response = await fetch(`${baseUrl}/api/cards/combine/abc/1`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toEqual({ error: "Invalid id" });
  });

  // AC6: combined_keywords is deduplicated array
  test("combined_keywords is deduplicated array", async () => {
    // Use two cards that might share some keywords
    const response = await fetch(`${baseUrl}/api/cards/combine/1/2`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.combined_keywords)).toBe(true);

    // Check for no duplicates
    const uniqueKeywords = [...new Set(data.combined_keywords)];
    expect(data.combined_keywords.length).toBe(uniqueKeywords.length);
  });

  test("Card objects include all standard fields", async () => {
    const response = await fetch(`${baseUrl}/api/cards/combine/1/2`);
    expect(response.status).toBe(200);

    const data = await response.json();

    // Check card1 structure
    expect(data.card1).toHaveProperty("id");
    expect(data.card1).toHaveProperty("name");
    expect(data.card1).toHaveProperty("arcana");
    expect(data.card1).toHaveProperty("suit");
    expect(data.card1).toHaveProperty("keywords");
    expect(Array.isArray(data.card1.keywords)).toBe(true);

    // Check card2 structure
    expect(data.card2).toHaveProperty("id");
    expect(data.card2).toHaveProperty("name");
    expect(data.card2).toHaveProperty("arcana");
    expect(data.card2).toHaveProperty("suit");
    expect(data.card2).toHaveProperty("keywords");
    expect(Array.isArray(data.card2.keywords)).toBe(true);
  });
});
