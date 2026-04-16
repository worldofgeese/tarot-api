import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("GET /api/cards/numerology/:number", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    // Use real DB with seeded data for tests
    app = createApp();
    baseUrl = "http://localhost:3003";
    app.listen(3003);
  });

  afterAll(() => {
    app.stop();
  });

  test("GET /api/cards/numerology/1 returns 200 with cards having number=1", async () => {
    const response = await fetch(`${baseUrl}/api/cards/numerology/1`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    // Should include The Magician (number=1) and Aces (number=1)
    expect(data.length).toBeGreaterThan(0);
    data.forEach((card: any) => {
      expect(card.number).toBe(1);
    });
  });

  test("GET /api/cards/numerology/0 returns 200 with The Fool", async () => {
    const response = await fetch(`${baseUrl}/api/cards/numerology/0`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    data.forEach((card: any) => {
      expect(card.number).toBe(0);
    });
  });

  test("GET /api/cards/numerology/99 returns 200 with empty array", async () => {
    const response = await fetch(`${baseUrl}/api/cards/numerology/99`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  test("GET /api/cards/numerology/abc returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/cards/numerology/abc`);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("GET /api/cards/numerology/-1 returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/cards/numerology/-1`);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });
});
