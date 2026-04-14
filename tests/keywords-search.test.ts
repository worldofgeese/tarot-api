import { describe, test, expect } from "bun:test";
import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { apiRoutes } from "../src/routes/api";

// TDD: RED phase — tests written BEFORE the endpoint is implemented
// This endpoint searches for cards that have matching keywords

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

describe("GET /api/cards/keywords/search", () => {
  const app = makeApp();

  test("returns 400 if q param is missing", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords/search"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("returns 200 with correct structure for valid query", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords/search?q=beginning"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("query");
    expect(body).toHaveProperty("keywords");
    expect(body).toHaveProperty("cards");
    expect(Array.isArray(body.keywords)).toBe(true);
    expect(Array.isArray(body.cards)).toBe(true);
  });

  test("returns query parameter in response", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords/search?q=love"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.query).toBe("love");
  });

  test("returns cards with matching keywords (case-insensitive)", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords/search?q=beginning"));
    expect(res.status).toBe(200);
    const body = await res.json();

    // "The Fool" has "beginning" as a keyword
    expect(body.cards.length).toBeGreaterThan(0);
    const foolCard = body.cards.find((card: any) => card.name === "The Fool");
    expect(foolCard).toBeDefined();
    expect(Array.isArray(foolCard.keywords)).toBe(true);
    expect(foolCard.keywords.some((k: string) => k.toLowerCase().includes("beginning"))).toBe(true);
  });

  test("returns matching keywords found in results", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords/search?q=beginning"));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.keywords.length).toBeGreaterThan(0);
    expect(body.keywords.some((k: string) => k.toLowerCase().includes("beginning"))).toBe(true);
  });

  test("partial match works (query 'love' matches 'self-love')", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords/search?q=love"));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should match keywords containing "love" like "love", "self-love", etc.
    expect(body.cards.length).toBeGreaterThan(0);
    expect(body.keywords.length).toBeGreaterThan(0);
  });

  test("case-insensitive search (BEGINNING matches beginning)", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords/search?q=BEGINNING"));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.cards.length).toBeGreaterThan(0);
    const foolCard = body.cards.find((card: any) => card.name === "The Fool");
    expect(foolCard).toBeDefined();
  });

  test("returns empty arrays for no matches", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords/search?q=xyzzynonexistent"));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.query).toBe("xyzzynonexistent");
    expect(body.keywords).toEqual([]);
    expect(body.cards).toEqual([]);
  });

  test("all returned cards have at least one matching keyword", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords/search?q=power"));
    expect(res.status).toBe(200);
    const body = await res.json();

    const query = body.query.toLowerCase();
    for (const card of body.cards) {
      const hasMatch = card.keywords.some((k: string) => k.toLowerCase().includes(query));
      expect(hasMatch).toBe(true);
    }
  });

  test("keywords array contains only matching keywords", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords/search?q=power"));
    expect(res.status).toBe(200);
    const body = await res.json();

    const query = body.query.toLowerCase();
    for (const keyword of body.keywords) {
      expect(keyword.toLowerCase().includes(query)).toBe(true);
    }
  });
});
