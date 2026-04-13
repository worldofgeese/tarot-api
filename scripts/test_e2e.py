#!/usr/bin/env python3
"""E2E test runner with proper Playwright environment setup."""
import subprocess
import time
import sys
from pathlib import Path

SERVER_PORT = 3000
STARTUP_TIMEOUT = 30


def wait_for_server(port: int, timeout: int) -> bool:
    for _ in range(timeout):
        try:
            result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", f"http://localhost:{port}"],
                capture_output=True, text=True, timeout=2
            )
            if result.stdout.strip() in ("200", "301", "302"):
                return True
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
            pass
        time.sleep(1)
    return False


def run_e2e_tests() -> int:
    print("Starting test server...")
    server_proc = subprocess.Popen(
        ["bun", "run", "src/index.ts"],
        cwd=Path(__file__).parent.parent
    )

    try:
        print("Waiting for server to be ready...")
        if not wait_for_server(SERVER_PORT, STARTUP_TIMEOUT):
            print("❌ Error: Server failed to start after 30 seconds")
            return 1

        print("✅ Server ready on port 3000")
        print("Running E2E tests...")

        playwright_env_script = "/home/node/.openclaw/devbox-env/lib/playwright-env.sh"
        playwright_cmd = f"source {playwright_env_script} && bun test tests/e2e/"

        result = subprocess.run(
            ["bash", "-c", playwright_cmd],
            cwd=Path(__file__).parent.parent
        )

        return result.returncode

    finally:
        print(f"Stopping test server (PID: {server_proc.pid})...")
        server_proc.terminate()
        try:
            server_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_proc.kill()
            server_proc.wait()


if __name__ == "__main__":
    sys.exit(run_e2e_tests())
