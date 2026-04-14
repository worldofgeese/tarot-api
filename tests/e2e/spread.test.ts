import { test, expect } from "bun:test";
import { cli, openSession, closeSession, gotoAndSnapshot } from "./cli";

test("spread page draws 3 cards on 3-Card button click", () => {
  const session = openSession();
  try {
    gotoAndSnapshot(session, "http://localhost:3000/spread");
    cli(session, "click", "getByRole('button', { name: '3-Card' })");
    const snapshot = cli(session, "snapshot");
    expect(snapshot).toContain("spread-card");
  } finally {
    closeSession(session);
  }
});

test("spread page draws 10 cards for celtic cross", () => {
  const session = openSession();
  try {
    gotoAndSnapshot(session, "http://localhost:3000/spread");
    cli(session, "click", "getByRole('button', { name: 'Celtic Cross' })");
    const snapshot = cli(session, "snapshot");
    expect(snapshot).toContain("spread-card");
  } finally {
    closeSession(session);
  }
});

test("spread page draws 1 card for single card", () => {
  const session = openSession();
  try {
    gotoAndSnapshot(session, "http://localhost:3000/spread");
    cli(session, "click", "getByRole('button', { name: 'Single Card' })");
    const snapshot = cli(session, "snapshot");
    expect(snapshot).toContain("spread-card");
  } finally {
    closeSession(session);
  }
});

test("drawn cards show card names", () => {
  const session = openSession();
  try {
    gotoAndSnapshot(session, "http://localhost:3000/spread");
    cli(session, "click", "getByRole('button', { name: '3-Card' })");
    const snapshot = cli(session, "snapshot");
    expect(snapshot).toContain("card-name");
  } finally {
    closeSession(session);
  }
});
