import { describe, it, expect } from "bun:test";
import createApp from "../src/index";

const app = createApp(":memory:");

describe("GET /api/cards/element/:element", () => {
  it("returns 200 with 14 Wands cards for fire element", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/element/fire"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(14);
    data.forEach((card: any) => {
      expect(card.suit).toBe("wands");
    });
  });

  it("returns 200 with 14 Cups cards for water element", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/element/water"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(14);
    data.forEach((card: any) => {
      expect(card.suit).toBe("cups");
    });
  });

  it("returns 200 with 14 Swords cards for air element", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/element/air"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(14);
    data.forEach((card: any) => {
      expect(card.suit).toBe("swords");
    });
  });

  it("returns 200 with 14 Pentacles cards for earth element", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/element/earth"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(14);
    data.forEach((card: any) => {
      expect(card.suit).toBe("pentacles");
    });
  });

  it("returns 400 for invalid element", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/element/invalid"));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid element. Must be one of: fire, water, air, earth");
  });

  it("each card has required fields (id, name, suit, meanings)", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/element/fire"));
    const data = await res.json();
    expect(res.status).toBe(200);
    const card = data[0];
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("name");
    expect(card).toHaveProperty("suit");
    expect(card).toHaveProperty("upright_meaning");
    expect(card).toHaveProperty("reversed_meaning");
  });

  it("excludes Major Arcana cards (no cards with null/empty suit)", async () => {
    const res = await app.handle(new Request("http://localhost/api/cards/element/fire"));
    const data = await res.json();
    expect(res.status).toBe(200);
    data.forEach((card: any) => {
      expect(card.suit).not.toBe(null);
      expect(card.suit).not.toBe("");
      expect(card.suit).toBeTruthy();
    });
  });
});
