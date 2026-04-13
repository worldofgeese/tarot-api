#!/usr/bin/env python3
"""EX-006: Design Boundaries validation script."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts import validate_file

REQUIRED_SECTIONS = [
    ("Design Boundaries header", r"^## Design Boundaries|^##.*Design Boundaries.*EX-006"),
    ("In scope", r"In [Ss]cope"),
    ("Out of scope", r"Out of [Ss]cope"),
    ("Explicit non-goals", r"Non-[Gg]oals|Explicit Non-Goals"),
    ("Scope creep triggers", r"Scope [Cc]reep"),
]


if __name__ == "__main__":
    task_file = sys.argv[1] if len(sys.argv) > 1 else "TASK.md"
    sys.exit(validate_file(task_file, REQUIRED_SECTIONS))
