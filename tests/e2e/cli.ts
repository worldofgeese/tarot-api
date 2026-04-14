/**
 * cli.ts — playwright-cli wrapper for bun:test E2E tests
 *
 * playwright-cli is the ONLY browser automation interface in this workspace.
 * No chromium.launch(), no page objects, no Playwright Node.js API.
 *
 * Each test runs a sequence of playwright-cli commands as a single shell script
 * (open → goto → snapshot → close) to ensure session state persists between calls.
 */

import { spawnSync } from "bun";
import { randomBytes } from "crypto";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const NODE = "/nix/store/yqkhp0j27pk15yd2wmqjkjbglwaa5z1l-nodejs-slim-22.22.1/bin/node";
const PW_CLI_JS = "/home/node/.openclaw/npm-global/lib/node_modules/@playwright/cli/playwright-cli.js";
const PW_CONFIG = "/home/node/.openclaw/devbox-env/.playwright/cli.config.json";
const PW_CMD = `${NODE} ${PW_CLI_JS} --config=${PW_CONFIG}`;

export type SessionResult = { snapshot: string; title: string; url: string };

/**
 * Run a complete playwright-cli session as a single shell script.
 * Commands run sequentially in one process group — session state persists.
 */
export function runSession(url: string, extraCommands: string[] = []): SessionResult {
  const sessionId = `t-${randomBytes(3).toString("hex")}`;
  const scriptPath = join(tmpdir(), `pw-session-${sessionId}.sh`);
  const snapshotFile = join(tmpdir(), `pw-snapshot-${sessionId}.txt`);

  const commands = [
    `${PW_CMD} -s=${sessionId} open`,
    `${PW_CMD} -s=${sessionId} goto ${url}`,
    ...extraCommands.map(cmd => `${PW_CMD} -s=${sessionId} ${cmd}`),
    `${PW_CMD} -s=${sessionId} snapshot > ${snapshotFile} 2>&1`,
    `${PW_CMD} -s=${sessionId} close`,
  ].join("\n");

  writeFileSync(scriptPath, `#!/bin/bash\nset -e\n${commands}\n`, { mode: 0o755 });

  const result = spawnSync({
    cmd: ["/bin/bash", scriptPath],
    stdout: "pipe",
    stderr: "pipe",
    timeout: 30000,
  });

  let snapshot = "";
  try {
    snapshot = require("fs").readFileSync(snapshotFile, "utf-8");
    unlinkSync(snapshotFile);
  } catch { /* no snapshot file */ }
  try { unlinkSync(scriptPath); } catch { /* cleanup */ }

  const allOutput = (result.stdout?.toString() ?? "") + snapshot;

  // Extract title and URL from playwright-cli output
  const titleMatch = allOutput.match(/Page Title: (.+)/);
  const urlMatch = allOutput.match(/Page URL: (.+)/);

  return {
    snapshot: allOutput,
    title: titleMatch?.[1]?.trim() ?? "",
    url: urlMatch?.[1]?.trim() ?? "",
  };
}

/**
 * Run a session with a click action before snapshot.
 * Delegates to runSession with an extra click command.
 */
export function runSessionWithClick(url: string, locator: string): SessionResult {
  return runSession(url, [`click "${locator}"`]);
}

/** Count occurrences of a string in output */
export function countInSnapshot(snapshot: string, pattern: string): number {
  return (snapshot.match(new RegExp(pattern, "g")) ?? []).length;
}
