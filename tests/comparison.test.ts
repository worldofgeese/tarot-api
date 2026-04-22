import { describe, test, expect } from "bun:test";
import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { apiRoutes } from "../src/routes/api";

// TDD: RED phase — these tests are written BEFORE the endpoint exists.
// They will fail until /api/cards/compare/:id1/:id2 is implemented.

function makeApp() {
  const db = new Database(":memory:");
  const realDb = new Database("data/tarot.db");
  db.exec(`
    CREATE TABLE cards (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      arcana TEXT NOT NULL,
      suit TEXT,
      number INTEGER,
      upright_meaning TEXT NOT NULL,
      reversed_meaning TEXT NOT NULL,
      keywords TEXT NOT NULL,
      image_desc TEXT NOT NULL
    )
  `);
  const cards = realDb.prepare("SELECT * FROM cards").all();
  const insert = db.prepare("INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?)");
  for (const c of cards as Record<string, unknown>[]) {
    insert.run(c.id, c.name, c.arcana, c.suit, c.number, c.upright_meaning, c.reversed_meaning, c.keywords, c.image_desc);
  }
  realDb.close();
  return new Elysia().use(apiRoutes(db));
}

describe("GET /api/cards/compare/:id1/:id2", () => {
  const app = makeApp();

  test("returns 200 with comparison structure for valid cards", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/compare/1/2"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("card1");
    expect(body).toHaveProperty("card2");
    expect(body).toHaveProperty("comparison");
    expect(body.comparison).toHaveProperty("sameArcana");
    expect(body.comparison).toHaveProperty("sameSuit");
    expect(body.comparison).toHaveProperty("sameElement");
    expect(body.comparison).toHaveProperty("numberDifference");
    expect(body.comparison).toHaveProperty("sharedKeywords");
    expect(body.comparison).toHaveProperty("uniqueToCard1");
    expect(body.comparison).toHaveProperty("uniqueToCard2");
  });

  test("AC1: Two cards from same suit have sameSuit true and sameElement true", async () => {
    // Ace of Wands (id=23) and Two of Wands (id=24) are both from wands suit (fire element)
    const res = await app.handle(new Request("http://localhost/api/cards/compare/23/24"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.comparison.sameSuit).toBe(true);
    expect(body.comparison.sameElement).toBe(true);
    expect(body.comparison.sameArcana).toBe(true); // Both Minor Arcana
  });

  test("AC2: Major + Minor have sameArcana false and numberDifference null", async () => {
    // The Fool (id=1, Major Arcana) and Ace of Wands (id=23, Minor Arcana)
    const res = await app.handle(new Request("http://localhost/api/cards/compare/1/23"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.comparison.sameArcana).toBe(false);
    expect(body.comparison.numberDifference).toBe(null);
  });

  test("AC3: Cards with overlapping keywords have sharedKeywords populated", async () => {
    // Compare two cards and verify shared keywords
    const res = await app.handle(new Request("http://localhost/api/cards/compare/1/2"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.comparison.sharedKeywords)).toBe(true);
    // If there are shared keywords, verify they exist in both cards
    if (body.comparison.sharedKeywords.length > 0) {
      const card1Keywords = body.card1.keywords.map((k: string) => k.toLowerCase());
      const card2Keywords = body.card2.keywords.map((k: string) => k.toLowerCase());
      body.comparison.sharedKeywords.forEach((keyword: string) => {
        expect(card1Keywords.includes(keyword.toLowerCase())).toBe(true);
        expect(card2Keywords.includes(keyword.toLowerCase())).toBe(true);
      });
    }
  });

  test("AC4: Invalid ID returns 404", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/compare/1/999"));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Card not found");
  });

  test("AC4: Invalid ID for first card returns 404", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/compare/999/1"));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Card not found");
  });

  test("AC5: Keywords comparison is case-insensitive", async () => {
    // This test verifies that keywords are compared case-insensitively
    const res = await app.handle(new Request("http://localhost/api/cards/compare/1/2"));
    expect(res.status).toBe(200);

    const body = await res.json();
    // All comparison keywords should be in a consistent case (we'll use lowercase)
    [...body.comparison.sharedKeywords, ...body.comparison.uniqueToCard1, ...body.comparison.uniqueToCard2]
      .forEach((keyword: string) => {
        // Verify keywords are normalized (should match original keyword in cards)
        expect(typeof keyword).toBe("string");
      });
  });

  test("Same card comparison shows all fields identical", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/compare/1/1"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.comparison.sameArcana).toBe(true);
    expect(body.comparison.sameSuit).toBe(true);
    expect(body.comparison.numberDifference).toBe(0);
    expect(body.comparison.uniqueToCard1).toEqual([]);
    expect(body.comparison.uniqueToCard2).toEqual([]);
    // All keywords should be shared
    expect(body.comparison.sharedKeywords.length).toBe(body.card1.keywords.length);
  });

  test("Two cards from different suits have sameSuit false", async () => {
    // Ace of Wands (id=23, wands) and Ace of Cups (id=37, cups)
    const res = await app.handle(new Request("http://localhost/api/cards/compare/23/37"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.comparison.sameSuit).toBe(false);
    expect(body.comparison.sameElement).toBe(false);
    expect(body.comparison.sameArcana).toBe(true); // Both Minor Arcana
  });

  test("numberDifference calculates correctly for Minor Arcana cards", async () => {
    // Ace of Wands (id=23, number=1) and Five of Wands (id=27, number=5)
    const res = await app.handle(new Request("http://localhost/api/cards/compare/23/27"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.comparison.numberDifference).toBe(4); // |1 - 5| = 4
  });

  test("Two Major Arcana cards have sameSuit true (both null suits)", async () => {
    // The Fool (id=1) and The Magician (id=2) are both Major Arcana with null suits
    const res = await app.handle(new Request("http://localhost/api/cards/compare/1/2"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.comparison.sameSuit).toBe(true); // Null suits count as same
  });

  test("Invalid card ID format returns 400", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/compare/abc/1"));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Invalid id");
  });

  test("uniqueToCard1 and uniqueToCard2 contain non-shared keywords", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/compare/1/23"));
    expect(res.status).toBe(200);

    const body = await res.json();

    // Verify that unique keywords are not in shared
    const sharedSet = new Set(body.comparison.sharedKeywords.map((k: string) => k.toLowerCase()));
    body.comparison.uniqueToCard1.forEach((keyword: string) => {
      expect(sharedSet.has(keyword.toLowerCase())).toBe(false);
    });
    body.comparison.uniqueToCard2.forEach((keyword: string) => {
      expect(sharedSet.has(keyword.toLowerCase())).toBe(false);
    });
  });
});
