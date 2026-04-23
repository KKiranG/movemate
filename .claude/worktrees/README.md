# Worktree Lifecycle Policy

Worktrees in this directory are isolated git worktrees created by Claude Code, Codex, or gstack for parallel branch work.

## Policy

- **Creation:** Created automatically by agent tooling. Do not create them manually.
- **Lifespan:** One implementation session. Once the branch is merged or abandoned, clean up.
- **Cleanup:** Run `git worktree prune` to remove stale metadata. Delete the directory manually if the branch is already gone from remote.
- **Do not modify:** Do not edit files inside a worktree from any other session. Cross-worktree edits produce divergent history.
- **Antigravity:** This entire directory is excluded from Antigravity indexing via `.antigravityignore`. Worktree copies do not contribute to indexed repo context.

## Check Active Worktrees

```bash
git worktree list
```
