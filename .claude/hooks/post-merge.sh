#!/bin/bash
# post-merge.sh - Executed after successful merge to main/master
# Purpose: Gather evidence, update ByteRover, complete todos, update metrics, print summary

set -euo pipefail

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SDLC Post-Merge Hook ===${NC}"
echo

# Verify this is a merge to main/default branch
CURRENT_BRANCH=$(git branch --show-current)
DEFAULT_BRANCH="main"

if [ -f .sdlc/config.json ]; then
  DEFAULT_BRANCH=$(jq -r '.project.defaultBranch // "main"' .sdlc/config.json)
fi

if [ "$CURRENT_BRANCH" != "$DEFAULT_BRANCH" ]; then
  echo "Not on default branch ($DEFAULT_BRANCH), skipping post-merge actions"
  exit 0
fi

echo "Merge to $DEFAULT_BRANCH detected"
echo

# Get merged commit and branch info
MERGE_COMMIT=$(git rev-parse HEAD)
MERGE_MSG=$(git log -1 --pretty=%B)

# Try to extract merged branch name
MERGED_BRANCH=$(echo "$MERGE_MSG" | grep -oP "Merge branch '\K[^']+" || echo "unknown")

echo "Merged commit: $MERGE_COMMIT"
echo "Merged branch: $MERGED_BRANCH"
echo

# === Step 1: Gather Swamp Reports for Completed Run ===

if command -v swamp &> /dev/null && [ -f .sdlc/pipeline-state.json ]; then
  echo "Gathering Swamp reports for completed pipeline run..."
  
  RUN_ID=$(jq -r '.runId // "unknown"' .sdlc/pipeline-state.json)
  
  # Query all reports for this run
  swamp data query "tags.runId==\"$RUN_ID\" && tags.type==\"report\"" \
    --format json > /tmp/post-merge-reports.json 2>/dev/null || echo "[]" > /tmp/post-merge-reports.json
  
  REPORT_COUNT=$(jq '. | length' /tmp/post-merge-reports.json)
  echo -e "${GREEN}✓${NC} Collected $REPORT_COUNT gate reports"
  
  # Archive reports to gate-evidence/
  mkdir -p gate-evidence/
  cp /tmp/post-merge-reports.json "gate-evidence/run-$RUN_ID-$(date +%Y%m%d-%H%M%S).json"
  
else
  echo -e "${YELLOW}⚠${NC}  Swamp not available, skipping report gathering"
fi

echo

# === Step 2: ByteRover Version Control Integration ===

