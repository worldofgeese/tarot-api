import { describe, test, expect, beforeAll } from "bun:test";
import { Database } from "bun:sqlite";
import cards from "../data/cards.json";

describe("Card Data Integrity", () => {
  test("should have exactly 78 cards", () => {
    expect(cards.length).toBe(78);
  });

  test("should have 22 Major Arcana cards", () => {
    const majorArcana = cards.filter(c => c.arcana === "major");
    expect(majorArcana.length).toBe(22);
  });

  test("should have 14 cards per minor suit", () => {
    const suits = ["wands", "cups", "swords", "pentacles"];
    suits.forEach(suit => {
      const suitCards = cards.filter(c => c.suit === suit);
      expect(suitCards.length).toBe(14);
    });
  });

  test("should have no null values in required fields", () => {
    cards.forEach(card => {
      expect(card.id).toBeDefined();
      expect(card.name).toBeDefined();
      expect(card.arcana).toBeDefined();
      expect(card.upright_meaning).toBeDefined();
      expect(card.reversed_meaning).toBeDefined();
      expect(card.keywords).toBeDefined();
      expect(card.keywords.length).toBeGreaterThan(0);
      expect(card.image_desc).toBeDefined();
    });
  });
});

describe("Spread Logic", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE cards (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        arcana TEXT NOT NULL,
        suit TEXT,
        number INTEGER,
        upright_meaning TEXT NOT NULL,
        reversed_meaning TEXT NOT NULL,
        keywords TEXT NOT NULL,
        image_desc TEXT NOT NULL
      )
    `);

    const insert = db.prepare(`
      INSERT INTO cards (id, name, arcana, suit, number, upright_meaning, reversed_meaning, keywords, image_desc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    cards.forEach(card => {
      insert.run(
        card.id,
        card.name,
        card.arcana,
        card.suit,
        card.number,
        card.upright_meaning,
        card.reversed_meaning,
        JSON.stringify(card.keywords),
        card.image_desc
      );
    });
  });

  test("3-card spread returns exactly 3 unique cards", () => {
    const query = db.query("SELECT * FROM cards ORDER BY RANDOM() LIMIT 3");
    const spread = query.all();
    expect(spread.length).toBe(3);

    const ids = spread.map((c: any) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  test("Celtic cross spread returns exactly 10 unique cards", () => {
    const query = db.query("SELECT * FROM cards ORDER BY RANDOM() LIMIT 10");
    const spread = query.all();
    expect(spread.length).toBe(10);

    const ids = spread.map((c: any) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });
});

describe("Search and Filtering", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE cards (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        arcana TEXT NOT NULL,
        suit TEXT,
        number INTEGER,
        upright_meaning TEXT NOT NULL,
        reversed_meaning TEXT NOT NULL,
        keywords TEXT NOT NULL,
        image_desc TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE VIRTUAL TABLE cards_fts USING fts5(
        name, upright_meaning, reversed_meaning, keywords,
        content=cards,
        content_rowid=id
      )
    `);

    const insert = db.prepare(`
      INSERT INTO cards (id, name, arcana, suit, number, upright_meaning, reversed_meaning, keywords, image_desc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    cards.forEach(card => {
      insert.run(
        card.id,
        card.name,
        card.arcana,
        card.suit,
        card.number,
        card.upright_meaning,
        card.reversed_meaning,
        JSON.stringify(card.keywords),
        card.image_desc
      );
    });

    db.exec(`
      INSERT INTO cards_fts(cards_fts, rank) VALUES('rebuild', 0)
    `);
  });

  test("search for 'death' returns Death card", () => {
    const query = db.query(`
      SELECT c.* FROM cards c
      JOIN cards_fts fts ON c.id = fts.rowid
      WHERE cards_fts MATCH ?
    `);
    const results = query.all("death");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((c: any) => c.name === "Death")).toBe(true);
  });

  test("search for 'love' returns relevant cards", () => {
    const query = db.query(`
      SELECT c.* FROM cards c
      JOIN cards_fts fts ON c.id = fts.rowid
      WHERE cards_fts MATCH ?
    `);
    const results = query.all("love");
    expect(results.length).toBeGreaterThan(0);
  });

  test("pagination works correctly", () => {
    const query = db.query("SELECT * FROM cards LIMIT ? OFFSET ?");
    const page1 = query.all(10, 0);
    const page2 = query.all(10, 10);

    expect(page1.length).toBe(10);
    expect(page2.length).toBe(10);
    expect((page1[0] as any).id).not.toBe((page2[0] as any).id);
  });

  test("filter by arcana=major returns 22 cards", () => {
    const query = db.query("SELECT * FROM cards WHERE arcana = ?");
    const results = query.all("major");
    expect(results.length).toBe(22);
  });

  test("filter by suit=cups returns 14 cards", () => {
    const query = db.query("SELECT * FROM cards WHERE suit = ?");
    const results = query.all("cups");
    expect(results.length).toBe(14);
  });
});
