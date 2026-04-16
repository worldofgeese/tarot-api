import { describe, it, expect, beforeAll } from "bun:test";
import createApp from "../src/index";

describe("PUT /api/readings/:id", () => {
  const app = createApp(":memory:");
  let readingId: number;

  beforeAll(async () => {
    // Seed a reading to update
    const res = await app.handle(
      new Request("http://localhost/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread_type: "single", cards_json: "[0]", notes: "Original note" }),
      })
    );
    const data = await res.json() as { id: number };
    readingId = data.id;
  });

  it("returns 200 and updates notes only", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Updated note" }),
      })
    );
    const data = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(data.notes).toBe("Updated note");
    expect(data.spread_type).toBe("single"); // unchanged
  });

  it("returns 200 and updates spread_type only", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread_type: "three-card" }),
      })
    );
    const data = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(data.spread_type).toBe("three-card");
  });

  it("returns 200 and updates both fields", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Both updated", spread_type: "celtic-cross" }),
      })
    );
    const data = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(data.notes).toBe("Both updated");
    expect(data.spread_type).toBe("celtic-cross");
  });

  it("returns 404 if reading not found", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/readings/9999", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "x" }),
      })
    );
    const data = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(data.error).toBe("Reading not found");
  });

  it("returns 400 if id is non-integer", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/readings/abc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "x" }),
      })
    );
    const data = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid id");
  });

  it("returns 400 if spread_type is invalid", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread_type: "invalid" }),
      })
    );
    const data = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect((data.error as string)).toContain("Invalid spread_type");
  });

  it("returns 400 if notes exceed 2000 characters", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "x".repeat(2001) }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 if neither notes nor spread_type provided", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    const data = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(data.error).toContain("At least one field");
  });

  it("allows updating notes to empty string", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "" }),
      })
    );
    expect(res.status).toBe(200);
  });

  it("returns 400 if notes is not a string (malformed body)", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: 42 }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 if spread_type is not a string (malformed body)", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/readings/${readingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread_type: null }),
      })
    );
    expect(res.status).toBe(400);
  });
});

