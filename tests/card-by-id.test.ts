import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("GET /api/cards/:id", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3002";

    app.listen(3002);
  });

  afterAll(() => {
    app.stop();
  });

  test("Returns 200 with a valid card for id=1", async () => {
    const response = await fetch(`${baseUrl}/api/cards/1`);
    expect(response.status).toBe(200);

    const card = await response.json();
    expect(card).toBeDefined();
    expect(card.id).toBe(1);
  });

  test("Card has expected fields (id, name, arcana, suit, keywords)", async () => {
    const response = await fetch(`${baseUrl}/api/cards/1`);
    expect(response.status).toBe(200);

    const card = await response.json();
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("name");
    expect(card).toHaveProperty("arcana");
    expect(card).toHaveProperty("suit");
    expect(card).toHaveProperty("keywords");
    expect(Array.isArray(card.keywords)).toBe(true);
  });

  test("Returns 404 for id=999", async () => {
    const response = await fetch(`${baseUrl}/api/cards/999`);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toEqual({ error: "Card not found" });
  });

  test("Returns 400 for id=\"abc\"", async () => {
    const response = await fetch(`${baseUrl}/api/cards/abc`);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toEqual({ error: "Invalid id" });
  });
});
