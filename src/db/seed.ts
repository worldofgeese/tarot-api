import { initDatabase } from "./schema";
import cards from "../../data/cards.json";

export function seedDatabase(dbPath: string = "data/tarot.db") {
  const db = initDatabase(dbPath);

  // Clear existing data
  db.exec("DELETE FROM cards");

  // Insert cards
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

  console.log(`Seeded ${cards.length} cards into database`);
  db.close();
}

// Run if called directly
if (import.meta.main) {
  seedDatabase();
}
