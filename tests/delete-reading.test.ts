import { describe, it, expect, beforeAll } from "bun:test";
import createApp from "../src/index";

describe("DELETE /api/readings/:id", () => {
  const app = createApp(":memory:");
  let readingId: number;

  beforeAll(async () => {
    const res = await app.handle(
      new Request("http://localhost/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread_type: "single", cards_json: "[0]", notes: "to delete" }),
      })
    );
    const data = await res.json() as { id: number };
    readingId = data.id;
  });

  it("returns 204 on successful delete", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`, { method: "DELETE" })
    );
    expect(res.status).toBe(204);
  });

  it("returns 404 after deletion when getting the reading", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`)
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 if reading does not exist", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/readings/9999", { method: "DELETE" })
    );
    const data = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(data.error).toBe("Reading not found");
  });

  it("returns 400 for non-integer id", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/readings/abc", { method: "DELETE" })
    );
    const data = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid id");
  });

  it("returns 400 for negative id", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/readings/-1", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
  });
});
