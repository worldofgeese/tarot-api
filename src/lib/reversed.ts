import { Database } from "bun:sqlite";
import { type Card } from "./spread";

export function searchReversed(db: Database, query: string): Card[] {
  const searchTerm = `%${query}%`;
  const searchQuery = db.query(`
    SELECT * FROM cards
    WHERE reversed_meaning LIKE ? COLLATE NOCASE
    ORDER BY id
  `);

  return searchQuery.all(searchTerm) as Card[];
}
