import { test, expect } from "bun:test";
import { chromium } from "/home/node/.local/lib/node_modules/@playwright/cli/node_modules/playwright";

test("spread page draws 3 cards on button click", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/spread", { timeout: 30000 });

  // Click the 3-card spread button
  await page.locator("button:has-text('3-Card')").click();

  // Wait for cards to appear
  await page.waitForSelector(".spread-card", { timeout: 30000 });

  // Count spread cards
  const spreadCards = await page.locator(".spread-card").count();
  expect(spreadCards).toBe(3);

  await browser.close();
});

test("spread page draws 10 cards for celtic cross", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/spread", { timeout: 30000 });

  // Click the celtic cross button
  await page.locator("button:has-text('Celtic Cross')").click();

  // Wait for cards to appear
  await page.waitForSelector(".spread-card", { timeout: 30000 });

  // Count spread cards
  const spreadCards = await page.locator(".spread-card").count();
  expect(spreadCards).toBe(10);

  await browser.close();
});

test("spread page draws 1 card for single card", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/spread", { timeout: 30000 });

  // Click the single card button
  await page.locator("button:has-text('Single Card')").click();

  // Wait for cards to appear
  await page.waitForSelector(".spread-card", { timeout: 30000 });

  // Count spread cards
  const spreadCards = await page.locator(".spread-card").count();
  expect(spreadCards).toBe(1);

  await browser.close();
});

test("drawn cards show card names", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/spread", { timeout: 30000 });

  await page.locator("button:has-text('3-Card')").click();
  await page.waitForSelector(".spread-card", { timeout: 30000 });

  // Check that cards have names
  const firstCardName = await page.locator(".spread-card").first().locator(".card-name").textContent();
  expect(firstCardName).toBeTruthy();

  await browser.close();
});
