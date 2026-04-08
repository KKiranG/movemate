#!/bin/bash
set -euo pipefail

payload="$(cat)"

command="$(
  printf '%s' "$payload" | python3 -c '
import json
import sys

try:
    payload = json.load(sys.stdin)
except json.JSONDecodeError:
    print("")
    raise SystemExit(0)

tool_input = payload.get("tool_input") or {}
print(tool_input.get("command", ""))
'
)"

normalize() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g'
}

normalized="$(normalize "$command")"

deny() {
  printf 'Blocked Bash command: %s\n' "$1" >&2
  exit 2
}

if [[ -z "$normalized" ]]; then
  exit 0
fi

if [[ "$normalized" =~ (^|[[:space:]])git[[:space:]]+push[[:space:]]+--force([[:space:]]|$) ]]; then
  deny "git push --force is disabled in this repo."
fi

if [[ "$normalized" =~ (^|[[:space:]])git[[:space:]]+push[[:space:]]+-f([[:space:]]|$) ]]; then
  deny "git push -f is disabled in this repo."
fi

if [[ "$normalized" =~ (^|[[:space:]])git[[:space:]]+reset[[:space:]]+--hard([[:space:]]|$) ]]; then
  deny "git reset --hard is disabled in this repo."
fi

if [[ "$normalized" == *"rm -rf /"* ]]; then
  deny "rm -rf / is disabled in this repo."
fi

if [[ "$normalized" == *"drop table"* ]]; then
  deny "DROP TABLE commands must be reviewed manually."
fi

if [[ "$normalized" == *"delete from"* ]] && [[ "$normalized" != *" where "* ]]; then
  deny "DELETE FROM without WHERE is blocked."
fi

if [[ "$normalized" == *"supabase db reset"* ]] && [[ ! "$normalized" =~ (^|[[:space:]])allow_supabase_reset=1([[:space:]]|$) ]]; then
  deny "supabase db reset requires ALLOW_SUPABASE_RESET=1."
fi

exit 0
