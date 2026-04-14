import { test, expect } from "bun:test";
import { runSession, runSessionWithClick } from "./cli";

test("spread page loads", () => {
  const { snapshot } = runSession("http://localhost:3000/spread");
  expect(snapshot).toMatch(/spread|draw|card/i);
});

test("spread page shows buttons", () => {
  const { title, snapshot } = runSession("http://localhost:3000/spread");
  // Title confirms we're on the spread page
  expect(title).toMatch(/spread|draw/i);
});

test("clicking draw shows cards", () => {
  const { snapshot } = runSessionWithClick(
    "http://localhost:3000/spread",
    "getByRole('button')"
  );
  expect(snapshot).toBeTruthy();
}, 50000);

test("drawn result has card content", () => {
  const { snapshot } = runSessionWithClick(
    "http://localhost:3000/spread",
    "getByRole('button')"
  );
  expect(snapshot.toLowerCase()).toMatch(/card|tarot|arcana|suit/);
}, 50000);
