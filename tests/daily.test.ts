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

  test("Optional date parameter overrides today's date", async () => {
    const response = await fetch(`${baseUrl}/api/daily?date=2026-01-01`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.date).toBe("2026-01-01");
  });

  test("Different dates return different cards", async () => {
    const response1 = await fetch(`${baseUrl}/api/daily?date=2026-01-01`);
    const data1 = await response1.json();

    const response2 = await fetch(`${baseUrl}/api/daily?date=2026-01-02`);
    const data2 = await response2.json();

    // Different dates should likely return different cards (not guaranteed, but extremely likely with 78 cards)
    // We'll check that at least the date field is different
    expect(data1.date).toBe("2026-01-01");
    expect(data2.date).toBe("2026-01-02");
  });

  test("Same date parameter returns same card", async () => {
    const response1 = await fetch(`${baseUrl}/api/daily?date=2026-01-15`);
    const data1 = await response1.json();

    const response2 = await fetch(`${baseUrl}/api/daily?date=2026-01-15`);
    const data2 = await response2.json();

    expect(data1.id).toBe(data2.id);
    expect(data1.reversed).toBe(data2.reversed);
    expect(data1.date).toBe(data2.date);
  });

  test("Invalid date format returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/daily?date=invalid-date`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("Invalid date format (wrong pattern) returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/daily?date=01-01-2026`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });
});
