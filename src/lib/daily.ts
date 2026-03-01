import { Database } from "bun:sqlite";
import { type Card } from "./spread";

/**
 * Simple hash function for a string. Returns a non-negative integer.
 * Uses a deterministic algorithm (djb2 hash) that produces the same output for the same input.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
  }
  return Math.abs(hash);
}

/**
 * Get the daily card for a given date.
 * Returns the same card for the same date (deterministic).
 *
 * @param db - SQLite database instance
 * @param date - Date to get the card for (defaults to current UTC date)
 * @returns Object with card, date (ISO string), and reversed status
 */
export function getDailyCard(db: Database, date?: Date): {
  card: Card;
  date: string;
  reversed: boolean;
} {
  // Use current UTC date if no date provided
  const targetDate = date || new Date();

  // Get ISO date string (YYYY-MM-DD) in UTC
  const dateString = targetDate.toISOString().split("T")[0];

  // Hash the date string to get a deterministic card index (0-77)
  const hash = hashString(dateString);
  const cardIndex = hash % 78;

  // Determine reversed status (deterministic based on date)
  const reversed = (hash % 2) === 1;

  // Fetch the card from the database
  const query = db.query("SELECT * FROM cards WHERE id = ?");
  const card = query.get(cardIndex) as Card;

  if (!card) {
    throw new Error(`Card with id ${cardIndex} not found`);
  }

  return {
    card,
    date: dateString,
    reversed
  };
}
