import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Stats Endpoint Tests", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3003";

    // Start server on test port
    app.listen(3003);
  });

  afterAll(() => {
    app.stop();
  });

  test("GET /api/stats returns 200 status", async () => {
    const response = await fetch(`${baseUrl}/api/stats`);
    expect(response.status).toBe(200);
  });

  test("GET /api/stats returns totalCards of 78", async () => {
    const response = await fetch(`${baseUrl}/api/stats`);
    const data = await response.json();
    expect(data.totalCards).toBe(78);
  });

  test("GET /api/stats majorArcana + minorArcana equals totalCards", async () => {
    const response = await fetch(`${baseUrl}/api/stats`);
    const data = await response.json();
    expect(data.majorArcana + data.minorArcana).toBe(data.totalCards);
  });

  test("GET /api/stats suits array contains exactly 4 items", async () => {
    const response = await fetch(`${baseUrl}/api/stats`);
    const data = await response.json();
    expect(data.suits).toBeArray();
    expect(data.suits.length).toBe(4);
  });
});
