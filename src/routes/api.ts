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
    })

    .get("/stats", () => {
      const totalCardsQuery = db.query("SELECT COUNT(*) as count FROM cards");
      const totalCardsResult = totalCardsQuery.get() as { count: number };

      const majorArcanaQuery = db.query("SELECT COUNT(*) as count FROM cards WHERE suit IS NULL OR suit = ''");
      const majorArcanaResult = majorArcanaQuery.get() as { count: number };

      const minorArcanaQuery = db.query("SELECT COUNT(*) as count FROM cards WHERE suit IS NOT NULL AND suit != ''");
      const minorArcanaResult = minorArcanaQuery.get() as { count: number };

      const suitsQuery = db.query("SELECT DISTINCT suit FROM cards WHERE suit IS NOT NULL AND suit != '' ORDER BY suit");
      const suitsResult = suitsQuery.all() as { suit: string }[];
      const suits = suitsResult.map(row => row.suit);

      return {
        totalCards: totalCardsResult.count,
        majorArcana: majorArcanaResult.count,
        minorArcana: minorArcanaResult.count,
        suits
      };
    })

    .get("/cards/random", ({ query, set }) => {
      const { count = "1" } = query;
      const countNum = parseInt(count as string);

      if (isNaN(countNum) || countNum < 1 || countNum > 10) {
        set.status = 400;
        return { error: "Count must be between 1 and 10" };
      }

      const randomQuery = db.query(`
        SELECT * FROM cards
        ORDER BY RANDOM()
        LIMIT ?
      `);

      const cards = randomQuery.all(countNum) as Card[];

      const formattedCards = cards.map(card => ({
        ...card,
        keywords: JSON.parse(card.keywords)
      }));

      return countNum === 1 ? formattedCards[0] : formattedCards;
    })

    .get("/cards/search", ({ query, set }) => {
      const { q } = query;

      if (!q || (q as string).trim() === "") {
        set.status = 400;
        return { error: "Query parameter 'q' is required" };
      }

      const searchTerm = `%${q}%`;
      const searchQuery = db.query(`
        SELECT * FROM cards
        WHERE name LIKE ? COLLATE NOCASE OR keywords LIKE ? COLLATE NOCASE
        ORDER BY id
      `);

      const cards = searchQuery.all(searchTerm, searchTerm) as Card[];

      return cards.map(card => ({
        ...card,
        keywords: JSON.parse(card.keywords)
      }));
    })

    .get("/cards/suit/:suit", ({ params: { suit }, set }) => {
      const query = db.query(`
        SELECT * FROM cards
        WHERE suit = ? COLLATE NOCASE
        ORDER BY number ASC
      `);
      const cards = query.all(suit) as Card[];

      if (cards.length === 0) {
        set.status = 404;
        return { error: "No cards found for suit" };
      }

      return cards.map(card => ({
        ...card,
        keywords: JSON.parse(card.keywords)
      }));
    });
}
