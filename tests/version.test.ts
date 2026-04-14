import { describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { apiRoutes } from "../src/routes/api";

describe("GET /api/version", () => {
  // In-memory DB with the schema
  const db = new Database(":memory:");
  db.run(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      arcana TEXT,
      suit TEXT,
      number INTEGER,
      keywords TEXT,
      upright_meaning TEXT,
      reversed_meaning TEXT,
      element TEXT,
      planet TEXT,
      zodiac TEXT
    )
  `);
  // Insert 78 dummy cards to satisfy card_count assertion
  for (let i = 0; i < 78; i++) {
    db.run("INSERT INTO cards (id, name, arcana) VALUES (?, ?, ?)", [i, `Card ${i}`, "major"]);
  }

  const app = new Elysia().use(apiRoutes(db));

  test("returns 200 status", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/version")
    );
    expect(response.status).toBe(200);
  });

  test("returns JSON with version field", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/version")
    );
    const data = await response.json();
    expect(data).toHaveProperty("version");
    expect(typeof data.version).toBe("string");
  });

  test("returns JSON with api_name field", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/version")
    );
    const data = await response.json();
    expect(data).toHaveProperty("api_name");
    expect(data.api_name).toBe("Tarot API");
  });

  test("returns JSON with card_count field equal to 78", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/version")
    );
    const data = await response.json();
    expect(data).toHaveProperty("card_count");
    expect(data.card_count).toBe(78);
  });
});
