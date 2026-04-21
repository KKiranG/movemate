#!/bin/bash

if [ ! -d "$HOME/.claude/skills/gstack/bin" ]; then
  cat >&2 <<'MSG'
BLOCKED: gstack is not installed globally.

gstack is required for Claude skill-driven work in this repo.

Install it:
  git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
  cd ~/.claude/skills/gstack && ./setup --team

Then restart your AI coding tool.
MSG
  echo '{"permissionDecision":"deny","message":"gstack is required but not installed. See stderr for install instructions."}'
  exit 0
fi

echo '{}'
