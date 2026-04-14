/**
 * playwright-config.ts — shared Playwright launch config for bun:test E2E tests
 * Reads from /home/node/.openclaw/devbox-env/.playwright/cli.config.json
 * This is the canonical source — never hardcode executablePath or args.
 */

import { readFileSync } from "fs";
import type { LaunchOptions } from "playwright";

const CONFIG_PATH = "/home/node/.openclaw/devbox-env/.playwright/cli.config.json";

interface CliConfig {
  browser?: {
    launchOptions?: LaunchOptions;
  };
}

function loadLaunchOptions(): LaunchOptions {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const config: CliConfig = JSON.parse(raw);
    return config.browser?.launchOptions ?? {};
  } catch {
    // Fallback if config not found — should not happen
    console.warn("playwright-config: could not read cli.config.json, using defaults");
    return {
      executablePath: "/home/node/.openclaw/devbox-env/.devbox/nix/profile/default/bin/chromium",
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    };
  }
}

export const launchOptions: LaunchOptions = loadLaunchOptions();
