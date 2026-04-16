import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("GET /api/cards/:id/reversal", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    // Use real DB with seeded data for tests
    app = createApp();
    baseUrl = "http://localhost:3004";
    app.listen(3004);
  });

  afterAll(() => {
    app.stop();
  });

  test("GET /api/cards/0/reversal returns 200 with reversed meaning", async () => {
    const response = await fetch(`${baseUrl}/api/cards/0/reversal`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("reversed");
    expect(data.id).toBe(0);
    expect(data.name).toBe("The Fool");
    expect(typeof data.reversed).toBe("string");
    expect(data.reversed.length).toBeGreaterThan(0);
  });

  test("GET /api/cards/999/reversal returns 404", async () => {
    const response = await fetch(`${baseUrl}/api/cards/999/reversal`);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "Card not found" });
  });

  test("GET /api/cards/abc/reversal returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/cards/abc/reversal`);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Invalid id" });
  });
});
