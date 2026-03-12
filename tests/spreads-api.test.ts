import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { apiRoutes } from "../src/routes/api";

describe("Spreads API", () => {
  let app: Elysia;
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");

    // Create cards table with test data
    db.exec(`
      CREATE TABLE cards (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        arcana TEXT NOT NULL,
        suit TEXT,
        number INTEGER,
        keywords TEXT NOT NULL,
        meaning_upright TEXT NOT NULL,
        meaning_reversed TEXT NOT NULL,
        description TEXT NOT NULL
      )
    `);

    // Insert minimal test cards
    const insert = db.prepare(`
      INSERT INTO cards (id, name, arcana, suit, number, keywords, meaning_upright, meaning_reversed, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 1; i <= 78; i++) {
      insert.run(
        i,
        `Card ${i}`,
        i <= 22 ? "Major" : "Minor",
        i <= 22 ? null : "Cups",
        i <= 22 ? null : i - 22,
        JSON.stringify(["test", "keyword"]),
        "Upright meaning",
        "Reversed meaning",
        "Test description"
      );
    }

    app = new Elysia().use(apiRoutes(db));
  });

  test("GET /api/spreads returns 200 with 4 spreads", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads")
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(4);
    expect(data[0]).toHaveProperty("name");
    expect(data[0]).toHaveProperty("positions");
  });

  test("GET /api/spreads/three-card returns correct definition", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads/three-card")
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("three-card");
    expect(data.name).toBe("Three Card Spread");
    expect(data.positions).toHaveLength(3);
    expect(data.positions[0].name).toBe("Past");
    expect(data.positions[1].name).toBe("Present");
    expect(data.positions[2].name).toBe("Future");
  });

  test("GET /api/spreads/invalid returns 404", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads/invalid")
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("POST /api/spreads/three-card/draw returns 3 cards", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads/three-card/draw", {
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("spread");
    expect(data).toHaveProperty("cards");
    expect(data.spread.id).toBe("three-card");
    expect(data.cards).toHaveLength(3);

    // Verify structure of first card
    expect(data.cards[0]).toHaveProperty("position");
    expect(data.cards[0]).toHaveProperty("card");
    expect(data.cards[0]).toHaveProperty("reversed");
    expect(typeof data.cards[0].reversed).toBe("boolean");

    // Verify card has keywords parsed as array
    expect(Array.isArray(data.cards[0].card.keywords)).toBe(true);
  });

  test("POST /api/spreads/celtic-cross/draw returns 10 cards", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads/celtic-cross/draw", {
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.spread.id).toBe("celtic-cross");
    expect(data.cards).toHaveLength(10);
  });

  test("POST /api/spreads/horseshoe/draw returns 7 cards", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads/horseshoe/draw", {
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.spread.id).toBe("horseshoe");
    expect(data.cards).toHaveLength(7);
  });

  test("All drawn cards are unique", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads/celtic-cross/draw", {
        method: "POST"
      })
    );

    const data = await response.json();
    const cardIds = data.cards.map((c: any) => c.card.id);
    const uniqueIds = new Set(cardIds);
    expect(uniqueIds.size).toBe(cardIds.length);
  });

  test("Each card has reversed boolean", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads/three-card/draw", {
        method: "POST"
      })
    );

    const data = await response.json();
    data.cards.forEach((cardData: any) => {
      expect(typeof cardData.reversed).toBe("boolean");
    });
  });

  test("POST /api/spreads/invalid/draw returns 404", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads/invalid/draw", {
        method: "POST"
      })
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });
});
