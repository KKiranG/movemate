#!/bin/bash
# Stop hook: remind Claude to sync docs when agent-runtime files changed this session.

cd "${CLAUDE_PROJECT_DIR}"

# Collect changed files (staged + unstaged + untracked vs HEAD)
changed="$(
  git diff --name-only HEAD 2>/dev/null
  git diff --name-only --cached 2>/dev/null
  git status --short 2>/dev/null | awk '{print $2}'
)"

doc_changed=false
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  case "$file" in
    CLAUDE.md|TASK-RULES.md)
      doc_changed=true; break ;;
    .claude/agents.md|.claude/operating-system.md|.claude/command-catalog.md|.claude/capability-index.md)
      doc_changed=true; break ;;
    .claude/agents/*.md|.claude/skills/*/SKILL.md|.claude/rules/*.md)
      doc_changed=true; break ;;
    .agent-skills/*.md)
      doc_changed=true; break ;;
  esac
done <<< "$changed"

if [[ "$doc_changed" == "true" ]]; then
  echo ""
  echo "Session ended with agent-runtime doc changes. Verify before closing:"
  echo "  - CLAUDE.md and operating-system.md reflect current truth"
  echo "  - capability-index.md matches current agents and skills"
  echo "  - docs/operations/todolist.md updated if behavior or commands changed"
  echo "  - No stale paths or duplicate truth introduced"
fi

exit 0
