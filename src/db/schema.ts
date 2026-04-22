import { Database } from "bun:sqlite";
import cards from "../../data/cards.json";

export function initDatabase(dbPath: string = "data/tarot.db"): Database {
  const db = new Database(dbPath);

  // Create cards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
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

  // Create FTS5 virtual table for full-text search
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
      name, upright_meaning, reversed_meaning, keywords,
      content=cards,
      content_rowid=id
    )
  `);

  // Create triggers to keep FTS table in sync
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cards_ai AFTER INSERT ON cards BEGIN
      INSERT INTO cards_fts(rowid, name, upright_meaning, reversed_meaning, keywords)
      VALUES (new.id, new.name, new.upright_meaning, new.reversed_meaning, new.keywords);
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cards_ad AFTER DELETE ON cards BEGIN
      INSERT INTO cards_fts(cards_fts, rowid, name, upright_meaning, reversed_meaning, keywords)
      VALUES('delete', old.id, old.name, old.upright_meaning, old.reversed_meaning, old.keywords);
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cards_au AFTER UPDATE ON cards BEGIN
      INSERT INTO cards_fts(cards_fts, rowid, name, upright_meaning, reversed_meaning, keywords)
      VALUES('delete', old.id, old.name, old.upright_meaning, old.reversed_meaning, old.keywords);
      INSERT INTO cards_fts(rowid, name, upright_meaning, reversed_meaning, keywords)
      VALUES (new.id, new.name, new.upright_meaning, new.reversed_meaning, new.keywords);
    END;
  `);

  // Create readings table for journaling
  db.exec(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spread_type TEXT NOT NULL CHECK(spread_type IN ('single','three-card','celtic-cross','custom')),
      cards_json TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create daily_history table to track past daily cards
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_history (
      date TEXT PRIMARY KEY,
      card_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )
  `);

  // Create favorites table for bookmarked cards
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )
  `);

  // Seed data if database is empty (e.g., :memory: or new database)
  const count = db.query("SELECT COUNT(*) as count FROM cards").get() as { count: number };
  if (count.count === 0) {
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
  }

  return db;
}
