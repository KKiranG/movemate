#!/bin/bash

if [ ! -d "$HOME/.claude/skills/gstack/bin" ]; then
  cat >&2 <<'MSG'
NOTICE: gstack is not installed globally.

gstack is optional helper tooling for Claude/Codex work in this repo. Continue from AGENTS.md, .claude/project-ops.md, the linked GitHub issue, and repo verification commands.

If you want to use gstack later:
  git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
  cd ~/.claude/skills/gstack && ./setup --team

Then restart your AI coding tool.
MSG
  echo '{"permissionDecision":"allow","message":"gstack is optional and not installed; continue with the repo-native agent contract."}'
  exit 0
fi

echo '{}'
