import { describe, test, expect } from "bun:test";
import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { apiRoutes } from "../src/routes/api";

// In-process tests — no real server needed, works in CI
function makeApp() {
  const db = new Database(":memory:");
  // Seed minimal schema + all 78 cards from real db
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
  // Copy all cards from real DB into in-memory DB
  const cards = realDb.prepare("SELECT * FROM cards").all();
  const insert = db.prepare(
    "INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?)"
  );
  for (const c of cards as Record<string, unknown>[]) {
    insert.run(c.id, c.name, c.arcana, c.suit, c.number, c.upright_meaning, c.reversed_meaning, c.keywords, c.image_desc);
  }
  realDb.close();
  return new Elysia().use(apiRoutes(db));
}

describe("Card numerology", () => {
  const app = makeApp();

  test("Major Arcana cards 0-21 have IDs 0-21", async () => {
    const response = await app.handle(new Request("http://localhost/api/cards/arcana/major"));
    expect(response.status).toBe(200);
    const cards = await response.json();
    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBe(22);
    const ids = cards.map((c: { id: number }) => c.id).sort((a: number, b: number) => a - b);
    expect(ids[0]).toBe(0);
    expect(ids[21]).toBe(21);
  });

  test("Minor Arcana cards have IDs 22-77", async () => {
    const response = await app.handle(new Request("http://localhost/api/cards/arcana/minor"));
    expect(response.status).toBe(200);
    const cards = await response.json();
    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBe(56);
    const ids = cards.map((c: { id: number }) => c.id);
    expect(ids.every((id: number) => id >= 22 && id <= 77)).toBe(true);
  });

  test("Total card count is 78 via stats endpoint", async () => {
    const response = await app.handle(new Request("http://localhost/api/stats"));
    expect(response.status).toBe(200);
    const stats = await response.json();
    expect(stats.totalCards).toBe(78);
    expect(stats.majorArcana + stats.minorArcana).toBe(78);
  });

  test("Four suits have exactly 14 cards each", async () => {
    const suits = ["wands", "cups", "swords", "pentacles"];
    for (const suit of suits) {
      const response = await app.handle(new Request(`http://localhost/api/cards/suit/${suit}`));
      expect(response.status).toBe(200);
      const cards = await response.json();
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBe(14);
    }
  });
});
