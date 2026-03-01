/**
 * Preload script to set LD_LIBRARY_PATH for Playwright E2E tests
 * This is loaded before E2E tests run to ensure Chromium can find required libraries
 */

import { spawnSync } from "bun";

// Run the playwright-env.sh script and capture its environment
const result = spawnSync({
  cmd: ["bash", "-c", "source /home/node/.openclaw/devbox-env/lib/playwright-env.sh && env"],
  stdout: "pipe",
  stderr: "pipe",
});

if (result.success) {
  const output = result.stdout.toString();
  const lines = output.split("\n");

  // Parse environment variables from the script output
  for (const line of lines) {
    if (line.startsWith("LD_LIBRARY_PATH=")) {
      const value = line.substring("LD_LIBRARY_PATH=".length);
      process.env.LD_LIBRARY_PATH = value;
      console.log("✓ LD_LIBRARY_PATH set for Playwright");
    } else if (line.startsWith("PLAYWRIGHT_LD_LIBRARY_PATH=")) {
      const value = line.substring("PLAYWRIGHT_LD_LIBRARY_PATH=".length);
      process.env.PLAYWRIGHT_LD_LIBRARY_PATH = value;
    }
  }
} else {
  console.error("Warning: Failed to source playwright-env.sh");
  console.error(result.stderr.toString());
}
