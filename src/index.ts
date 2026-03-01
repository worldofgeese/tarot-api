import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { initDatabase } from "./db/schema";
import { apiRoutes } from "./routes/api";
import { pageRoutes } from "./routes/pages";

export default function createApp() {
  const db = initDatabase();

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
