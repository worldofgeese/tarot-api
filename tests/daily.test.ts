import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("GET /api/daily", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3003";

    app.listen(3003);
  });

  afterAll(() => {
    app.stop();
  });

  test("Returns 200", async () => {
    const response = await fetch(`${baseUrl}/api/daily`);
    expect(response.status).toBe(200);
  });

  test("Response has id, name, keywords (array), date, reversed fields", async () => {
    const response = await fetch(`${baseUrl}/api/daily`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("keywords");
    expect(data).toHaveProperty("date");
    expect(data).toHaveProperty("reversed");
    expect(Array.isArray(data.keywords)).toBe(true);
  });

  test("Two requests on the same day return the same card", async () => {
    const response1 = await fetch(`${baseUrl}/api/daily`);
    const data1 = await response1.json();

    const response2 = await fetch(`${baseUrl}/api/daily`);
    const data2 = await response2.json();

    expect(data1.id).toBe(data2.id);
    expect(data1.reversed).toBe(data2.reversed);
    expect(data1.date).toBe(data2.date);
  });

  test("The date field matches today's UTC date", async () => {
    const response = await fetch(`${baseUrl}/api/daily`);
    const data = await response.json();

    const today = new Date().toISOString().split("T")[0];
    expect(data.date).toBe(today);
  });

  test("reversed is a boolean", async () => {
    const response = await fetch(`${baseUrl}/api/daily`);
    const data = await response.json();

    expect(typeof data.reversed).toBe("boolean");
  });

  test("Card is a valid card (id between 0 and 77)", async () => {
    const response = await fetch(`${baseUrl}/api/daily`);
    const data = await response.json();

    expect(data.id).toBeGreaterThanOrEqual(0);
    expect(data.id).toBeLessThanOrEqual(77);
  });
});
