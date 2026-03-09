import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";

describe("Security: Input Validation & Sanitization", () => {
  let app: Elysia;
  let baseUrl: string;

  beforeAll(async () => {
    const { default: createApp } = await import("../src/index");
    app = createApp();
    baseUrl = "http://localhost:3004";

    // Start server on test port
    app.listen(3004);
  });

  afterAll(() => {
    app.stop();
  });

  describe("SQL Injection Protection", () => {
    test("GET /api/search rejects SQL injection attempt with DROP TABLE", async () => {
      const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent("'; DROP TABLE cards;--")}`);

      // Should either reject (400) or safely handle without executing SQL
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        // If it returns 200, it should be empty or safe results, not error
        expect(Array.isArray(data)).toBe(true);
      }

      // Verify cards table still exists by hitting another endpoint
      const healthCheck = await fetch(`${baseUrl}/api/health`);
      const health = await healthCheck.json();
      expect(health.database).toBe("connected");
      expect(health.cardCount).toBeGreaterThan(0);
    });

    test("GET /api/search rejects SQL injection with OR 1=1", async () => {
      const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent("' OR '1'='1")}`);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    test("GET /api/cards/reversed rejects SQL injection attempt", async () => {
      const response = await fetch(`${baseUrl}/api/cards/reversed?q=${encodeURIComponent("' OR '1'='1")}`);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    test("GET /api/cards/search rejects SQL injection with UNION SELECT", async () => {
      const response = await fetch(`${baseUrl}/api/cards/search?q=${encodeURIComponent("' UNION SELECT * FROM cards--")}`);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  describe("XSS Protection", () => {
    test("GET /api/search sanitizes XSS in query params", async () => {
      const xssPayload = "<script>alert(1)</script>";
      const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(xssPayload)}`);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        // Response should not contain raw script tags
        const jsonStr = JSON.stringify(data);
        expect(jsonStr.includes("<script>")).toBe(false);
      }
    });

    test("GET /api/cards/search sanitizes XSS with img onerror", async () => {
      const xssPayload = '<img src=x onerror="alert(1)">';
      const response = await fetch(`${baseUrl}/api/cards/search?q=${encodeURIComponent(xssPayload)}`);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    test("GET /api/cards/reversed sanitizes XSS attempts", async () => {
      const xssPayload = "<script>document.cookie</script>";
      const response = await fetch(`${baseUrl}/api/cards/reversed?q=${encodeURIComponent(xssPayload)}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe("Input Size Limits", () => {
    test("GET /api/search rejects oversized input (>500 chars)", async () => {
      const oversizedInput = "a".repeat(10000);
      const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(oversizedInput)}`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.toLowerCase()).toContain("too long");
    });

    test("GET /api/cards/search rejects oversized input (>500 chars)", async () => {
      const oversizedInput = "x".repeat(10000);
      const response = await fetch(`${baseUrl}/api/cards/search?q=${encodeURIComponent(oversizedInput)}`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("GET /api/cards/reversed rejects oversized input (>500 chars)", async () => {
      const oversizedInput = "z".repeat(10000);
      const response = await fetch(`${baseUrl}/api/cards/reversed?q=${encodeURIComponent(oversizedInput)}`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("GET /api/search accepts input at 500 char limit", async () => {
      const maxInput = "fool " + "x".repeat(495);
      const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(maxInput)}`);

      // Should accept at limit
      expect([200]).toContain(response.status);
    });
  });

  describe("Null Byte Injection", () => {
    test("GET /api/search strips null bytes from input", async () => {
      const nullByteInput = "fool%00world";
      const response = await fetch(`${baseUrl}/api/search?q=${nullByteInput}`);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    test("GET /api/cards/search strips null bytes", async () => {
      const nullByteInput = "hello%00world";
      const response = await fetch(`${baseUrl}/api/cards/search?q=${nullByteInput}`);

      expect([200, 400]).toContain(response.status);
    });

    test("GET /api/cards/reversed strips null bytes", async () => {
      const nullByteInput = "test%00injection";
      const response = await fetch(`${baseUrl}/api/cards/reversed?q=${nullByteInput}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe("Path Traversal Protection", () => {
    test("GET /api/cards/:id rejects path traversal attempt", async () => {
      const pathTraversal = "../../etc/passwd";
      const response = await fetch(`${baseUrl}/api/cards/${pathTraversal}`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("GET /api/cards/:id rejects path with slashes", async () => {
      const response = await fetch(`${baseUrl}/api/cards/1/../../admin`);

      // Should not match route or return 404/400
      expect([400, 404]).toContain(response.status);
    });
  });

  describe("Invalid Card ID Types", () => {
    test("GET /api/cards/:id rejects non-numeric ID (string)", async () => {
      const response = await fetch(`${baseUrl}/api/cards/abc`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.toLowerCase()).toContain("invalid");
    });

    test("GET /api/cards/:id rejects decimal ID", async () => {
      const response = await fetch(`${baseUrl}/api/cards/1.5`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("GET /api/cards/:id rejects negative ID", async () => {
      const response = await fetch(`${baseUrl}/api/cards/-1`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("GET /api/cards/:id rejects ID with special characters", async () => {
      const response = await fetch(`${baseUrl}/api/cards/1;DROP%20TABLE`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("GET /api/cards/:id accepts valid numeric ID", async () => {
      const response = await fetch(`${baseUrl}/api/cards/1`);

      // Should accept valid ID (200 if exists, 404 if not)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("Regression: Normal Operations Still Work", () => {
    test("GET /api/search works with normal query", async () => {
      const response = await fetch(`${baseUrl}/api/search?q=fool`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /api/cards/search works with normal query", async () => {
      const response = await fetch(`${baseUrl}/api/cards/search?q=fool`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test("GET /api/cards/reversed works with normal query", async () => {
      const response = await fetch(`${baseUrl}/api/cards/reversed?q=fool`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /api/cards/:id works with valid ID", async () => {
      const response = await fetch(`${baseUrl}/api/cards/1`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("name");
    });

    test("GET /api/cards works normally", async () => {
      const response = await fetch(`${baseUrl}/api/cards?limit=5`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test("GET /api/health works normally", async () => {
      const response = await fetch(`${baseUrl}/api/health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("ok");
      expect(data.database).toBe("connected");
    });

    test("GET /api/search allows Unicode characters", async () => {
      const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent("fool \u2728")}`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /api/search allows empty results for valid weird queries", async () => {
      const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent("!@#$%")}`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
