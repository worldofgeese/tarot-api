import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { getSpreadByType, type Card } from "../lib/spread";
import { getSpread, listSpreads } from "../spreads";
import { getDailyCard } from "../lib/daily";
import { searchReversed } from "../lib/reversed";
import { validateStringParam, validateCardId } from "../middleware/validate";

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

    .get("/cards/reversed", ({ query, set }) => {
      const { q } = query;

      // MOSAIC: Validate search query (safe with parameterized queries)
      const validation = validateStringParam(q as string, "q", true, false);
      if (!validation.valid) {
        set.status = 400;
        // Match original error message format for existing tests
        return { error: "query parameter q is required" };
      }

      const cards = searchReversed(db, validation.sanitized as string);

      return cards.map(card => ({
        ...card,
        keywords: parseKeywords(card.keywords)
      }));
    })

    .get("/cards/element/:element", ({ params: { element }, set }) => {
      // MOSAIC: Validate element parameter
      const validation = validateStringParam(element, "element", true, false);
      if (!validation.valid) {
        set.status = 400;
        return { error: validation.error };
      }

      const normalizedElement = validation.sanitized?.toLowerCase();

      // Map elements to suits (lowercase to match database)
      const elementToSuit: Record<string, string> = {
        fire: "wands",
        water: "cups",
        air: "swords",
        earth: "pentacles"
      };

      const suit = elementToSuit[normalizedElement as string];

      if (!suit) {
        set.status = 400;
        return { error: "Invalid element. Must be one of: fire, water, air, earth" };
      }

      // Query cards by suit (excludes Major Arcana which have null/empty suit)
      const query = db.query(`
        SELECT * FROM cards
        WHERE suit = ? COLLATE NOCASE
        ORDER BY number ASC
      `);
      const cards = query.all(suit) as Card[];

      return cards.map(card => ({
        ...card,
        keywords: parseKeywords(card.keywords)
      }));
    })

    .get("/cards/keywords", () => {
      const rows = db.query("SELECT keywords FROM cards").all() as { keywords: string }[];
      const all = rows.flatMap(r => (r.keywords ?? "").split(",").map((k: string) => k.trim()).filter(Boolean));
      const keywords = [...new Set(all)].sort();
      return { keywords };
    })

    .get("/cards/keywords/search", ({ query, set }) => {
      const { q } = query;

      // Validate query parameter is present
      const validation = validateStringParam(q as string, "q", true, false);
      if (!validation.valid) {
        set.status = 400;
        return { error: validation.error };
      }

      const searchTerm = validation.sanitized?.toLowerCase();

      // Get all cards
      const allCards = db.query("SELECT * FROM cards").all() as Card[];

      // Filter cards that have at least one matching keyword
      const matchingCards: Card[] = [];
      const matchingKeywords = new Set<string>();

      for (const card of allCards) {
        const keywords = parseKeywords(card.keywords);
        const hasMatch = keywords.some(k => k.toLowerCase().includes(searchTerm as string));

        if (hasMatch) {
          matchingCards.push(card);
          // Add matching keywords to the set
          keywords.forEach(k => {
            if (k.toLowerCase().includes(searchTerm as string)) {
              matchingKeywords.add(k);
            }
          });
        }
      }

      // Sort keywords alphabetically
      const sortedKeywords = Array.from(matchingKeywords).sort();

      return {
        query: validation.sanitized,
        keywords: sortedKeywords,
        cards: matchingCards.map(card => ({
          ...card,
          keywords: parseKeywords(card.keywords)
        }))
      };
    })

    .get("/cards/:id", ({ params: { id }, set }) => {
      // MOSAIC: Validate card ID before processing
      const validation = validateCardId(id);
      if (!validation.valid) {
        set.status = 400;
        return { error: validation.error };
      }

      const numericId = parseInt(id);
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

    .get("/cards/:id/reversal", ({ params: { id }, set }) => {
      const validation = validateCardId(id);
      if (!validation.valid) {
        set.status = 400;
        return { error: validation.error };
      }

      const numericId = parseInt(id);
      const query = db.query("SELECT id, name, reversed_meaning FROM cards WHERE id = ?");
      const card = query.get(numericId) as { id: number; name: string; reversed_meaning: string } | null;

      if (!card) {
        set.status = 404;
        return { error: "Card not found" };
      }

      return {
        id: card.id,
        name: card.name,
        reversed: card.reversed_meaning
      };
    })

    .get("/spread/:type", ({ params: { type }, query, set }) => {
      try {
        // Special handling for "single" type with count parameter
        if (type === "single" && query.count !== undefined) {
          const countStr = query.count as string;
          const count = parseInt(countStr);

          // Validate count is numeric and in range 1-10
          if (isNaN(count) || count < 1 || count > 10) {
            set.status = 400;
            return { error: "Count must be between 1 and 10" };
          }

          // Draw the specified number of cards
          const cards = getSpreadByType(db, type, count);
          return cards.map(card => ({
            ...card,
            keywords: parseKeywords(card.keywords)
          }));
        }

        // Default behavior for all other types or single without count
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

      // MOSAIC: Validate search query (no sanitization for FTS syntax)
      const validation = validateStringParam(q as string, "q", true, false);
      if (!validation.valid) {
        set.status = 400;
        return { error: validation.error };
      }

      const searchQuery = db.query(`
        SELECT c.* FROM cards c
        JOIN cards_fts fts ON c.id = fts.rowid
        WHERE cards_fts MATCH ?
        ORDER BY rank
      `);

      try {
        const cards = searchQuery.all(validation.sanitized) as Card[];

        return cards.map(card => ({
          ...card,
          keywords: parseKeywords(card.keywords)
        }));
      } catch (error) {
        // FTS syntax errors return empty results
        return [];
      }
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

    .get("/daily", ({ query, set }) => {
      const { date: dateParam } = query;

      // Validate date parameter if provided
      if (dateParam) {
        const dateStr = dateParam as string;

        // Validate YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr)) {
          set.status = 400;
          return { error: "Invalid date format. Use YYYY-MM-DD" };
        }

        // Validate that it's a valid date
        const parsedDate = new Date(dateStr + "T00:00:00Z");
        if (isNaN(parsedDate.getTime())) {
          set.status = 400;
          return { error: "Invalid date format. Use YYYY-MM-DD" };
        }

        // Use the provided date
        const { card, date, reversed } = getDailyCard(db, parsedDate);

        return {
          ...card,
          keywords: parseKeywords(card.keywords),
          date,
          reversed
        };
      }

      // No date parameter, use today's date
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

      // MOSAIC: Validate search query (LIKE is safe with params)
      const validation = validateStringParam(q as string, "q", true, false);
      if (!validation.valid) {
        set.status = 400;
        return { error: validation.error };
      }

      const searchTerm = `%${validation.sanitized}%`;
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

    .get("/cards/suit/:suit/random", ({ params: { suit }, set }) => {
      const normalizedSuit = suit.toLowerCase();

      // Validate suit (only allow the four minor arcana suits)
      const validSuits = ["wands", "cups", "swords", "pentacles"];
      if (!validSuits.includes(normalizedSuit)) {
        set.status = 400;
        return { error: "Invalid suit. Must be one of: wands, cups, swords, pentacles" };
      }

      // Query random card from the specified suit
      const query = db.query(`
        SELECT * FROM cards
        WHERE suit = ? COLLATE NOCASE
        ORDER BY RANDOM()
        LIMIT 1
      `);

      const card = query.get(suit) as Card | null;

      if (!card) {
        set.status = 404;
        return { error: "No cards found for suit" };
      }

      return {
        ...card,
        keywords: parseKeywords(card.keywords)
      };
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

    .get("/cards/numerology/:number", ({ params: { number }, set }) => {
      const num = parseInt(number);

      // Validate: must be an integer and non-negative
      if (isNaN(num) || num < 0) {
        set.status = 400;
        return { error: "Invalid number parameter. Must be a non-negative integer" };
      }

      // Query cards by number field
      const query = db.query("SELECT * FROM cards WHERE number = ?");
      const cards = query.all(num) as Card[];

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

    .get("/meaning/:id", ({ params: { id }, set }) => {
      const validation = validateCardId(id);
      if (!validation.valid) {
        set.status = 400;
        return { error: validation.error };
      }

      const numericId = parseInt(id, 10);
      const query = db.query("SELECT id, name, upright_meaning, reversed_meaning FROM cards WHERE id = ?");
      const card = query.get(numericId) as { id: number; name: string; upright_meaning: string; reversed_meaning: string } | null;

      if (!card) {
        set.status = 404;
        return { error: "Card not found" };
      }

      return {
        id: card.id,
        name: card.name,
        upright: card.upright_meaning,
        reversed: card.reversed_meaning
      };
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
    })

    .get("/version", () => {
      const cardCountQuery = db.query("SELECT COUNT(*) as count FROM cards");
      const cardCountResult = cardCountQuery.get() as { count: number };
      return {
        api_name: "Tarot API",
        version: "1.0.0",
        card_count: cardCountResult.count,
      };
    })

    // Readings/Journaling endpoints
    .post("/readings", ({ body, set }) => {
      const { spread_type, cards_json, notes } = body as {
        spread_type?: string;
        cards_json?: string;
        notes?: string;
      };

      // Validate spread_type
      if (!spread_type) {
        set.status = 400;
        return { error: "spread_type is required" };
      }

      const validSpreadTypes = ["single", "three-card", "celtic-cross", "custom"];
      if (!validSpreadTypes.includes(spread_type)) {
        set.status = 400;
        return { error: "Invalid spread_type. Must be one of: single, three-card, celtic-cross, custom" };
      }

      // Validate cards_json
      if (!cards_json) {
        set.status = 400;
        return { error: "cards_json is required" };
      }

      // Validate cards_json is valid JSON array of integers
      try {
        const parsed = JSON.parse(cards_json);
        if (!Array.isArray(parsed)) {
          set.status = 400;
          return { error: "cards_json must be a valid JSON array" };
        }
        if (!parsed.every((el: unknown) => Number.isInteger(el))) {
          set.status = 400;
          return { error: "cards_json must be a JSON array of integer card IDs" };
        }
      } catch (error) {
        set.status = 400;
        return { error: "cards_json must be valid JSON" };
      }

      // Validate notes length if provided
      if (notes && notes.length > 2000) {
        set.status = 400;
        return { error: "notes must be 2000 characters or less" };
      }

      // Insert reading
      const insertQuery = db.prepare(`
        INSERT INTO readings (spread_type, cards_json, notes)
        VALUES (?, ?, ?)
      `);

      const result = insertQuery.run(spread_type, cards_json, notes || null);

      // Fetch the created reading
      const selectQuery = db.query("SELECT * FROM readings WHERE id = ?");
      const reading = selectQuery.get(result.lastInsertRowid) as {
        id: number;
        spread_type: string;
        cards_json: string;
        notes: string | null;
        created_at: string;
      };

      set.status = 201;
      return reading;
    })

    .get("/readings", ({ query }) => {
      const { limit = "10", offset = "0" } = query;

      const sql = "SELECT * FROM readings ORDER BY created_at DESC LIMIT ? OFFSET ?";
      const queryObj = db.query(sql);
      const readings = queryObj.all(parseInt(limit as string), parseInt(offset as string)) as Array<{
        id: number;
        spread_type: string;
        cards_json: string;
        notes: string | null;
        created_at: string;
      }>;

      return readings;
    })

    .get("/readings/:id", ({ params: { id }, set }) => {
      // Validate ID is numeric
      const validation = validateCardId(id);
      if (!validation.valid) {
        set.status = 400;
        return { error: validation.error };
      }

      const numericId = parseInt(id, 10);
      const query = db.query("SELECT * FROM readings WHERE id = ?");
      const reading = query.get(numericId) as {
        id: number;
        spread_type: string;
        cards_json: string;
        notes: string | null;
        created_at: string;
      } | null;

      if (!reading) {
        set.status = 404;
        return { error: "Reading not found" };
      }

      return reading;
    })

    .put("/readings/:id", ({ params: { id }, body, set }) => {
      // Validate ID is numeric
      const validation = validateCardId(id);
      if (!validation.valid) {
        set.status = 400;
        return { error: validation.error };
      }

      const { spread_type, notes } = body as {
        spread_type?: string;
        notes?: string;
      };

      // At least one field required
      if (spread_type === undefined && notes === undefined) {
        set.status = 400;
        return { error: "At least one field (notes or spread_type) is required" };
      }

      // Validate spread_type if provided
      if (spread_type !== undefined) {
        if (typeof spread_type !== "string") {
          set.status = 400;
          return { error: "spread_type must be a string" };
        }
        const validSpreadTypes = ["single", "three-card", "celtic-cross", "custom"];
        if (!validSpreadTypes.includes(spread_type)) {
          set.status = 400;
          return { error: "Invalid spread_type. Must be one of: single, three-card, celtic-cross, custom" };
        }
      }

      // Validate notes length if provided
      if (notes !== undefined) {
        if (typeof notes !== "string") {
          set.status = 400;
          return { error: "notes must be a string" };
        }
        if (notes.length > 2000) {
          set.status = 400;
          return { error: "notes must be 2000 characters or less" };
        }
      }

      const numericId = parseInt(id, 10);

      // Check if reading exists
      const checkQuery = db.query("SELECT id FROM readings WHERE id = ?");
      const exists = checkQuery.get(numericId);

      if (!exists) {
        set.status = 404;
        return { error: "Reading not found" };
      }

      // Build dynamic UPDATE query
      const updates: string[] = [];
      const params: any[] = [];

      if (spread_type !== undefined) {
        updates.push("spread_type = ?");
        params.push(spread_type);
      }

      if (notes !== undefined) {
        updates.push("notes = ?");
        params.push(notes);
      }

      params.push(numericId);

      const updateSql = `UPDATE readings SET ${updates.join(", ")} WHERE id = ?`;
      db.prepare(updateSql).run(...params);

      // Fetch and return the updated reading
      const selectQuery = db.query("SELECT * FROM readings WHERE id = ?");
      const reading = selectQuery.get(numericId) as {
        id: number;
        spread_type: string;
        cards_json: string;
        notes: string | null;
        created_at: string;
      };

      return reading;
    })
    .delete("/readings/:id", ({ params: { id }, set }) => {
      const numericId = parseInt(id);
      if (isNaN(numericId) || numericId < 0) {
        set.status = 400;
        return { error: "Invalid id" };
      }
      const check = db.query("SELECT id FROM readings WHERE id = ?").get(numericId);
      if (!check) {
        set.status = 404;
        return { error: "Reading not found" };
      }
      db.prepare("DELETE FROM readings WHERE id = ?").run(numericId);
      set.status = 204;
      return null;
    });
}
