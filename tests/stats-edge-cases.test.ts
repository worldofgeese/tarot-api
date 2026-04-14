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

describe("Stats endpoint edge cases", () => {
  const app = makeApp();

  test("/api/stats sums correctly: major + minor = total", async () => {
    const response = await app.handle(new Request("http://localhost/api/stats"));
    expect(response.status).toBe(200);
    const stats = await response.json();
    expect(stats.totalCards).toBe(stats.majorArcana + stats.minorArcana);
  });

  test("/api/stats suits are the four valid suits", async () => {
    const response = await app.handle(new Request("http://localhost/api/stats"));
    expect(response.status).toBe(200);
    const stats = await response.json();
    const suits = stats.suits as string[];
    expect(suits).toBeArray();
    expect(suits).toContain("wands");
    expect(suits).toContain("cups");
    expect(suits).toContain("swords");
    expect(suits).toContain("pentacles");
  });

  test("/api/stats has required fields", async () => {
    const response = await app.handle(new Request("http://localhost/api/stats"));
    expect(response.status).toBe(200);
    const stats = await response.json();
    expect(stats).toHaveProperty("totalCards");
    expect(stats).toHaveProperty("majorArcana");
    expect(stats).toHaveProperty("minorArcana");
    expect(stats).toHaveProperty("suits");
    expect(stats.totalCards).toBe(78);
    expect(stats.majorArcana).toBe(22);
    expect(stats.minorArcana).toBe(56);
  });

  test("/api/health has required fields", async () => {
    const response = await app.handle(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    const health = await response.json();
    expect(health).toHaveProperty("status");
    expect(health.status).toBe("ok");
  });
});
