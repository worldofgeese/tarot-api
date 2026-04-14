import { describe, test, expect } from "bun:test";
import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { apiRoutes } from "../src/routes/api";

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

describe("API input validation edge cases", () => {
  const app = makeApp();

  test("GET /api/cards/99 returns 404 for out-of-range id", async () => {
    const response = await app.handle(new Request("http://localhost/api/cards/99"));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/cards/-1 returns 400 for negative id", async () => {
    const response = await app.handle(new Request("http://localhost/api/cards/-1"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/cards/abc returns 400 for non-numeric id", async () => {
    const response = await app.handle(new Request("http://localhost/api/cards/abc"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/cards/element/invalid returns 400", async () => {
    const response = await app.handle(new Request("http://localhost/api/cards/element/lightning"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/cards/arcana/invalid returns 400", async () => {
    const response = await app.handle(new Request("http://localhost/api/cards/arcana/both"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/cards/suit/invalid returns 404 (no cards found)", async () => {
    const response = await app.handle(new Request("http://localhost/api/cards/suit/daggers"));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/meaning/99 returns 404 for out-of-range id", async () => {
    const response = await app.handle(new Request("http://localhost/api/meaning/99"));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/spreads/nonexistent returns 404", async () => {
    const response = await app.handle(new Request("http://localhost/api/spreads/nonexistent-spread"));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});
