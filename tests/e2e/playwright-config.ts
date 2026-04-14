/**
 * playwright-config.ts — documents the Playwright env var setup for E2E tests.
 *
 * The correct pattern in this workspace:
 *   - setup.ts sets PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to the Nix Chromium binary
 *   - chromium.launch() picks it up automatically — no executablePath in launch() calls
 *   - cli.config.json is the source of truth for the path
 *
 * Do NOT pass executablePath or custom args in chromium.launch() calls.
 * Do NOT use playwright-cli's config file directly in tests.
 * Just: chromium.launch() — setup.ts handles the rest.
 */

export {}; // keep as module
