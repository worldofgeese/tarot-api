import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { landing } from "../templates/landing";
import { cardDetail } from "../templates/card-detail";
import { spread } from "../templates/spread";
import { search } from "../templates/search";
import type { Card } from "../lib/spread";

export function pageRoutes(db: Database) {
  return new Elysia()
    .get("/", () => {
      const query = db.query("SELECT * FROM cards ORDER BY id");
      const cards = query.all() as Card[];
      return new Response(landing(cards), {
        headers: { "Content-Type": "text/html" }
      });
    })

    .get("/card/:id", ({ params: { id }, set }) => {
      const query = db.query("SELECT * FROM cards WHERE id = ?");
      const card = query.get(parseInt(id)) as Card | null;

      if (!card) {
        set.status = 404;
        return new Response("<h1>404 - Card Not Found</h1>", {
          headers: { "Content-Type": "text/html" }
        });
      }

      return new Response(cardDetail(card), {
        headers: { "Content-Type": "text/html" }
      });
    })

    .get("/spread", () => {
      return new Response(spread(), {
        headers: { "Content-Type": "text/html" }
      });
    })

    .get("/search", () => {
      return new Response(search(), {
        headers: { "Content-Type": "text/html" }
      });
    });
}
