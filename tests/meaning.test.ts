import { describe, test, expect } from "bun:test";
import createApp from "../src/index";

const app = createApp();

describe("GET /api/meaning/:id", () => {
  test("returns upright and reversed meanings for a valid card", async () => {
    const res = await app.handle(new Request("http://localhost/api/meaning/1"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("id", 1);
    expect(body).toHaveProperty("name");
    expect(body).toHaveProperty("upright");
    expect(body).toHaveProperty("reversed");
    expect(typeof body.upright).toBe("string");
    expect(typeof body.reversed).toBe("string");
  });

  test("returns 404 for non-existent card id", async () => {
    const res = await app.handle(new Request("http://localhost/api/meaning/9999"));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Card not found");
  });

  test("returns 400 for invalid card id", async () => {
    const res = await app.handle(new Request("http://localhost/api/meaning/abc"));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("returns 200 for card id 0 (The Fool)", async () => {
    const res = await app.handle(new Request("http://localhost/api/meaning/0"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("name", "The Fool");
    expect(body).toHaveProperty("upright");
    expect(body).toHaveProperty("reversed");
  });

  test("response does not leak internal column names", async () => {
    const res = await app.handle(new Request("http://localhost/api/meaning/1"));
    const body = await res.json();

    expect(body).not.toHaveProperty("upright_meaning");
    expect(body).not.toHaveProperty("reversed_meaning");
  });
});
