# MoveMate Task Rules

The live task system is GitHub-first. See [`.claude/project-ops.md`](.claude/project-ops.md) for the full work OS: issue lifecycle, review pipeline, lock groups, lanes, builder rules, docs sync responsibility, and scheduled agent limits.

## Quick Reference

- Claim work through shaped GitHub issues with lane + lock group labels
- One build agent per lock group unless the issue says `Safe for parallelism: yes`
- Derived digests (`docs/operations/todolist.md`, `docs/operations/completed.md`) are read-only snapshots — never write as transactional state
- Review packet required for every non-trivial PR — template at `.claude/review-packet-template.md`
- If work changes product truth or operational truth, sync docs in the same issue or PR

For lane definitions, lock groups, lifecycle states, and scheduled agent rules: [`.claude/project-ops.md`](.claude/project-ops.md).
