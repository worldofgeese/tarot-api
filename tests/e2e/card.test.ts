import { test, expect } from "bun:test";
import { chromium } from "playwright";

test("card detail page renders all fields", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/card/0", { timeout: 30000 });

  // Check for card name
  const cardName = await page.locator(".card-name").textContent();
  expect(cardName).toBeTruthy();

  // Check for upright meaning
  const uprightMeaning = await page.locator(".upright-meaning").textContent();
  expect(uprightMeaning).toBeTruthy();

  // Check for reversed meaning
  const reversedMeaning = await page.locator(".reversed-meaning").textContent();
  expect(reversedMeaning).toBeTruthy();

  // Check for keywords
  const keywords = await page.locator(".keywords").count();
  expect(keywords).toBeGreaterThan(0);

  await browser.close();
});

test("card detail page shows The Fool for id 0", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/card/0", { timeout: 30000 });

  const cardName = await page.locator(".card-name").textContent();
  expect(cardName).toContain("The Fool");

  await browser.close();
});

test("invalid card id shows 404", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const response = await page.goto("http://localhost:3000/card/999", { timeout: 30000 });
  expect(response?.status()).toBe(404);

  await browser.close();
});
