import { test, expect } from "bun:test";
import { chromium } from "/home/node/.local/lib/node_modules/@playwright/cli/node_modules/playwright";

test("landing page shows 78 card tiles", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000", { timeout: 30000 });

  // Wait for cards to load
  await page.waitForSelector(".card-tile", { timeout: 30000 });

  // Count card tiles
  const cardTiles = await page.locator(".card-tile").count();
  expect(cardTiles).toBe(78);

  await browser.close();
});

test("landing page has correct title", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000", { timeout: 30000 });

  const title = await page.title();
  expect(title).toContain("Tarot");

  await browser.close();
});

test("card tiles are clickable", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000", { timeout: 30000 });

  await page.waitForSelector(".card-tile", { timeout: 30000 });

  // Click first card
  await page.locator(".card-tile").first().click();

  // Should navigate to card detail page
  await page.waitForURL(/\/card\/\d+/, { timeout: 30000 });

  await browser.close();
});
