import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import createApp from "../src/index";
import { seedDatabase } from "../src/db/seed";
import { unlinkSync, existsSync } from "fs";

const testDbPath = "/tmp/test-cards-filter.db";
let app: any;

beforeAll(() => {
  // Clean up if exists
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }

  // Seed the test database
  seedDatabase(testDbPath);

  // Create app with seeded database
  app = createApp(testDbPath);
});

afterAll(() => {
  // Clean up test database
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }
});

describe("GET /api/cards filter params", () => {
  it("returns all 78 cards when no params provided (no regression)", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.length).toBe(78);
  });

  it("filters by suit=wands", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?suit=wands"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.length).toBe(14);
    expect(data.every((card: any) => card.suit === "wands")).toBe(true);
  });

  it("filters by suit=cups", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?suit=cups"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.length).toBe(14);
    expect(data.every((card: any) => card.suit === "cups")).toBe(true);
  });

  it("filters by suit=swords", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?suit=swords"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.length).toBe(14);
    expect(data.every((card: any) => card.suit === "swords")).toBe(true);
  });

  it("filters by suit=pentacles", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?suit=pentacles"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.length).toBe(14);
    expect(data.every((card: any) => card.suit === "pentacles")).toBe(true);
  });

  it("returns 400 for invalid suit", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?suit=invalid"));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid suit. Must be one of: wands, cups, swords, pentacles" });
  });

  it("filters by arcana=major", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?arcana=major"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.length).toBe(22);
    expect(data.every((card: any) => card.arcana === "major")).toBe(true);
  });

  it("filters by arcana=minor", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?arcana=minor"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.length).toBe(56);
    expect(data.every((card: any) => card.arcana === "minor")).toBe(true);
  });

  it("returns 400 for invalid arcana", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?arcana=invalid"));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid arcana type. Use 'major' or 'minor'" });
  });

  it("combines suit=cups and arcana=minor", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?suit=cups&arcana=minor"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.length).toBe(14);
    expect(data.every((card: any) => card.suit === "cups" && card.arcana === "minor")).toBe(true);
  });

  it("limits results with limit=3", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?limit=3"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.length).toBe(3);
  });

  it("combines suit=wands and limit=2", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?suit=wands&limit=2"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.length).toBe(2);
    expect(data.every((card: any) => card.suit === "wands")).toBe(true);
  });

  it("returns 400 for limit=0", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?limit=0"));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid limit" });
  });

  it("returns 400 for limit=-1", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards?limit=-1"));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid limit" });
  });
});
