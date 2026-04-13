#!/bin/bash
# Check Design Boundaries validation script (EX-006)
# Validates that task brief contains Design Boundaries section

set -e

TASK_FILE="${1:-TASK.md}"

if [ ! -f "$TASK_FILE" ]; then
  echo "❌ Task file not found: $TASK_FILE"
  echo "Usage: $0 <task-file>"
  exit 1
fi

echo "Checking Design Boundaries in $TASK_FILE..."

# Check for required Design Boundaries sections
REQUIRED_SECTIONS=(
  "^## Design Boundaries|^##.*Design Boundaries.*EX-006"
  "In [Ss]cope"
  "Out of [Ss]cope"
  "Non-[Gg]oals|Explicit Non-Goals"
  "Scope [Cc]reep"
)

MISSING_SECTIONS=()

for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -iE "$section" "$TASK_FILE" > /dev/null 2>&1; then
    MISSING_SECTIONS+=("$section")
  fi
done

if [ ${#MISSING_SECTIONS[@]} -eq 0 ]; then
  echo "✅ Design Boundaries validation passed: All required sections present"
  exit 0
else
  echo "❌ Design Boundaries validation failed: Missing sections"
  echo ""
  echo "Missing sections:"
  for section in "${MISSING_SECTIONS[@]}"; do
    echo "  - $section"
  done
  echo ""
  echo "Expected sections in Design Boundaries:"
  echo "  - ## Design Boundaries"
  echo "  - In scope (must address)"
  echo "  - Out of scope unless required by evidence"
  echo "  - Explicit non-goals"
  echo "  - Scope creep triggers"
  echo ""
  echo "Refer to .decapod/templates/design-boundaries.md for template"
  exit 1
fi
