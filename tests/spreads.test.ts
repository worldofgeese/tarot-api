import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { apiRoutes } from "../src/routes/api";

describe("GET /spreads endpoint", () => {
  let app: Elysia;
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");

    // Create minimal cards table for API setup
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

    app = new Elysia().use(apiRoutes(db));
  });

  test("GET /api/spreads returns 200 status with JSON array", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads")
    );

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/spreads array contains Celtic Cross with 10 positions", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads")
    );

    const data = await response.json();
    
    const celticCross = data.find((spread: any) => spread.name === "Celtic Cross");
    expect(celticCross).toBeDefined();
    expect(celticCross.positions).toBe(10);
  });

  test("GET /api/spreads array has at least 4 spread types", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads")
    );

    const data = await response.json();
    expect(data.length).toBeGreaterThanOrEqual(4);
  });

  test("GET /api/spreads returns all required spreads with correct positions", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/spreads")
    );

    const data = await response.json();
    
    const expectedSpreads = [
      { name: "Celtic Cross", positions: 10 },
      { name: "Three Card", positions: 3 },
      { name: "Single Card", positions: 1 },
      { name: "Horseshoe", positions: 7 }
    ];

    expectedSpreads.forEach(expectedSpread => {
      const actualSpread = data.find((spread: any) => spread.name === expectedSpread.name);
      expect(actualSpread).toBeDefined();
      expect(actualSpread.positions).toBe(expectedSpread.positions);
    });
  });
});