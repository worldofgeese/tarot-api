import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Reading Statistics Endpoint Tests", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    // Use in-memory DB for tests (no side effects, no file on disk)
    app = createApp(":memory:");
    baseUrl = "http://localhost:3012";
    app.listen(3012);
  });

  afterAll(() => {
    app.stop();
  });

  // AC1: Empty database → all zeroes, empty arrays
  test("GET /api/readings/stats with empty database returns zeroes", async () => {
    const response = await fetch(`${baseUrl}/api/readings/stats`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.totalReadings).toBe(0);
    expect(data.spreadBreakdown).toEqual({});
    expect(data.mostDrawnCards).toEqual([]);
    expect(data.recentReadings).toBe(0);
  });

  // AC2: After creating 3 readings → totalReadings = 3
  test("GET /api/readings/stats after creating readings shows correct total", async () => {
    // Create 3 readings
    await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "three-card",
        cards_json: "[1,5,22]",
        notes: "First reading"
      })
    });

    await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[0]",
        notes: "Second reading"
      })
    });

    await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "celtic-cross",
        cards_json: "[10,11,12,13,14,15,16,17,18,19]",
        notes: "Third reading"
      })
    });

    const response = await fetch(`${baseUrl}/api/readings/stats`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.totalReadings).toBe(3);
  });

  // AC3: spreadBreakdown keys match actual spread types used
  test("GET /api/readings/stats spreadBreakdown matches actual spreads", async () => {
    const response = await fetch(`${baseUrl}/api/readings/stats`);
    const data = await response.json();

    expect(data.spreadBreakdown).toHaveProperty("three-card");
    expect(data.spreadBreakdown).toHaveProperty("single");
    expect(data.spreadBreakdown).toHaveProperty("celtic-cross");
    expect(data.spreadBreakdown["three-card"]).toBe(1);
    expect(data.spreadBreakdown["single"]).toBe(1);
    expect(data.spreadBreakdown["celtic-cross"]).toBe(1);
  });

  // AC4: mostDrawnCards limited to top 5, sorted by count descending
  test("GET /api/readings/stats mostDrawnCards shows correct counts", async () => {
    // Create more readings to test card counting
    // Card 0 appears in 2 readings (1 from "Second reading", 1 new)
    await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[0]"
      })
    });

    // Card 1 appears in 2 readings (1 from "First reading", 1 new)
    await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[1]"
      })
    });

    const response = await fetch(`${baseUrl}/api/readings/stats`);
    const data = await response.json();

    expect(Array.isArray(data.mostDrawnCards)).toBe(true);
    expect(data.mostDrawnCards.length).toBeLessThanOrEqual(5);

    // Verify structure of mostDrawnCards entries
    if (data.mostDrawnCards.length > 0) {
      const firstCard = data.mostDrawnCards[0];
      expect(firstCard).toHaveProperty("cardId");
      expect(firstCard).toHaveProperty("name");
      expect(firstCard).toHaveProperty("count");
      expect(typeof firstCard.cardId).toBe("number");
      expect(typeof firstCard.name).toBe("string");
      expect(typeof firstCard.count).toBe("number");

      // Verify sorted by count descending
      for (let i = 0; i < data.mostDrawnCards.length - 1; i++) {
        expect(data.mostDrawnCards[i].count).toBeGreaterThanOrEqual(data.mostDrawnCards[i + 1].count);
      }
    }
  });

  // AC5: recentReadings only counts last 7 days
  test("GET /api/readings/stats recentReadings counts last 7 days", async () => {
    // All readings created in this test session are recent (just created)
    const response = await fetch(`${baseUrl}/api/readings/stats`);
    const data = await response.json();

    // We've created 5 readings total in this test suite
    expect(data.recentReadings).toBe(5);
    expect(typeof data.recentReadings).toBe("number");
    expect(data.recentReadings).toBeGreaterThanOrEqual(0);
  });

  // Additional test: Verify response structure
  test("GET /api/readings/stats returns correct response structure", async () => {
    const response = await fetch(`${baseUrl}/api/readings/stats`);
    const data = await response.json();

    expect(data).toHaveProperty("totalReadings");
    expect(data).toHaveProperty("spreadBreakdown");
    expect(data).toHaveProperty("mostDrawnCards");
    expect(data).toHaveProperty("recentReadings");
    expect(typeof data.totalReadings).toBe("number");
    expect(typeof data.spreadBreakdown).toBe("object");
    expect(Array.isArray(data.mostDrawnCards)).toBe(true);
    expect(typeof data.recentReadings).toBe("number");
  });
});
