import { describe, it, expect } from "bun:test";
import createApp from "../src/index";

describe("GET /api/cards/random (filter-aware)", () => {
  const app = createApp(":memory:");

  it("returns any random card when no filters", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/random"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("name");
  });

  it("returns random wands card when suit=wands", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/random?suit=wands"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.suit).toBe("wands");
  });

  it("returns random major arcana card when arcana=major", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/random?arcana=major"));
    const data = await res.json();
    expect(res.status).toBe(200);
    // Major arcana has null or empty suit
    expect(data.suit === null || data.suit === "").toBe(true);
  });

  it("returns random cups minor arcana card when suit=cups&arcana=minor", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/random?suit=cups&arcana=minor"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.suit).toBe("cups");
  });

  it("returns 400 for invalid suit", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/random?suit=invalid"));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid suit. Must be one of: wands, cups, swords, pentacles");
  });

  it("returns 400 for invalid arcana", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/random?arcana=invalid"));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid arcana type. Use 'major' or 'minor'");
  });

  it("returns 404 when no cards match filters (suit=wands&arcana=major)", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/random?suit=wands&arcana=major"));
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("No cards match the given filters");
  });
});

describe("GET /api/cards/filter (listing companion)", () => {
  const app = createApp(":memory:");

  it("returns all wands cards when suit=wands", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=wands"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(14); // 14 cards per suit
    expect(data.every((card: any) => card.suit === "wands")).toBe(true);
  });

  it("returns all major arcana cards when arcana=major", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/filter?arcana=major"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(22); // 22 major arcana
    expect(data.every((card: any) => card.suit === null || card.suit === "")).toBe(true);
  });

  it("returns limited cards when limit param provided", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/filter?limit=3"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
  });

  it("returns 400 for invalid suit", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=invalid"));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid suit. Must be one of: wands, cups, swords, pentacles");
  });

  it("returns 400 for invalid arcana", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/filter?arcana=invalid"));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid arcana type. Use 'major' or 'minor'");
  });

  it("returns empty array when no cards match filters", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=wands&arcana=major"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });
});
