import { describe, it, expect } from "bun:test";
import createApp from "../src/index";

const app = createApp(":memory:");

describe("GET /api/cards/filter", () => {
  describe("suit filtering", () => {
    it("returns only wands cards with ?suit=wands", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=wands"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(14);
      expect(data.every((c: any) => c.suit === "wands")).toBe(true);
    });

    it("returns only cups cards with ?suit=cups", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=cups"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(14);
      expect(data.every((c: any) => c.suit === "cups")).toBe(true);
    });

    it("returns only swords cards with ?suit=swords", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=swords"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(14);
      expect(data.every((c: any) => c.suit === "swords")).toBe(true);
    });

    it("returns only pentacles cards with ?suit=pentacles", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=pentacles"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(14);
      expect(data.every((c: any) => c.suit === "pentacles")).toBe(true);
    });

    it("returns 400 with invalid suit", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=invalid"));
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data).toEqual({ error: "Invalid suit. Must be one of: wands, cups, swords, pentacles" });
    });
  });

  describe("arcana filtering", () => {
    it("returns only major arcana cards with ?arcana=major", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?arcana=major"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(22);
      expect(data.every((c: any) => c.arcana === "major")).toBe(true);
    });

    it("returns only minor arcana cards with ?arcana=minor", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?arcana=minor"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(56);
      expect(data.every((c: any) => c.arcana === "minor")).toBe(true);
    });

    it("returns 400 with invalid arcana type", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?arcana=invalid"));
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data).toEqual({ error: "Invalid arcana type. Use 'major' or 'minor'" });
    });
  });

  describe("combined filtering", () => {
    it("returns cups minor arcana with ?suit=cups&arcana=minor", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=cups&arcana=minor"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(14);
      expect(data.every((c: any) => c.suit === "cups" && c.arcana === "minor")).toBe(true);
    });

    it("returns wands minor arcana with ?suit=wands&arcana=minor", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=wands&arcana=minor"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(14);
      expect(data.every((c: any) => c.suit === "wands" && c.arcana === "minor")).toBe(true);
    });
  });

  describe("limit filtering", () => {
    it("returns first 3 cards with ?limit=3", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?limit=3"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(3);
    });

    it("returns first 2 wands cards with ?suit=wands&limit=2", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?suit=wands&limit=2"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(2);
      expect(data.every((c: any) => c.suit === "wands")).toBe(true);
    });

    it("returns first card with ?limit=1", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?limit=1"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(1);
    });

    it("returns 400 with limit=0", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?limit=0"));
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data).toEqual({ error: "Invalid limit" });
    });

    it("returns 400 with negative limit", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter?limit=-1"));
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data).toEqual({ error: "Invalid limit" });
    });
  });

  describe("no filters", () => {
    it("returns all 78 cards with no query params", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards/filter"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(78);
    });
  });

  describe("existing /api/cards endpoint unchanged", () => {
    it("GET /api/cards still returns all 78 cards", async () => {
      const res = await app.handle(new Request("http://localhost/api/cards"));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(78);
    });
  });
});
