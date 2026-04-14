import { test, expect } from "bun:test";
import { cli, openSession, closeSession, gotoAndSnapshot, countInSnapshot } from "./cli";

test("landing page shows 78 card tiles", () => {
  const session = openSession();
  try {
    const snapshot = gotoAndSnapshot(session, "http://localhost:3000");
    // card-tile appears once per card in the snapshot
    const count = countInSnapshot(snapshot, "card-tile");
    expect(count).toBe(78);
  } finally {
    closeSession(session);
  }
});

test("landing page has correct title", () => {
  const session = openSession();
  try {
    const snapshot = gotoAndSnapshot(session, "http://localhost:3000");
    expect(snapshot).toContain("Tarot");
  } finally {
    closeSession(session);
  }
});

test("card tiles are clickable and navigate to card detail", () => {
  const session = openSession();
  try {
    gotoAndSnapshot(session, "http://localhost:3000");
    // Click the first card-tile element
    cli(session, "click", "getByRole('link', { name: /card/i })");
    const afterSnapshot = cli(session, "snapshot");
    // Should now be on a /card/:id page
    expect(afterSnapshot).toMatch(/\/card\/\d+|card-name|The Fool/);
  } finally {
    closeSession(session);
  }
}, 45000);
