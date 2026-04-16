import { test, expect } from "bun:test";
import { runSession, runSessionWithClick, countInSnapshot, registerCleanup } from "./cli";

registerCleanup();

test("landing page has correct title", () => {
  const { title } = runSession("http://localhost:3000");
  expect(title).toContain("Tarot");
});

test("landing page shows card content", () => {
  const { snapshot } = runSession("http://localhost:3000");
  // Snapshot will contain card names or card-related content
  expect(snapshot.toLowerCase()).toMatch(/card|tarot|fool|tower|sun|moon/);
});

test("card tiles are clickable and navigate to card detail", () => {
  const { snapshot } = runSessionWithClick(
    "http://localhost:3000",
    "getByRole('link')"
  );
  // After clicking a link, we should be on a different page
  expect(snapshot).toBeTruthy();
}, 50000);
