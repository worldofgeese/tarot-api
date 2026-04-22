import { describe, it, expect, beforeAll } from "bun:test";
import createApp from "../src/index";

const app = createApp(":memory:");

describe("Favorites API", () => {
  describe("POST /api/favorites", () => {
    it("creates a favorite with note and returns 201", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: 0, note: "This card spoke to me" })
        })
      );
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.card_id).toBe(0);
      expect(data.note).toBe("This card spoke to me");
      expect(data.created_at).toBeDefined();
      expect(data.card).toBeDefined();
      expect(data.card.id).toBe(0);
      expect(data.card.name).toBe("The Fool");
    });

    it("creates a favorite without note (defaults to empty string)", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: 1 })
        })
      );
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.note).toBe("");
    });

    it("returns 404 for invalid cardId", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: 999 })
        })
      );
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toBe("Card not found");
    });

    it("allows duplicate cardId with different notes", async () => {
      const res1 = await app.handle(
        new Request("http://localhost/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: 2, note: "First note" })
        })
      );
      expect(res1.status).toBe(201);

      const res2 = await app.handle(
        new Request("http://localhost/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: 2, note: "Second note" })
        })
      );
      const data2 = await res2.json();
      expect(res2.status).toBe(201);
      expect(data2.note).toBe("Second note");
    });
  });

  describe("GET /api/favorites", () => {
    it("returns favorites with pagination", async () => {
      // Create some favorites first
      await app.handle(
        new Request("http://localhost/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: 3, note: "Test 1" })
        })
      );
      await app.handle(
        new Request("http://localhost/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: 4, note: "Test 2" })
        })
      );

      const res = await app.handle(
        new Request("http://localhost/api/favorites?limit=10&offset=0")
      );
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.favorites).toBeDefined();
      expect(Array.isArray(data.favorites)).toBe(true);
      expect(data.total).toBeGreaterThan(0);
      expect(data.favorites[0].card).toBeDefined();
      expect(data.favorites[0].note).toBeDefined();
      expect(data.favorites[0].created_at).toBeDefined();
    });

    it("defaults to newest sort", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/favorites")
      );
      const data = await res.json();
      expect(res.status).toBe(200);
      // Should be sorted by created_at DESC (newest first)
      const dates = data.favorites.map((f: any) => new Date(f.created_at).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it("sorts by oldest when sort=oldest", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/favorites?sort=oldest")
      );
      const data = await res.json();
      expect(res.status).toBe(200);
      // Should be sorted by created_at ASC (oldest first)
      const dates = data.favorites.map((f: any) => new Date(f.created_at).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i + 1]);
      }
    });

    it("respects limit parameter", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/favorites?limit=2")
      );
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.favorites.length).toBeLessThanOrEqual(2);
    });

    it("respects offset parameter", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/favorites?offset=1")
      );
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.favorites).toBeDefined();
    });
  });

  describe("DELETE /api/favorites/:id", () => {
    it("deletes a favorite and returns 204", async () => {
      // Create a favorite
      const createRes = await app.handle(
        new Request("http://localhost/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: 5, note: "To delete" })
        })
      );
      const created = await createRes.json();
      const favoriteId = created.id;

      // Delete it
      const deleteRes = await app.handle(
        new Request(`http://localhost/api/favorites/${favoriteId}`, {
          method: "DELETE"
        })
      );
      expect(deleteRes.status).toBe(204);

      // Verify it's gone
      const getRes = await app.handle(
        new Request("http://localhost/api/favorites")
      );
      const data = await getRes.json();
      const found = data.favorites.find((f: any) => f.id === favoriteId);
      expect(found).toBeUndefined();
    });

    it("returns 404 for non-existent favorite", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/favorites/99999", {
          method: "DELETE"
        })
      );
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toBe("Favorite not found");
    });
  });
});
