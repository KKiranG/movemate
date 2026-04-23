# MoveMate Task Rules

The live task system is GitHub-first. The universal contract is [`AGENTS.md`](AGENTS.md); the full work OS runbook is [`.claude/project-ops.md`](.claude/project-ops.md).

## Quick Reference

- Claim work through shaped GitHub issues with lane + lock group labels
- One build agent per lock group unless the issue says `Safe for parallelism: yes`
- Derived digests (`docs/operations/todolist.md`, `docs/operations/completed.md`) are read-only snapshots — never write as transactional state
- Review packet required for every non-trivial PR — template at `.claude/review-packet-template.md`
- If work changes product truth or operational truth, sync docs in the same issue or PR

For product invariants, parallelism lanes, lock groups, review model, and escalation: see [`AGENTS.md`](AGENTS.md).
For issue lifecycle, review pipeline, founder digest, and scheduled-agent rules: see [`.claude/project-ops.md`](.claude/project-ops.md).
