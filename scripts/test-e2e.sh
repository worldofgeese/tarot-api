#!/bin/bash
# E2E test runner with proper LD_LIBRARY_PATH setup for Playwright

set -e

# Source the playwright environment setup
source /home/node/.openclaw/devbox-env/lib/playwright-env.sh

# Cleanup function to kill server on exit
cleanup() {
  if [ -n "$SERVER_PID" ]; then
    echo "Stopping test server (PID: $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start the server in background
echo "Starting test server..."
bun run src/index.ts &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "Server ready on port 3000"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Error: Server failed to start after 30 seconds"
    exit 1
  fi
  sleep 1
done

# Run the E2E tests
echo "Running E2E tests..."
bun test tests/e2e/

# Capture test exit code
TEST_EXIT_CODE=$?

# Cleanup will run automatically via trap
exit $TEST_EXIT_CODE
