import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { initDatabase } from "./db/schema";
import { apiRoutes } from "./routes/api";
import { pageRoutes } from "./routes/pages";
import cards from "../data/cards.json";

export default function createApp(dbPath: string = "data/tarot.db") {
  const db = initDatabase(dbPath);

  // Seed database if using in-memory database
  if (dbPath === ":memory:") {
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

  const app = new Elysia()
    .use(staticPlugin({
      assets: "public",
      prefix: "/public"
    }))
    .use(apiRoutes(db))
    .use(pageRoutes(db));

  return app;
}

// Start server if run directly
if (import.meta.main) {
  const app = createApp();
  app.listen(3000);
  console.log("🔮 Tarot API running on http://localhost:3000");
}
