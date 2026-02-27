import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { getSpreadByType, type Card } from "../lib/spread";

export function apiRoutes(db: Database) {
  return new Elysia({ prefix: "/api" })
    .get("/health", () => {
      const countQuery = db.query("SELECT COUNT(*) as count FROM cards");
      const result = countQuery.get() as { count: number };

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        cardCount: result.count
      };
    })

    .get("/cards", ({ query }) => {
      const { limit = "100", offset = "0", arcana, suit } = query;

      let sql = "SELECT * FROM cards";
      const params: any[] = [];
      const conditions: string[] = [];

      if (arcana) {
        conditions.push("arcana = ?");
        params.push(arcana);
      }

      if (suit) {
        conditions.push("suit = ?");
        params.push(suit);
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      sql += " LIMIT ? OFFSET ?";
      params.push(parseInt(limit as string), parseInt(offset as string));

      const queryObj = db.query(sql);
      const cards = queryObj.all(...params) as Card[];

      return cards.map(card => ({
        ...card,
        keywords: JSON.parse(card.keywords)
      }));
    })

    .get("/cards/:id", ({ params: { id }, set }) => {
      const query = db.query("SELECT * FROM cards WHERE id = ?");
      const card = query.get(parseInt(id)) as Card | null;

      if (!card) {
        set.status = 404;
        return { error: "Card not found" };
      }

      return {
        ...card,
        keywords: JSON.parse(card.keywords)
      };
    })

    .get("/spread/:type", ({ params: { type }, set }) => {
      try {
        const cards = getSpreadByType(db, type);
        return cards.map(card => ({
          ...card,
          keywords: JSON.parse(card.keywords)
        }));
      } catch (error) {
        set.status = 400;
        return { error: (error as Error).message };
      }
    })

    .get("/search", ({ query, set }) => {
      const { q } = query;

      if (!q || (q as string).trim() === "") {
        set.status = 400;
        return { error: "Query parameter 'q' is required" };
      }

      const searchQuery = db.query(`
        SELECT c.* FROM cards c
        JOIN cards_fts fts ON c.id = fts.rowid
        WHERE cards_fts MATCH ?
        ORDER BY rank
      `);

      const cards = searchQuery.all(q) as Card[];

      return cards.map(card => ({
        ...card,
        keywords: JSON.parse(card.keywords)
      }));
    });
}
