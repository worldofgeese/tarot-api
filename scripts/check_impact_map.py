#!/usr/bin/env python3
"""EX-005: Impact Map validation script."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts import validate_file

REQUIRED_SECTIONS = [
    ("Impact Map header", r"^## Impact Map|^##.*Impact Map.*EX-005"),
    ("Files likely to modify", r"Files [Ll]ikely to [Mm]odify"),
    ("Symbols/surfaces likely affected", r"Symbols.*[Ll]ikely [Aa]ffected"),
    ("Blast radius", r"Blast [Rr]adius"),
    ("Dependencies affected", r"Dependencies [Aa]ffected"),
]


if __name__ == "__main__":
    task_file = sys.argv[1] if len(sys.argv) > 1 else "TASK.md"
    sys.exit(validate_file(task_file, REQUIRED_SECTIONS))
