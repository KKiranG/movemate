# Agent Memory

This directory stores committed project memory for agents that use `memory: project`.

Memory here is not a transcript. It is a compact decision layer for facts that should survive new chats, new tools, and future agent generations without bloating always-loaded context.

## What Belongs Here

- Distilled product decisions that shape multiple future tasks.
- Repeated failure modes that agents should stop rediscovering.
- Short evidence-backed notes that point to the canonical source.
- Superseded decisions with an explicit replacement.

## What Does Not Belong Here

- One-off chat narration.
- Raw founder quotes when a distilled decision is enough.
- Machine-specific setup, local paths, browser exports, or temporary worktree state.
- Detailed specs that already belong in `movemate-product-blueprint.md`, `AGENTS.md`, scoped rules, or GitHub issues.

## Update Rule

When the founder says something that changes durable product or operating truth:

1. Distill it into a short decision record.
2. Put the full authoritative rule in the right canonical file if it affects behavior.
3. Link the decision record to that canonical file or GitHub issue.
4. Mark older conflicting memory as superseded instead of leaving rival truths.

Project-scoped memory belongs here.
Personal or machine-specific memory belongs in `.claude/agent-memory-local/`, which is gitignored.
