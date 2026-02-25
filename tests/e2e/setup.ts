import { beforeAll, afterAll } from "bun:test";

let serverProcess: any;

beforeAll(async () => {
  console.log("Starting test server...");

  // Start the server
  serverProcess = Bun.spawn(["bun", "run", "src/index.ts"], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log("Test server started on port 3000");
});

afterAll(() => {
  console.log("Stopping test server...");
  if (serverProcess) {
    serverProcess.kill();
  }
});
