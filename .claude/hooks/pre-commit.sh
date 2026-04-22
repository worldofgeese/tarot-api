#!/bin/bash
# Pre-Commit Hook — TDD Enforcement and Lightweight Validation

set -e

echo "🔒 Pre-Commit Hook — SDLC Quality Checks"
echo

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR)

if [ -z "$STAGED_FILES" ]; then
    echo "⚠ No staged files to check"
    exit 0
fi

echo "📝 Staged files:"
echo "$STAGED_FILES" | sed 's/^/  /'
echo

# Check for Python files
PYTHON_FILES=$(echo "$STAGED_FILES" | grep '\.py$' || true)

if [ -n "$PYTHON_FILES" ]; then
    echo "🐍 Python Files Detected — Running ruff check"
    
    if command -v ruff &> /dev/null; then
        if ! ruff check $PYTHON_FILES; then
            echo
            echo "❌ Ruff check failed"
            echo "   Fix issues or run: ruff check --fix"
            exit 1
        fi
        echo "  ✓ Ruff check passed"
    else
        echo "  ⚠ ruff not found (skipping lint)"
    fi
    echo
fi

# Run gate0-lint.py (zero-LLM lint) if available
if [ -f gate0-lint.py ] || command -v gate0-lint.py &> /dev/null; then
    echo "🎯 Running gate0-lint (zero-LLM validation)"
    
    GATE0_CMD="gate0-lint.py"
    if [ -f gate0-lint.py ]; then
        GATE0_CMD="python gate0-lint.py"
    fi
    
    if ! $GATE0_CMD $STAGED_FILES 2>/dev/null; then
        echo
        echo "❌ gate0-lint found issues"
        echo "   Review and fix before committing"
        exit 1
    fi
    echo "  ✓ gate0-lint passed"
    echo
fi

# TDD Enforcement — Check for implementation without prior test commit
COMMIT_MSG_FILE="$1"
if [ -n "$COMMIT_MSG_FILE" ] && [ -f "$COMMIT_MSG_FILE" ]; then
    COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")
    
    # Check if this is an implementation commit
    if echo "$COMMIT_MSG" | grep -qE '^(feat|fix|refactor):'; then
        echo "🧪 TDD Check — Verifying test-first discipline"
        
        # Get last commit message
        LAST_COMMIT=$(git log -1 --pretty=%B 2>/dev/null || echo "")
        
        # Check if last commit was a test commit
        if ! echo "$LAST_COMMIT" | grep -qE '^test:'; then
            # Check if tests are in this commit
            TEST_FILES=$(echo "$STAGED_FILES" | grep -E 'test.*\.(py|js|ts|go|rs)$|.*\.test\.(py|js|ts|go|rs)$|.*_test\.(py|js|ts|go|rs)$' || true)
            
            if [ -z "$TEST_FILES" ]; then
                echo
                echo "❌ TDD VIOLATION DETECTED"
                echo "   You are committing implementation (feat/fix/refactor) without:"
                echo "   1. A prior 'test:' commit with failing tests, OR"
                echo "   2. Test files in this commit"
                echo
                echo "   TDD requires: failing tests → commit → implementation → commit"
                echo
                echo "   To fix:"
                echo "   - Unstage this commit"
                echo "   - Add tests in a separate 'test:' commit first"
                echo "   - Then commit the implementation"
                echo
                echo "   Or to force commit (NOT RECOMMENDED):"
                echo "   git commit --no-verify"
                exit 1
            else
                echo "  ⚠ Test files found in implementation commit"
                echo "    Prefer separate 'test:' commit, but allowing..."
            fi
        else
            echo "  ✓ Prior 'test:' commit found"
        fi
        echo
    fi
fi

# Check for failing tests before "implement" phase commits
if echo "$COMMIT_MSG" | grep -qiE 'implement|feat:.*implement'; then
    echo "🧪 Test Status Check"
    
    # Detect test command based on project
    TEST_CMD=""
    if [ -f package.json ]; then
        TEST_CMD="npm test"
    elif [ -f Cargo.toml ]; then
        TEST_CMD="cargo test"
    elif [ -f go.mod ]; then
        TEST_CMD="go test ./..."
    elif [ -f pyproject.toml ] || [ -f setup.py ]; then
        TEST_CMD="pytest"
    fi
    
    if [ -n "$TEST_CMD" ]; then
        echo "  Running: $TEST_CMD"
        if ! $TEST_CMD 2>&1 | head -20; then
            echo
            echo "⚠ Tests are failing"
            echo "  This is expected for 'test:' commits (failing tests first)"
            echo "  For 'feat:' commits, tests should pass"
            echo
            # Don't block — just warn
        else
            echo "  ✓ Tests passed"
        fi
    else
        echo "  ⚠ Could not detect test command (skipping)"
    fi
    echo
fi

echo "✅ Pre-commit checks passed"
exit 0
