import { test, expect } from "bun:test";
import { runSession } from "./cli";

test("card detail page shows The Fool for id 0", () => {
  const { snapshot } = runSession("http://localhost:3000/card/0");
  expect(snapshot).toContain("The Fool");
});

test("card detail page has content", () => {
  const { snapshot } = runSession("http://localhost:3000/card/0");
  expect(snapshot).toBeTruthy();
  expect(snapshot.length).toBeGreaterThan(100);
});

test("invalid card id shows error", () => {
  const { snapshot } = runSession("http://localhost:3000/card/999");
  expect(snapshot).toMatch(/404|not found|error/i);
});
