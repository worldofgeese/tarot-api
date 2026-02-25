import { Database } from "bun:sqlite";

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

  return db;
}
