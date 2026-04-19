#!/usr/bin/env bash
# =============================================================================
# pre-tool-use.sh — Pre-execution validation for tool calls
# Auto-called by Claude Code before Bash/Edit/Write execution
#
# Input: JSON event via STDIN
# Output: exit 0 = allow / exit 1 = block / exit 2 = warn (proceed anyway)
# =============================================================================

# Parse event
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null || echo "")
TOOL_INPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('tool_input',{})))" 2>/dev/null || echo "{}")

# =============================================================================
# 1. Log event to session log
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

source "$PROJECT_ROOT/harness.config.sh" 2>/dev/null || true

# Extract current worktree name from path
CURRENT_PATH="$(pwd)"
TASK_NAME=""
if [[ "$CURRENT_PATH" == *"/worktrees/"* ]]; then
  TASK_NAME="$(echo "$CURRENT_PATH" | sed 's|.*/worktrees/||' | cut -d'/' -f1)"
fi

if [[ -n "$TASK_NAME" ]]; then
  SESSION_LOG="${PROJECT_ROOT}/${LOG_DIR:-logs}/sessions/${TASK_NAME}/session.jsonl"
  if [[ -f "$SESSION_LOG" ]]; then
    # Log tool use event
    cmd_preview=$(echo "$TOOL_INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
cmd = d.get('command', d.get('file_path', d.get('path', '')))
print(str(cmd)[:80])
" 2>/dev/null || echo "")

    echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"pre_tool\",\"tool\":\"${TOOL_NAME}\",\"preview\":$(echo "$cmd_preview" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read().strip()))' 2>/dev/null || echo '""')}" >> "$SESSION_LOG"
  fi
fi

# =============================================================================
# 2. Warn on edits outside worktree
# =============================================================================
if [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "Write" ]]; then
  file_path=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null || echo "")

  # Detect direct edits to core files in the main project root
  if [[ -n "$file_path" ]]; then
    abs_path=$(realpath "$file_path" 2>/dev/null || echo "$file_path")
    project_root_real=$(realpath "$PROJECT_ROOT" 2>/dev/null || echo "$PROJECT_ROOT")

    # Attempting to edit src/ files outside a worktree
    if [[ "$CURRENT_PATH" != *"/worktrees/"* ]] && [[ "$abs_path" == "$project_root_real/src/"* ]]; then
      cat >&2 <<EOF

[HARNESS WARNING] pre-tool-use.sh
  Attempting to edit source code outside a worktree.

  Current path: $CURRENT_PATH
  Target file:  $file_path

  Recommended approach:
  1. Create a worktree with ./scripts/task-start.sh <task-name>
  2. Work inside the worktree
  3. Validate and merge with ./scripts/task-finish.sh <task-name>

  To proceed, use a worktree or dismiss this warning.

EOF
      # exit 2 = warn but do not block (user decides)
      exit 2
    fi
  fi
fi

# =============================================================================
# 3. Block dangerous Bash commands
# =============================================================================
if [[ "$TOOL_NAME" == "Bash" ]]; then
  command=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command',''))" 2>/dev/null || echo "")

  # Block force push
  if echo "$command" | grep -qE "git push.*--force|git push.*-f "; then
    cat >&2 <<EOF

[HARNESS BLOCKED] pre-tool-use.sh
  Force push has been blocked.

  Command: $command

  Reason: Force push can destroy team history.
  Alternative: Use rebase or merge commits instead.

EOF
    exit 1
  fi

  # Block recursive delete
  if echo "$command" | grep -qE "rm -rf /|rm -rf \$HOME"; then
    cat >&2 <<EOF

[HARNESS BLOCKED] pre-tool-use.sh
  Dangerous delete command has been blocked.

  Command: $command

EOF
    exit 1
  fi
fi

exit 0
