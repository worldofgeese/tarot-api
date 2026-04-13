#!/usr/bin/env python3
"""Decapod Validation Gate - Hard block on validation failure.

This script enforces the Decapod governance requirement:
'Never claim done without `decapod validate` passing.'

Runs decapod validate and fails hard if validation does not pass.
This makes the Cook gate step a load-bearing enforcement point.
"""
import sys
import subprocess
from pathlib import Path


def run_decapod_validate() -> tuple[int, str, str]:
    """Run decapod validate and return exit code, stdout, stderr."""
    try:
        result = subprocess.run(
            ["decapod", "validate"],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return 1, "", "ERROR: decapod validate timed out after 30 seconds"
    except FileNotFoundError:
        return 1, "", "ERROR: decapod command not found in PATH"
    except Exception as e:
        return 1, "", f"ERROR: {str(e)}"


def check_decapod_validation() -> int:
    """Main validation function - blocks if decapod validate fails."""
    print("🔒 Decapod Validation Gate")
    print("=" * 60)
    print("Running: decapod validate")
    print()

    returncode, stdout, stderr = run_decapod_validate()

    if stdout:
        print(stdout)
    if stderr:
        print(stderr, file=sys.stderr)

    print()

    if returncode == 0:
        print("✅ Decapod validation PASSED")
        print()
        print("Governance contract satisfied:")
        print("  ✓ Decapod validation succeeded")
        print("  ✓ Repository state is valid")
        return 0
    else:
        print("❌ Decapod validation FAILED")
        print()
        print("Governance contract violated:")
        print("  ✗ Decapod validation did not pass")
        print()
        print("This is a HARD BLOCK. From AGENTS.md:")
        print('  "Never claim done without `decapod validate` passing."')
        print()
        print("Required actions:")
        print("  1. Review decapod validation errors above")
        print("  2. Fix validation failures")
        print("  3. Re-run validation: decapod validate")
        print("  4. Only proceed when validation passes")
        print()
        print("Refer to:")
        print("  - AGENTS.md: Golden Rules #3")
        print("  - core/DECAPOD.md: Validation contracts")
        return 1


if __name__ == "__main__":
    sys.exit(check_decapod_validation())
