/**
 * cli.ts — playwright-cli wrapper for bun:test E2E tests
 *
 * playwright-cli is the ONLY browser automation interface in this workspace.
 * No `import { chromium } from "playwright"`, no chromium.launch(), no page objects.
 * All browser interaction goes through `devbox run playwright-cli <cmd>`.
 *
 * playwright-cli reads .playwright/cli.config.json automatically, which sets:
 *   - executablePath: Nix Chromium binary
 *   - --no-sandbox, --disable-dev-shm-usage, --disable-gpu
 *
 * Usage in tests:
 *   import { cli, openSession, closeSession } from "./cli";
 *   const session = openSession();
 *   cli(session, "goto", "http://localhost:3000");
 *   const snap = cli(session, "snapshot");
 *   cli(session, "screenshot");
 *   closeSession(session);
 */

import { spawnSync } from "bun";
import { randomBytes } from "crypto";

const DEVBOX = "/home/node/.openclaw/devbox-env";
const PW_CLI = "playwright-cli";

export type Session = { id: string };

/** Open a new isolated playwright-cli browser session */
export function openSession(): Session {
  const id = `test-${randomBytes(4).toString("hex")}`;
  return { id };
}

/** Run a playwright-cli command in a named session. Returns stdout as string. */
export function cli(session: Session, ...args: string[]): string {
  const result = spawnSync({
    cmd: ["devbox", "run", "--", PW_CLI, `-s=${session.id}`, ...args],
    cwd: DEVBOX,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env },
  });

  const out = result.stdout?.toString() ?? "";
  const err = result.stderr?.toString() ?? "";

  if (!result.success && result.exitCode !== 0) {
    // Surface stderr on failure for test diagnosis
    throw new Error(`playwright-cli ${args.join(" ")} failed (exit ${result.exitCode}):\n${err || out}`);
  }

  return out;
}

/** Close the browser session */
export function closeSession(session: Session): void {
  try {
    spawnSync({
      cmd: ["devbox", "run", "--", PW_CLI, `-s=${session.id}`, "close"],
      cwd: DEVBOX,
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch {
    // Best-effort close — don't fail tests on cleanup errors
  }
}

/** Navigate and wait for page to settle. Returns snapshot output. */
export function gotoAndSnapshot(session: Session, url: string): string {
  cli(session, "goto", url);
  return cli(session, "snapshot");
}

/** Count occurrences of a CSS class in snapshot output (rough but effective) */
export function countInSnapshot(snapshot: string, cssClass: string): number {
  const regex = new RegExp(cssClass, "g");
  return (snapshot.match(regex) ?? []).length;
}

/** Assert snapshot contains text */
export function assertContains(snapshot: string, text: string): void {
  if (!snapshot.includes(text)) {
    throw new Error(`Expected snapshot to contain "${text}" but it didn't.\nSnapshot:\n${snapshot.slice(0, 500)}`);
  }
}
