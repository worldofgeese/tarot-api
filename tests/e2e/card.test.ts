import { test, expect } from "bun:test";
import { cli, openSession, closeSession, gotoAndSnapshot } from "./cli";

test("card detail page renders all fields", () => {
  const session = openSession();
  try {
    const snapshot = gotoAndSnapshot(session, "http://localhost:3000/card/0");
    expect(snapshot).toContain("card-name");
    expect(snapshot).toContain("upright");
    expect(snapshot).toContain("reversed");
  } finally {
    closeSession(session);
  }
});

test("card detail page shows The Fool for id 0", () => {
  const session = openSession();
  try {
    const snapshot = gotoAndSnapshot(session, "http://localhost:3000/card/0");
    expect(snapshot).toContain("The Fool");
  } finally {
    closeSession(session);
  }
});

test("invalid card id shows error page", () => {
  const session = openSession();
  try {
    const snapshot = gotoAndSnapshot(session, "http://localhost:3000/card/999");
    // Either a 404 status or an error message in the page
    expect(snapshot).toMatch(/404|not found|error/i);
  } finally {
    closeSession(session);
  }
});
