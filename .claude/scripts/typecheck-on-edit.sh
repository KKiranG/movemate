#!/bin/bash
# PostToolUse hook: run tsc --noEmit after any Edit or Write to a TypeScript file.
# Surfaces type errors into Claude's context without blocking the edit.

payload="$(cat)"

file_path="$(
  printf '%s' "$payload" | python3 -c '
import json, sys
try:
    payload = json.load(sys.stdin)
except Exception:
    raise SystemExit(0)
tool_input = payload.get("tool_input") or {}
print(tool_input.get("file_path", ""))
' 2>/dev/null
)"

if [[ -z "$file_path" ]]; then
  exit 0
fi

# Only act on TypeScript files
if [[ "$file_path" != *.ts ]] && [[ "$file_path" != *.tsx ]]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR}"

output="$(npx tsc --noEmit --project tsconfig.json 2>&1)" || {
  echo "TypeScript errors after editing ${file_path}:"
  echo "$output"
  exit 0  # Surface errors but never block the edit
}

exit 0
