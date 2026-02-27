import { Elysia } from "elysia";
import { Database } from "bun:sqlite";

// Track server start time
const startTime = Date.now();

export function healthRoutes(db: Database) {
  return new Elysia({ prefix: "/api" })
    .get("/health", () => {
      let dbConnected = true;

      try {
        // Check DB connectivity with a simple query
        const query = db.query("SELECT 1");
        query.get();
      } catch (error) {
        dbConnected = false;
      }

      // Calculate uptime in seconds
      const uptime = (Date.now() - startTime) / 1000;

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        dbConnected,
        uptime
      };
    });
}
