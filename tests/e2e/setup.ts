import { beforeAll, afterAll } from "bun:test";

// playwright-cli handles browser/Chromium config via .playwright/cli.config.json
// No Chromium env vars needed here — playwright-cli reads the config automatically.

let serverProcess: any;

beforeAll(async () => {
  console.log("Starting test server...");

  serverProcess = Bun.spawn(["bun", "run", "src/index.ts"], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });

  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log("Test server started on port 3000");
});

afterAll(() => {
  console.log("Stopping test server...");
  if (serverProcess) {
    serverProcess.kill();
  }
});
