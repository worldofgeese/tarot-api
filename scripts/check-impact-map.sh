#!/bin/bash
# Check Impact Map validation script (EX-005)
# Validates that task brief contains Impact Map section

set -e

TASK_FILE="${1:-TASK.md}"

if [ ! -f "$TASK_FILE" ]; then
  echo "❌ Task file not found: $TASK_FILE"
  echo "Usage: $0 <task-file>"
  exit 1
fi

echo "Checking Impact Map in $TASK_FILE..."

# Check for required Impact Map sections
REQUIRED_SECTIONS=(
  "^## Impact Map|^##.*Impact Map.*EX-005"
  "Files [Ll]ikely to [Mm]odify"
  "Symbols.*[Ll]ikely [Aa]ffected"
  "Blast [Rr]adius"
  "Dependencies [Aa]ffected"
)

MISSING_SECTIONS=()

for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -iE "$section" "$TASK_FILE" > /dev/null 2>&1; then
    MISSING_SECTIONS+=("$section")
  fi
done

if [ ${#MISSING_SECTIONS[@]} -eq 0 ]; then
  echo "✅ Impact Map validation passed: All required sections present"
  exit 0
else
  echo "❌ Impact Map validation failed: Missing sections"
  echo ""
  echo "Missing sections:"
  for section in "${MISSING_SECTIONS[@]}"; do
    echo "  - $section"
  done
  echo ""
  echo "Expected sections in Impact Map:"
  echo "  - ## Impact Map"
  echo "  - Files likely to modify"
  echo "  - Symbols / surfaces likely affected"
  echo "  - Blast radius"
  echo "  - Dependencies affected"
  echo ""
  echo "Refer to .decapod/templates/impact-map.md for template"
  exit 1
fi
