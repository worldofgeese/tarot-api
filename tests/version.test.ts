import { test, expect } from "bun:test";

const BASE_URL = "http://localhost:3000";

test("GET /api/version returns 200 with version info", async () => {
  const res = await fetch(`${BASE_URL}/api/version`);
  expect(res.status).toBe(200);
});

test("GET /api/version returns JSON with version field", async () => {
  const res = await fetch(`${BASE_URL}/api/version`);
  const data = await res.json();
  expect(data).toHaveProperty("version");
  expect(typeof data.version).toBe("string");
});

test("GET /api/version returns JSON with api_name field", async () => {
  const res = await fetch(`${BASE_URL}/api/version`);
  const data = await res.json();
  expect(data).toHaveProperty("api_name");
  expect(data.api_name).toBe("Tarot API");
});

test("GET /api/version returns JSON with card_count field", async () => {
  const res = await fetch(`${BASE_URL}/api/version`);
  const data = await res.json();
  expect(data).toHaveProperty("card_count");
  expect(data.card_count).toBe(78);
});
