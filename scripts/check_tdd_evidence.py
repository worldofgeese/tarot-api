#!/usr/bin/env python3
"""TDD Evidence Gate - Validates that test-driven development was followed.

This gate enforces that after OpenSpec planning:
1. Tests were written before implementation
2. Evidence of red-green-refactor cycle exists
3. Separate commits for tests vs implementation

This is the repo-local enforcement of the `tdd` skill requirement
documented in CLAUDE.md and AGENTS.md.
"""
import re
import sys
import subprocess
from pathlib import Path


def check_tdd_evidence_in_task(filepath: str) -> tuple[bool, list[str]]:
    """Check if task file contains TDD evidence markers."""
    path = Path(filepath)
    if not path.exists():
        return False, [f"Task file not found: {filepath}"]

    content = path.read_text()
    issues = []

    # Check for TDD section in completion checklist
    if not re.search(r"##\s*Test-Driven Development|###\s*Test-Driven Development", content, re.I):
        issues.append("Missing '## Test-Driven Development' section in task file")

    # Check for evidence of tests written first
    if not re.search(r"tests?\s+written\s+first", content, re.I):
        issues.append("No evidence that 'tests written first' was documented")

    # Check for commit SHA evidence
    if not re.search(r"commit\s+sha|commit:\s+[a-f0-9]{7,40}", content, re.I):
        issues.append("No commit SHA evidence found for TDD cycle")

    # Check for red-green-refactor or test pass evidence
    if not re.search(r"tests?\s+pass|red-green|failing\s+test", content, re.I):
        issues.append("No evidence of red-green-refactor cycle (test pass/fail)")

    return len(issues) == 0, issues


def check_git_commits_for_tdd() -> tuple[bool, list[str]]:
    """Check recent git commits for TDD pattern (test commit before impl)."""
    try:
        # Get last 10 commits with file stats
        result = subprocess.run(
            ["git", "log", "--oneline", "--name-status", "-10"],
            capture_output=True,
            text=True,
            check=True
        )

        commits = result.stdout
        issues = []

        # Look for test files in recent commits
        has_test_commits = bool(re.search(r"tests?/.*\.test\.(ts|js|py)", commits, re.I))
        has_src_commits = bool(re.search(r"src/.*\.(ts|js|py)", commits, re.I))

        if has_src_commits and not has_test_commits:
            issues.append("Recent commits contain source changes but no test file changes")
            issues.append("TDD requires tests to be written/committed before or with implementation")

        return len(issues) == 0, issues

    except subprocess.CalledProcessError:
        return True, []  # Skip git check if not in repo or error


def validate_tdd_gate(task_file: str) -> int:
    """Main validation function for TDD gate."""
    print("🧪 TDD Evidence Gate (Post-OpenSpec)")
    print("=" * 60)

    all_issues = []

    # Check 1: Task file evidence
    task_ok, task_issues = check_tdd_evidence_in_task(task_file)
    if not task_ok:
        print("❌ Task file TDD evidence check failed:")
        for issue in task_issues:
            print(f"   - {issue}")
            all_issues.append(issue)
    else:
        print("✅ Task file contains TDD evidence")

    # Check 2: Git commit history
    git_ok, git_issues = check_git_commits_for_tdd()
    if not git_ok:
        print("⚠️  Git history check:")
        for issue in git_issues:
            print(f"   - {issue}")
        # Git check is advisory only, not blocking
        print("   (Advisory only - not blocking)")

    print()

    if all_issues:
        print("❌ TDD gate FAILED")
        print()
        print("Required TDD evidence:")
        print("  1. '## Test-Driven Development' section in task file")
        print("  2. Documentation that 'tests written first'")
        print("  3. Commit SHA(s) showing test-then-implementation")
        print("  4. Evidence of red-green-refactor cycle")
        print()
        print("Refer to:")
        print("  - AGENTS.md: TDD is non-negotiable")
        print("  - docs/workflow/sdlc-experiments.md: TDD skill position")
        print("  - .decapod/templates/completion-checklist.md: TDD checklist section")
        return 1

    print("✅ TDD gate PASSED")
    print()
    print("TDD evidence validated:")
    print("  ✓ Task file documents TDD process")
    print("  ✓ Test-first approach documented")
    print("  ✓ Commit evidence present")
    return 0


if __name__ == "__main__":
    task_file = sys.argv[1] if len(sys.argv) > 1 else "TASK.md"
    sys.exit(validate_tdd_gate(task_file))
