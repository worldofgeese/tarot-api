import { Database } from "bun:sqlite";

export interface Card {
  id: number;
  name: string;
  arcana: string;
  suit: string | null;
  number: number;
  upright_meaning: string;
  reversed_meaning: string;
  keywords: string;
  image_desc: string;
}

export function drawSpread(db: Database, count: number): Card[] {
  const query = db.query("SELECT * FROM cards ORDER BY RANDOM() LIMIT ?");
  return query.all(count) as Card[];
}

export function getSpreadByType(db: Database, type: string, count?: number): Card[] {
  switch (type) {
    case "single":
      // Use provided count if available, otherwise default to 1
      return drawSpread(db, count ?? 1);
    case "3-card":
      return drawSpread(db, 3);
    case "celtic-cross":
      return drawSpread(db, 10);
    default:
      throw new Error(`Unknown spread type: ${type}`);
  }
}
