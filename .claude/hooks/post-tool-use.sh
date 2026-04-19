#!/usr/bin/env bash
# =============================================================================
# post-tool-use.sh — Post-execution processing for tool calls
# Auto-called by Claude Code after Edit/Write execution
#
# Responsibilities:
#   1. Log results to session log
#   2. Quick lint after file edits (optional)
# =============================================================================

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null || echo "")
TOOL_INPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('tool_input',{})))" 2>/dev/null || echo "{}")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

source "$PROJECT_ROOT/harness.config.sh" 2>/dev/null || true

# Extract current worktree name
CURRENT_PATH="$(pwd)"
TASK_NAME=""
if [[ "$CURRENT_PATH" == *"/worktrees/"* ]]; then
  TASK_NAME="$(echo "$CURRENT_PATH" | sed 's|.*/worktrees/||' | cut -d'/' -f1)"
fi

# =============================================================================
# 1. Session log
# =============================================================================
if [[ -n "$TASK_NAME" ]]; then
  SESSION_LOG="${PROJECT_ROOT}/${LOG_DIR:-logs}/sessions/${TASK_NAME}/session.jsonl"
  if [[ -f "$SESSION_LOG" ]]; then
    if [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "Write" ]]; then
      file_path=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null || echo "")
      echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"tool_use\",\"tool\":\"${TOOL_NAME}\",\"file\":$(echo "$file_path" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read().strip()))' 2>/dev/null || echo '""')}" >> "$SESSION_LOG"
    fi
  fi
fi

# =============================================================================
# 2. Quick lint (optional, after Edit/Write)
# Enable by setting QUICK_LINT=true
# =============================================================================
if [[ "${QUICK_LINT:-false}" == "true" && ("$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "Write") ]]; then
  file_path=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null || echo "")

  if [[ -n "$file_path" && -f "$file_path" ]]; then
    ext="${file_path##*.}"

    case "$ext" in
      kt|kts)
        # Kotlin: ktlint single file
        if command -v ktlint &>/dev/null; then
          ktlint "$file_path" 2>/dev/null || true
        fi
        ;;
      ts|tsx|js|jsx)
        # TypeScript: eslint single file
        if command -v eslint &>/dev/null; then
          eslint "$file_path" --quiet 2>/dev/null || true
        fi
        ;;
      py)
        # Python: ruff single file
        if command -v ruff &>/dev/null; then
          ruff check "$file_path" 2>/dev/null || true
        fi
        ;;
    esac
  fi
fi

exit 0
