import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Cards by Arcana Endpoint Tests", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3004";

    // Start server on test port
    app.listen(3004);
  });

  afterAll(() => {
    app.stop();
  });

  test("GET /api/cards/arcana/major returns 200 status", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/major`);
    expect(response.status).toBe(200);
  });

  test("GET /api/cards/arcana/major returns exactly 22 cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/major`);
    const data = await response.json();
    expect(data).toBeArray();
    expect(data.length).toBe(22);
  });

  test("GET /api/cards/arcana/minor returns 200 status", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/minor`);
    expect(response.status).toBe(200);
  });

  test("GET /api/cards/arcana/minor returns exactly 56 cards", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/minor`);
    const data = await response.json();
    expect(data).toBeArray();
    expect(data.length).toBe(56);
  });

  test("GET /api/cards/arcana/Major (uppercase) works same as lowercase", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/Major`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.length).toBe(22);
  });

  test("GET /api/cards/arcana/MINOR (uppercase) works same as lowercase", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/MINOR`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.length).toBe(56);
  });

  test("GET /api/cards/arcana/MiXeD (mixed case) works correctly", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/MaJoR`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.length).toBe(22);
  });

  test("GET /api/cards/arcana/invalid returns 404 status", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/invalid`);
    expect(response.status).toBe(404);
  });

  test("GET /api/cards/arcana/invalid returns error message", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/invalid`);
    const data = await response.json();
    expect(data.error).toBe("Invalid arcana type. Use 'major' or 'minor'");
  });

  test("GET /api/cards/arcana/major - all cards have null or empty suit", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/major`);
    const data = await response.json();

    for (const card of data) {
      expect(card.suit === null || card.suit === "").toBe(true);
    }
  });

  test("GET /api/cards/arcana/minor - all cards have non-null, non-empty suit", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/minor`);
    const data = await response.json();

    for (const card of data) {
      expect(card.suit).toBeTruthy();
      expect(card.suit).not.toBe("");
    }
  });

  test("GET /api/cards/arcana/major - cards have parsed keywords array", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/major`);
    const data = await response.json();

    expect(data[0].keywords).toBeArray();
  });

  test("GET /api/cards/arcana/minor - cards have parsed keywords array", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/minor`);
    const data = await response.json();

    expect(data[0].keywords).toBeArray();
  });
});