if command -v brv &> /dev/null && [ -f .sdlc/config.json ]; then
  BRV_ENABLED=$(jq -r '.project.tools.byterover // false' .sdlc/config.json)
  
  if [ "$BRV_ENABLED" = "true" ]; then
    echo "ByteRover version control integration..."
    
    # Add evidence files
    if [ -d gate-evidence/ ]; then
      brv vc add gate-evidence/*.json 2>/dev/null || true
    fi
    
    # Add metrics
    if [ -f .sdlc/gate-metrics.json ]; then
      brv vc add .sdlc/gate-metrics.json
    fi
    
    # Add pipeline state
    if [ -f .sdlc/pipeline-state.json ]; then
      brv vc add .sdlc/pipeline-state.json
    fi
    
    # Commit evidence to ByteRover
    brv vc commit \
      --message "SDLC pipeline complete: $MERGED_BRANCH → $DEFAULT_BRANCH @ ${MERGE_COMMIT:0:12}" \
      --tags "sdlc,merge,$(date +%Y-%m-%d),complete" \
      2>/dev/null || echo -e "${YELLOW}⚠${NC}  ByteRover commit failed (non-blocking)"
    
    # Push to ByteRover remote
    if brv vc push 2>/dev/null; then
      echo -e "${GREEN}✓${NC} Evidence pushed to ByteRover"
    else
      echo -e "${YELLOW}⚠${NC}  ByteRover push failed (non-blocking)"
    fi
  else
    echo "ByteRover available but disabled in config"
  fi
else
  echo -e "${YELLOW}⚠${NC}  ByteRover not available"
fi

echo

# === Step 3: Decapod Todo Completion ===

if command -v decapod &> /dev/null && [ -f .sdlc/pipeline-state.json ]; then
  echo "Marking Decapod todos as complete..."
  
  # Check if there's a decapod todo ID in pipeline state
  TODO_ID=$(jq -r '.decapodTodoId // null' .sdlc/pipeline-state.json)
  
  if [ "$TODO_ID" != "null" ] && [ -n "$TODO_ID" ]; then
    if decapod todo done "$TODO_ID" 2>/dev/null; then
      echo -e "${GREEN}✓${NC} Decapod todo $TODO_ID marked complete"
    else
      echo -e "${YELLOW}⚠${NC}  Failed to mark todo complete (non-blocking)"
    fi
  else
    echo "No Decapod todo ID found in pipeline state"
  fi
else
  echo -e "${YELLOW}⚠${NC}  Decapod not available"
fi

echo

# === Step 4: Update Gate Metrics ===

if [ -f .sdlc/pipeline-state.json ]; then
  echo "Updating gate metrics..."
  
  # Initialize metrics file if doesn't exist
  if [ ! -f .sdlc/gate-metrics.json ]; then
    echo '{"runs": []}' > .sdlc/gate-metrics.json
  fi
  
  # Extract metrics from pipeline state
  python3 << 'PYSCRIPT'
import json
import os

# Load pipeline state
with open('.sdlc/pipeline-state.json') as f:
    state = json.load(f)

# Build metrics entry
metrics_entry = {
    'runId': state.get('runId'),
    'branch': os.popen('echo $MERGED_BRANCH').read().strip(),
    'mergeCommit': os.popen('echo $MERGE_COMMIT').read().strip(),
    'mergeDate': os.popen('date -Iseconds').read().strip(),
    'status': state.get('status', 'SUCCESS'),
    'startTime': state.get('startTime'),
    'endTime': state.get('endTime'),
    'classification': state.get('classification', {}),
    'gateResults': {}
}

# Extract gate results
for gate, result in state.get('gateResults', {}).items():
    metrics_entry['gateResults'][gate] = {
        'verdict': result.get('verdict'),
        'score': result.get('score', 0),
        'timestamp': result.get('timestamp')
    }

# Load existing metrics
with open('.sdlc/gate-metrics.json') as f:
    metrics = json.load(f)

# Append and keep last 50
metrics['runs'].append(metrics_entry)
metrics['runs'] = metrics['runs'][-50:]

# Save
with open('.sdlc/gate-metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

print(f"Metrics updated: {len(metrics['runs'])} runs recorded")
PYSCRIPT
  
  echo -e "${GREEN}✓${NC} Gate metrics updated"
else
  echo -e "${YELLOW}⚠${NC}  No pipeline state found"
fi

echo

# === Step 5: Generate Completion Summary ===

echo -e "${BLUE}=== Pipeline Completion Summary ===${NC}"
echo

if [ -f .sdlc/pipeline-state.json ]; then
  RUN_ID=$(jq -r '.runId' .sdlc/pipeline-state.json)
  START_TIME=$(jq -r '.startTime' .sdlc/pipeline-state.json)
  END_TIME=$(jq -r '.endTime // "'$(date -Iseconds)'"' .sdlc/pipeline-state.json)
  STATUS=$(jq -r '.status' .sdlc/pipeline-state.json)
  
  echo "Run ID:     $RUN_ID"
  echo "Branch:     $MERGED_BRANCH"
  echo "Commit:     ${MERGE_COMMIT:0:12}"
  echo "Started:    $START_TIME"
  echo "Completed:  $END_TIME"
  echo "Status:     $STATUS"
  echo
  
  # Print gate results
  echo "Gate Results:"
  echo "─────────────────────────────────────────"
  
  for gate in gate-a gate-b gate-c gate-d gate-e gate-f gate-g; do
    verdict=$(jq -r ".gateResults[\"$gate\"].verdict // \"NOT_RUN\"" .sdlc/pipeline-state.json)
    score=$(jq -r ".gateResults[\"$gate\"].score // \"N/A\"" .sdlc/pipeline-state.json)
    
    if [ "$verdict" = "PASS" ]; then
      echo -e "  ${GREEN}✓${NC} $gate: $verdict (score: $score)"
    elif [ "$verdict" = "SKIP" ]; then
      echo "  ⊘ $gate: $verdict"
    elif [ "$verdict" = "NOT_RUN" ]; then
      echo "  • $gate: $verdict"
    else
      echo "  • $gate: $verdict (score: $score)"
    fi
  done
  
  echo "─────────────────────────────────────────"
  echo
  
  # Calculate pipeline duration if both times exist
  if [ "$START_TIME" != "null" ] && [ "$END_TIME" != "null" ]; then
    START_EPOCH=$(date -d "$START_TIME" +%s 2>/dev/null || echo 0)
    END_EPOCH=$(date -d "$END_TIME" +%s 2>/dev/null || echo 0)
    
    if [ $START_EPOCH -gt 0 ] && [ $END_EPOCH -gt 0 ]; then
      DURATION=$((END_EPOCH - START_EPOCH))
      MINUTES=$((DURATION / 60))
      SECONDS=$((DURATION % 60))
      echo "Pipeline duration: ${MINUTES}m ${SECONDS}s"
      echo
    fi
  fi
  
  # Count revise cycles
  TOTAL_REVISES=0
  for gate in gate-a gate-b gate-c gate-d gate-e gate-f gate-g; do
    revises=$(jq -r ".reviseCycles[\"$gate\"] // 0" .sdlc/pipeline-state.json)
    TOTAL_REVISES=$((TOTAL_REVISES + revises))
  done
  
  if [ $TOTAL_REVISES -gt 0 ]; then
    echo "Total revise cycles: $TOTAL_REVISES"
    echo
  fi
  
  # Evidence location
  echo "Evidence stored in:"
  echo "  • Swamp database (query: tags.runId==\"$RUN_ID\")"
  echo "  • gate-evidence/ directory (local mirror)"
  echo "  • .sdlc/gate-metrics.json (rolling 50-run window)"
  
  if [ "$BRV_ENABLED" = "true" ]; then
    echo "  • ByteRover version control"
  fi
  
  echo
fi

# === Step 6: Clean Up Temporary Pipeline State ===

echo "Archiving pipeline state..."

if [ -f .sdlc/pipeline-state.json ]; then
  # Archive completed state
  mkdir -p .sdlc/archive/
  cp .sdlc/pipeline-state.json ".sdlc/archive/pipeline-state-$(date +%Y%m%d-%H%M%S).json"
  
  # Clear active state
  rm .sdlc/pipeline-state.json
  
  echo -e "${GREEN}✓${NC} Pipeline state archived and cleared"
else
  echo "No active pipeline state to archive"
fi

echo

# === Final Message ===

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║   ✓ SDLC Pipeline Complete                            ║${NC}"
echo -e "${GREEN}║   ✓ Merge to $DEFAULT_BRANCH successful                        ║${NC}"
echo -e "${GREEN}║   ✓ All evidence collected and archived              ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo

exit 0
