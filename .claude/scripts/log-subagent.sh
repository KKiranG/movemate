#!/bin/bash
# SubagentStop hook: append a JSONL record for each completed subagent.
# Log file is gitignored. Provides a local session trace for multi-agent observability.

payload="$(cat)"
log_file="${CLAUDE_PROJECT_DIR}/.claude/session-log.jsonl"

timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

agent_type="$(printf '%s' "$payload" | python3 -c '
import json, sys
try:
    p = json.load(sys.stdin)
    print(p.get("agent_type", "unknown"))
except Exception:
    print("unknown")
' 2>/dev/null)"

session_id="$(printf '%s' "$payload" | python3 -c '
import json, sys
try:
    p = json.load(sys.stdin)
    print(p.get("session_id", ""))
except Exception:
    print("")
' 2>/dev/null)"

printf '{"timestamp":"%s","agent_type":"%s","session_id":"%s"}\n' \
  "$timestamp" "$agent_type" "$session_id" \
  >> "$log_file" 2>/dev/null || true

exit 0
