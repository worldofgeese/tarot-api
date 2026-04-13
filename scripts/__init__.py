"""SDLC validation framework for Python-only gate layer."""
import re
import sys
from pathlib import Path
from typing import Sequence


def validate_file(filepath: str, checks: Sequence[tuple[str, str]]) -> int:
    """Validate markdown file against required sections.

    Args:
        filepath: Path to markdown file
        checks: Sequence of (description, regex_pattern) tuples

    Returns:
        Exit code (0 = pass, 1 = fail)
    """
    path = Path(filepath)
    if not path.exists():
        print(f"❌ Task file not found: {filepath}")
        print("Usage: python scripts/check_<gate>.py <task-file>")
        return 1

    content = path.read_text()
    missing = []

    for desc, pattern in checks:
        if not re.search(pattern, content, re.IGNORECASE | re.MULTILINE):
            missing.append(desc)

    if missing:
        print(f"❌ Validation failed: Missing sections")
        print()
        print("Missing sections:")
        for desc in missing:
            print(f"  - {desc}")
        return 1

    print("✅ Validation passed: All required sections present")
    return 0


def count_checklist_items(content: str) -> tuple[int, int, int]:
    """Count checklist items in markdown.

    Returns:
        Tuple of (total, completed, incomplete)
    """
    items = re.findall(r"^\s*-\s*\[([ xX])\]", content, re.MULTILINE)
    total = len(items)
    completed = sum(1 for m in items if m.lower() == 'x')
    incomplete = total - completed
    return total, completed, incomplete
