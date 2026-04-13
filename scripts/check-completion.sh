#!/bin/bash
# Check Completion Checklist validation script (EX-007)
# Validates that task brief has completion checklist with all items marked complete

set -e

TASK_FILE="${1:-TASK.md}"

if [ ! -f "$TASK_FILE" ]; then
  echo "❌ Task file not found: $TASK_FILE"
  echo "Usage: $0 <task-file>"
  exit 1
fi

echo "Checking Completion Checklist in $TASK_FILE..."

# Check if completion checklist exists
if ! grep -iE "## Completion Checklist|Completion Checklist \(EX-007\)" "$TASK_FILE" > /dev/null 2>&1; then
  echo "❌ Completion Checklist validation failed: No '## Completion Checklist' section found"
  echo ""
  echo "Refer to .decapod/templates/completion-checklist.md for template"
  exit 1
fi

# Count total checklist items
TOTAL_ITEMS=$(grep -E "^\s*-\s*\[[ xX]\]" "$TASK_FILE" | wc -l)

# Count completed items (marked with [x] or [X])
COMPLETED_ITEMS=$(grep -E "^\s*-\s*\[[xX]\]" "$TASK_FILE" | wc -l)

# Count incomplete items (marked with [ ])
INCOMPLETE_ITEMS=$(grep -E "^\s*-\s*\[ \]" "$TASK_FILE" | wc -l)

if [ "$TOTAL_ITEMS" -eq 0 ]; then
  echo "❌ Completion Checklist validation failed: No checklist items found"
  echo ""
  echo "Expected checklist items like:"
  echo "  - [ ] Item description"
  echo "  - [x] Completed item"
  echo ""
  echo "Refer to .decapod/templates/completion-checklist.md for template"
  exit 1
fi

echo "Completion status: $COMPLETED_ITEMS/$TOTAL_ITEMS items completed"

if [ "$INCOMPLETE_ITEMS" -gt 0 ]; then
  echo "⚠️  Completion Checklist has $INCOMPLETE_ITEMS incomplete items:"
  echo ""
  grep -E "^\s*-\s*\[ \]" "$TASK_FILE" | head -10
  echo ""
  echo "Note: This is a warning, not a failure. Complete all items before marking task done."
  exit 0
else
  echo "✅ Completion Checklist validation passed: All $TOTAL_ITEMS items completed"

  # Check for required evidence sections
  REQUIRED_EVIDENCE=(
    "Self-[Rr]eview [Cc]oncerns"
    "[Ee]vidence"
  )

  MISSING_EVIDENCE=()

  for evidence in "${REQUIRED_EVIDENCE[@]}"; do
    if ! grep -iE "$evidence" "$TASK_FILE" > /dev/null 2>&1; then
      MISSING_EVIDENCE+=("$evidence")
    fi
  done

  if [ ${#MISSING_EVIDENCE[@]} -gt 0 ]; then
    echo "⚠️  Evidence sections missing:"
    for evidence in "${MISSING_EVIDENCE[@]}"; do
      echo "  - $evidence"
    done
    echo ""
    echo "Recommended: Document self-review concerns and provide evidence links"
  fi

  exit 0
fi
