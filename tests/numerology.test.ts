import { describe, test, expect, beforeAll, afterAll } from "bun:test";

const baseUrl = "http://localhost:3000";
let server: ReturnType<typeof Bun.serve> | null = null;

beforeAll(async () => {
  // Server started by setup.ts — just wait for it
  await new Promise(resolve => setTimeout(resolve, 500));
});

describe("Card numerology", () => {
  test("Major Arcana cards 0-21 have numbers 0-21", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/major`);
    expect(response.status).toBe(200);
    const cards = await response.json();
    expect(cards).toBeArray();
    expect(cards.length).toBe(22);
    // All major arcana should have numeric IDs 0-21
    const ids = cards.map((c: { id: number }) => c.id).sort((a: number, b: number) => a - b);
    expect(ids[0]).toBe(0);
    expect(ids[21]).toBe(21);
  });

  test("Minor Arcana cards have IDs 22-77", async () => {
    const response = await fetch(`${baseUrl}/api/cards/arcana/minor`);
    expect(response.status).toBe(200);
    const cards = await response.json();
    expect(cards).toBeArray();
    expect(cards.length).toBe(56);
    const ids = cards.map((c: { id: number }) => c.id);
    expect(ids.every((id: number) => id >= 22 && id <= 77)).toBe(true);
  });

  test("Total card count is always 78", async () => {
    const response = await fetch(`${baseUrl}/api/stats`);
    expect(response.status).toBe(200);
    const stats = await response.json();
    expect(stats.totalCards).toBe(78);
    expect(stats.majorArcana + stats.minorArcana).toBe(78);
  });

  test("Four suits have equal card counts", async () => {
    const suits = ["wands", "cups", "swords", "pentacles"];
    const counts = await Promise.all(
      suits.map(async (suit) => {
        const response = await fetch(`${baseUrl}/api/cards/suit/${suit}`);
        const cards = await response.json();
        return cards.length;
      })
    );
    // All suits should have exactly 14 cards
    expect(counts.every(c => c === 14)).toBe(true);
  });
});
