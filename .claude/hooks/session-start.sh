#!/bin/bash
# session-start.sh - Executed when a Claude Code session starts
# Purpose: Initialize SDLC environment, detect tools, and print pipeline state

set -euo pipefail

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SDLC Orchestrator Session Start ===${NC}"
echo

# Check if .sdlc/config.json exists
if [ -f .sdlc/config.json ]; then
  echo -e "${GREEN}✓${NC} SDLC config detected"
  
  # Source config values as environment variables
  export SDLC_PROJECT_NAME=$(jq -r '.project.name' .sdlc/config.json)
  export SDLC_DEFAULT_BRANCH=$(jq -r '.project.defaultBranch // "main"' .sdlc/config.json)
  
  echo "  Project: $SDLC_PROJECT_NAME"
  echo "  Default branch: $SDLC_DEFAULT_BRANCH"
  echo
else
  echo -e "${YELLOW}⚠${NC}  No .sdlc/config.json found"
  echo "  This directory is not configured for SDLC orchestration"
  echo
fi

# Check for active pipeline state
if [ -f .sdlc/pipeline-state.json ]; then
  echo -e "${GREEN}✓${NC} Active pipeline state detected"
  echo
  
  # Parse pipeline state
  RUN_ID=$(jq -r '.runId // "unknown"' .sdlc/pipeline-state.json)
  CURRENT_PHASE=$(jq -r '.currentPhase // "none"' .sdlc/pipeline-state.json)
  STATUS=$(jq -r '.status // "RUNNING"' .sdlc/pipeline-state.json)
  START_TIME=$(jq -r '.startTime // "unknown"' .sdlc/pipeline-state.json)
  
  echo "  Pipeline Run ID: $RUN_ID"
  echo "  Current Phase:   $CURRENT_PHASE"
  echo "  Status:          $STATUS"
  echo "  Started:         $START_TIME"
  echo
  
  # Show completed phases
  COMPLETED_PHASES=$(jq -r '.completedPhases[]?' .sdlc/pipeline-state.json 2>/dev/null || echo "")
  
  if [ -n "$COMPLETED_PHASES" ]; then
    echo "  Completed phases:"
    while IFS= read -r phase; do
      echo "    • $phase"
    done <<< "$COMPLETED_PHASES"
    echo
  fi
  
  # Show gate results summary
  GATE_RESULTS=$(jq -r '.gateResults | keys[]?' .sdlc/pipeline-state.json 2>/dev/null || echo "")
  
  if [ -n "$GATE_RESULTS" ]; then
    echo "  Gate results:"
    while IFS= read -r gate; do
      verdict=$(jq -r ".gateResults[\"$gate\"].verdict // \"N/A\"" .sdlc/pipeline-state.json)
      score=$(jq -r ".gateResults[\"$gate\"].score // \"N/A\"" .sdlc/pipeline-state.json)
      
      if [ "$verdict" = "PASS" ]; then
        echo -e "    ${GREEN}✓${NC} $gate: $verdict (score: $score)"
      elif [ "$verdict" = "FAIL" ]; then
        echo -e "    ${YELLOW}✗${NC} $gate: $verdict (score: $score)"
      elif [ "$verdict" = "SKIP" ]; then
        echo -e "    ⊘ $gate: $verdict"
      else
        echo "    • $gate: $verdict (score: $score)"
      fi
    done <<< "$GATE_RESULTS"
    echo
  fi
  
  # Export pipeline state as environment variable
  export SDLC_RUN_ID="$RUN_ID"
  export SDLC_CURRENT_PHASE="$CURRENT_PHASE"
  export SDLC_STATUS="$STATUS"
  
  if [ "$STATUS" = "PAUSED" ] || [ "$STATUS" = "RUNNING" ]; then
    echo -e "${YELLOW}→${NC} Pipeline is resumable. Use ${BLUE}/sdlc-orchestrator${NC} to continue."
    echo
  fi
fi

# Detect available tools
echo "Detecting available SDLC tools:"

detect_tool() {
  local tool=$1
  local command=$2
  local config_key=$3
  
  if command -v "$command" &> /dev/null; then
    version=$("$command" --version 2>&1 | head -1 || echo "unknown")
    echo -e "  ${GREEN}✓${NC} $tool"
    
    # Set environment variable
    export "SDLC_TOOL_${config_key^^}=true"
    return 0
  else
    echo -e "  ${YELLOW}✗${NC} $tool (not available)"
    export "SDLC_TOOL_${config_key^^}=false"
    return 1
  fi
}

detect_tool "SoulForge" "soulforge" "soulforge" || true
detect_tool "Decapod" "decapod" "decapod" || true
detect_tool "Swamp" "swamp" "swamp" || true
detect_tool "Cook" "cook" "cook" || true
detect_tool "ByteRover" "brv" "byterover" || true
detect_tool "fj-ex (Forge Junction)" "fj-ex" "fjex" || true
detect_tool "Playwright" "playwright" "playwright" || true

echo

# Query ByteRover for relevant patterns (if enabled and available)
if [ "$SDLC_TOOL_BYTEROVER" = "true" ] && [ -f .sdlc/config.json ]; then
  BRV_ENABLED=$(jq -r '.project.tools.byterover // false' .sdlc/config.json)
  
  if [ "$BRV_ENABLED" = "true" ]; then
    echo "Querying ByteRover for relevant patterns..."
    
    # Get current branch or recent commits to query patterns
    QUERY_CONTEXT=$(git log -1 --pretty=%B 2>/dev/null || echo "sdlc pipeline")
    
    # Query for patterns (limit to 5 to avoid spam)
    if brv query --query "$QUERY_CONTEXT" --limit 5 --format json > /tmp/brv-patterns.json 2>/dev/null; then
      PATTERN_COUNT=$(jq '. | length' /tmp/brv-patterns.json 2>/dev/null || echo 0)
      
      if [ "$PATTERN_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Found $PATTERN_COUNT relevant patterns in ByteRover"
        echo "  Use 'cat /tmp/brv-patterns.json' to view"
        echo
      fi
    fi
  fi
fi

# Print quick start commands
echo -e "${BLUE}Quick start commands:${NC}"
echo "  ${BLUE}/sdlc-orchestrator${NC}  - Start or resume the full SDLC pipeline"
echo "  ${BLUE}/sdlc-spec${NC}         - Run specification phase"
echo "  ${BLUE}/sdlc-design${NC}       - Run design phase"
echo "  ${BLUE}/sdlc-implement${NC}    - Run implementation phase"
echo "  ${BLUE}/sdlc-evidence${NC}     - Collect and query gate evidence"
echo

# Check for CLAUDE.md or AGENTS.md
if [ -f CLAUDE.md ]; then
  echo -e "${GREEN}✓${NC} CLAUDE.md found (project context available)"
fi

if [ -f AGENTS.md ]; then
  echo -e "${GREEN}✓${NC} AGENTS.md found (agent guidance available)"
fi

echo
echo -e "${BLUE}=== Session initialized ===${NC}"
