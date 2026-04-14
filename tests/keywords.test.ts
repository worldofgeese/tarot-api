import { describe, test, expect } from "bun:test";
import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { apiRoutes } from "../src/routes/api";

// TDD: RED phase — these tests are written BEFORE the endpoint exists.
// They will fail until /api/cards/keywords is implemented.

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

describe("GET /api/cards/keywords", () => {
  const app = makeApp();

  test("returns 200 with keywords array", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("keywords");
    expect(Array.isArray(body.keywords)).toBe(true);
  });

  test("keywords are sorted alphabetically", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords"));
    const { keywords } = await res.json();
    const sorted = [...keywords].sort();
    expect(keywords).toEqual(sorted);
  });

  test("keywords are unique (no duplicates)", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords"));
    const { keywords } = await res.json();
    const unique = [...new Set(keywords)];
    expect(keywords.length).toBe(unique.length);
  });

  test("returns a substantial keyword list (at least 50)", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/keywords"));
    const { keywords } = await res.json();
    expect(keywords.length).toBeGreaterThan(50);
  });
});
