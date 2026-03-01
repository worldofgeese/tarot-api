import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { getSpreadByType, type Card } from "../lib/spread";
import { getSpread, listSpreads } from "../spreads";
import { getDailyCard } from "../lib/daily";
import { searchReversed } from "../lib/reversed";

// Read version from package.json at module level
import packageJson from "../../package.json";
const VERSION = packageJson.version;

function parseKeywords(keywords: string | null): string[] {
  return keywords ? JSON.parse(keywords) : [];
}

export function apiRoutes(db: Database) {
  return new Elysia({ prefix: "/api" })
    .get("/health", () => {
      let database = "connected";
      let cardCount = 0;

      try {
        db.query("SELECT 1").get();
      } catch (error) {
        database = "error";
      }

      try {
        const countResult = db.query("SELECT COUNT(*) as count FROM cards").get() as { count: number };
        cardCount = countResult.count;
      } catch (error) {
        // If count query fails, keep cardCount at 0
        cardCount = 0;
      }

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        database,
        version: VERSION,
        cardCount
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
        keywords: parseKeywords(card.keywords)
      }));
    })

    .get("/cards/:id", ({ params: { id }, set }) => {
      const numericId = parseInt(id);

      if (isNaN(numericId)) {
        set.status = 400;
        return { error: "Invalid id" };
      }

      const query = db.query("SELECT * FROM cards WHERE id = ?");
      const card = query.get(numericId) as Card | null;

      if (!card) {
        set.status = 404;
        return { error: "Card not found" };
      }

      return {
        ...card,
        keywords: parseKeywords(card.keywords)
      };
    })

    .get("/spread/:type", ({ params: { type }, set }) => {
      try {
        const cards = getSpreadByType(db, type);
        return cards.map(card => ({
          ...card,
          keywords: parseKeywords(card.keywords)
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
        keywords: parseKeywords(card.keywords)
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
        keywords: parseKeywords(card.keywords)
      }));

      return countNum === 1 ? formattedCards[0] : formattedCards;
    })

    .get("/daily", () => {
      const { card, date, reversed } = getDailyCard(db);

      return {
        ...card,
        keywords: parseKeywords(card.keywords),
        date,
        reversed
      };
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
        keywords: parseKeywords(card.keywords)
      }));
    })

    .get("/cards/reversed", ({ query, set }) => {
      const { q } = query;

      if (!q || (q as string).trim() === "") {
        set.status = 400;
        return { error: "query parameter q is required" };
      }

      const cards = searchReversed(db, q as string);

      return cards.map(card => ({
        ...card,
        keywords: parseKeywords(card.keywords)
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
        keywords: parseKeywords(card.keywords)
      }));
    })

    .get("/cards/arcana/:type", ({ params: { type }, set }) => {
      const normalizedType = type.toLowerCase();

      if (normalizedType !== "major" && normalizedType !== "minor") {
        set.status = 400;
        return { error: "Invalid arcana type. Use 'major' or 'minor'" };
      }

      let sql: string;
      if (normalizedType === "major") {
        sql = "SELECT * FROM cards WHERE suit IS NULL OR suit = ''";
      } else {
        sql = "SELECT * FROM cards WHERE suit IS NOT NULL AND suit != ''";
      }

      const queryObj = db.query(sql);
      const cards = queryObj.all() as Card[];

      return cards.map(card => ({
        ...card,
        keywords: parseKeywords(card.keywords)
      }));
    })

    .get("/spreads", () => {
      return listSpreads();
    })

    .get("/spreads/:id", ({ params: { id }, set }) => {
      const spread = getSpread(id);

      if (!spread) {
        set.status = 404;
        return { error: "Spread not found" };
      }

      return spread;
    })

    .post("/spreads/:id/draw", ({ params: { id }, set }) => {
      const spread = getSpread(id);

      if (!spread) {
        set.status = 404;
        return { error: "Spread not found" };
      }

      // Query random cards based on the number of positions
      const positionCount = spread.positions.length;
      const query = db.query("SELECT * FROM cards ORDER BY RANDOM() LIMIT ?");
      const cards = query.all(positionCount) as Card[];

      // Map each position to a card with reversed status
      const drawnCards = spread.positions.map((position, index) => ({
        position,
        card: {
          ...cards[index],
          keywords: parseKeywords(cards[index].keywords)
        },
        reversed: Math.random() < 0.5
      }));

      return {
        spread,
        cards: drawnCards
      };
    });
}
