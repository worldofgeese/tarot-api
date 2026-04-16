import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("PUT /api/readings/:id", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp(":memory:");
    baseUrl = "http://localhost:3003";
    app.listen(3003);
  });

  afterAll(() => {
    app.stop();
  });

  test("returns 200 and updates notes only", async () => {
    // Seed a reading first
    const createRes = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[1, 2, 3]",
        notes: "Original notes"
      })
    });
    const created = await createRes.json();
    const readingId = created.id;

    // Update notes
    const res = await fetch(`${baseUrl}/api/readings/${readingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: "Updated notes"
      })
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.notes).toBe("Updated notes");
    expect(data.spread_type).toBe("single"); // unchanged
    expect(data.cards_json).toBe("[1, 2, 3]"); // unchanged
  });

  test("returns 200 and updates spread_type only", async () => {
    // Seed a reading
    const createRes = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[4, 5]",
        notes: "Some notes"
      })
    });
    const created = await createRes.json();
    const readingId = created.id;

    // Update spread_type
    const res = await fetch(`${baseUrl}/api/readings/${readingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "three-card"
      })
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.spread_type).toBe("three-card");
    expect(data.notes).toBe("Some notes"); // unchanged
    expect(data.cards_json).toBe("[4, 5]"); // unchanged
  });

  test("returns 200 and updates both notes and spread_type", async () => {
    // Seed a reading
    const createRes = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[10]",
        notes: "Old"
      })
    });
    const created = await createRes.json();
    const readingId = created.id;

    // Update both
    const res = await fetch(`${baseUrl}/api/readings/${readingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "celtic-cross",
        notes: "New"
      })
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.spread_type).toBe("celtic-cross");
    expect(data.notes).toBe("New");
  });

  test("returns 400 if spread_type is invalid", async () => {
    // Seed a reading
    const createRes = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[1]",
      })
    });
    const created = await createRes.json();
    const readingId = created.id;

    // Try invalid spread_type
    const res = await fetch(`${baseUrl}/api/readings/${readingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "invalid-spread"
      })
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid spread_type. Must be one of: single, three-card, celtic-cross, custom");
  });

  test("returns 400 if notes exceed 2000 characters", async () => {
    // Seed a reading
    const createRes = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[1]",
      })
    });
    const created = await createRes.json();
    const readingId = created.id;

    // Try notes > 2000 chars
    const longNotes = "a".repeat(2001);
    const res = await fetch(`${baseUrl}/api/readings/${readingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: longNotes
      })
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("notes must be 2000 characters or less");
  });

  test("returns 404 if reading not found", async () => {
    const res = await fetch(`${baseUrl}/api/readings/99999`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: "Test"
      })
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Reading not found");
  });

  test("returns 400 if id is non-integer", async () => {
    const res = await fetch(`${baseUrl}/api/readings/abc`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: "Test"
      })
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid id");
  });

  test("returns 400 if neither notes nor spread_type provided", async () => {
    // Seed a reading
    const createRes = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[1]",
      })
    });
    const created = await createRes.json();
    const readingId = created.id;

    // Try empty body
    const res = await fetch(`${baseUrl}/api/readings/${readingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("At least one field (notes or spread_type) is required");
  });

  test("allows updating notes to empty string", async () => {
    // Seed a reading with notes
    const createRes = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spread_type: "single",
        cards_json: "[1]",
        notes: "Some notes"
      })
    });
    const created = await createRes.json();
    const readingId = created.id;

    // Update notes to empty string
    const res = await fetch(`${baseUrl}/api/readings/${readingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: ""
      })
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.notes).toBe("");
  });
});
