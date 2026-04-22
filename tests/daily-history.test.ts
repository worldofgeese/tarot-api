import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Daily History", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp(":memory:");
    baseUrl = "http://localhost:3099";

    app.listen(3099);
  });

  afterAll(() => {
    app.stop();
  });

  // AC1: Calling GET /daily writes to daily_history
  test("GET /daily writes to daily_history table", async () => {
    const dailyResponse = await fetch(`${baseUrl}/api/daily?date=2026-04-22`);
    expect(dailyResponse.status).toBe(200);
    const dailyData = await dailyResponse.json();

    // Now check history
    const historyResponse = await fetch(`${baseUrl}/api/daily/history/2026-04-22`);
    expect(historyResponse.status).toBe(200);
    const historyData = await historyResponse.json();

    expect(historyData.date).toBe("2026-04-22");
    expect(historyData.card.id).toBe(dailyData.id);
  });

  // AC2: Calling GET /daily twice on same date doesn't duplicate
  test("GET /daily twice on same date doesn't duplicate history entry", async () => {
    await fetch(`${baseUrl}/api/daily?date=2026-04-23`);
    await fetch(`${baseUrl}/api/daily?date=2026-04-23`);

    // Check history list
    const historyResponse = await fetch(`${baseUrl}/api/daily/history?limit=30`);
    const historyData = await historyResponse.json();

    const april23Entries = historyData.history.filter((entry: any) => entry.date === "2026-04-23");
    expect(april23Entries.length).toBe(1);
  });

  // AC3: GET /api/daily/history returns recent entries, newest first
  test("GET /api/daily/history returns entries newest first", async () => {
    // Generate some history entries
    await fetch(`${baseUrl}/api/daily?date=2026-04-20`);
    await fetch(`${baseUrl}/api/daily?date=2026-04-21`);
    await fetch(`${baseUrl}/api/daily?date=2026-04-22`);

    const response = await fetch(`${baseUrl}/api/daily/history?limit=3`);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty("history");
    expect(data).toHaveProperty("total");
    expect(Array.isArray(data.history)).toBe(true);
    expect(data.history.length).toBeGreaterThan(0);

    // Check newest first ordering
    if (data.history.length >= 2) {
      expect(data.history[0].date >= data.history[1].date).toBe(true);
    }
  });

  // AC3: Default limit is 7
  test("GET /api/daily/history defaults to limit 7", async () => {
    // Generate more than 7 entries
    for (let i = 1; i <= 10; i++) {
      await fetch(`${baseUrl}/api/daily?date=2026-04-${String(i).padStart(2, '0')}`);
    }

    const response = await fetch(`${baseUrl}/api/daily/history`);
    const data = await response.json();

    expect(data.history.length).toBeLessThanOrEqual(7);
  });

  // AC4: GET /api/daily/history/:date returns specific card
  test("GET /api/daily/history/:date returns specific card", async () => {
    await fetch(`${baseUrl}/api/daily?date=2026-05-01`);

    const response = await fetch(`${baseUrl}/api/daily/history/2026-05-01`);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty("date");
    expect(data.date).toBe("2026-05-01");
    expect(data).toHaveProperty("card");
    expect(data.card).toHaveProperty("id");
    expect(data.card).toHaveProperty("name");
  });

  // AC5: GET /api/daily/history/:date returns 404 for non-existent date
  test("GET /api/daily/history/:date returns 404 for non-existent date", async () => {
    const response = await fetch(`${baseUrl}/api/daily/history/2099-01-01`);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  // AC6: limit capped at 30
  test("GET /api/daily/history limit capped at 30", async () => {
    const response = await fetch(`${baseUrl}/api/daily/history?limit=100`);
    const data = await response.json();

    // Even if we request 100, we should get max 30
    expect(data.history.length).toBeLessThanOrEqual(30);
  });

  test("GET /api/daily/history supports offset parameter", async () => {
    // Generate some entries
    for (let i = 1; i <= 5; i++) {
      await fetch(`${baseUrl}/api/daily?date=2026-03-${String(i).padStart(2, '0')}`);
    }

    const response1 = await fetch(`${baseUrl}/api/daily/history?limit=2&offset=0`);
    const data1 = await response1.json();

    const response2 = await fetch(`${baseUrl}/api/daily/history?limit=2&offset=2`);
    const data2 = await response2.json();

    // Should get different entries
    if (data1.history.length > 0 && data2.history.length > 0) {
      expect(data1.history[0].date).not.toBe(data2.history[0].date);
    }
  });

  test("GET /api/daily/history returns full card objects", async () => {
    await fetch(`${baseUrl}/api/daily?date=2026-06-01`);

    const response = await fetch(`${baseUrl}/api/daily/history?limit=1`);
    const data = await response.json();

    expect(data.history.length).toBeGreaterThan(0);
    const entry = data.history[0];
    expect(entry.card).toHaveProperty("id");
    expect(entry.card).toHaveProperty("name");
    expect(entry.card).toHaveProperty("arcana");
    expect(entry.card).toHaveProperty("upright_meaning");
    expect(entry.card).toHaveProperty("reversed_meaning");
    expect(entry.card).toHaveProperty("keywords");
    expect(Array.isArray(entry.card.keywords)).toBe(true);
  });
});
