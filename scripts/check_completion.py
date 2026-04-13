#!/usr/bin/env python3
"""EX-007: Completion Checklist validation script."""
import re
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts import count_checklist_items

REQUIRED_EVIDENCE = [
    ("Self-review concerns", r"Self-[Rr]eview [Cc]oncerns"),
    ("Evidence links", r"[Ee]vidence"),
]


def validate_completion(filepath: str) -> int:
    path = Path(filepath)
    if not path.exists():
        print(f"❌ Task file not found: {filepath}")
        print("Usage: python scripts/check_completion.py <task-file>")
        return 1

    content = path.read_text()

    if not re.search(r"## Completion Checklist|Completion Checklist.*EX-007", content, re.I):
        print("❌ Completion Checklist validation failed: No '## Completion Checklist' section found")
        print()
        print("Refer to .decapod/templates/completion-checklist.md for template")
        return 1

    total, completed, incomplete = count_checklist_items(content)

    if total == 0:
        print("❌ Completion Checklist validation failed: No checklist items found")
        print()
        print("Expected checklist items like:")
        print("  - [ ] Item description")
        print("  - [x] Completed item")
        print()
        print("Refer to .decapod/templates/completion-checklist.md for template")
        return 1

    print(f"Completion status: {completed}/{total} items completed")

    if incomplete > 0:
        print(f"⚠️  Completion Checklist has {incomplete} incomplete items")
        print()
        print("Note: This is a warning, not a failure. Complete all items before marking task done.")
        for match in re.finditer(r"^\s*-\s*\[ \].*$", content, re.MULTILINE):
            print(f"  {match.group().strip()}")
            if len(content.splitlines()) > 10:
                print("  ... (truncated)")
                break
        return 0

    print(f"✅ Completion Checklist validation passed: All {total} items completed")

    missing_evidence = []
    for desc, pattern in REQUIRED_EVIDENCE:
        if not re.search(pattern, content, re.I):
            missing_evidence.append(desc)

    if missing_evidence:
        print("⚠️  Evidence sections missing:")
        for desc in missing_evidence:
            print(f"  - {desc}")
        print()
        print("Recommended: Document self-review concerns and provide evidence links")

    return 0


if __name__ == "__main__":
    task_file = sys.argv[1] if len(sys.argv) > 1 else "TASK.md"
    sys.exit(validate_completion(task_file))
