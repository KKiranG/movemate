---
name: queue-hygiene
description: Keep the MoveMate Ready queue clean — remove duplicates, unstick blocked issues, enforce issue shape, and surface the next ranked work unit so builders can claim without ambiguity.
when_to_use: Use weekly, before a planning session, or when the queue looks stale, duplicated, or full of vague issues that builders cannot safely claim.
effort: medium
allowed-tools: [Bash, Read]
---

# Queue Hygiene

Use this skill to maintain the GitHub issue queue so builders can always claim the top Ready item without guessing.

## Step 1 — Load The Current Queue

```bash
# All open issues with state
gh issue list --repo KKiranG/moverrr --state open --limit 100 \
  --json number,title,labels,body \
  --jq '.[] | "#\(.number) \(.title) [\(.labels | map(.name) | join(","))]"'
```

## Step 2 — Check For Duplicates

For each pair of open issues, flag if:
- Titles are clearly the same work unit
- Outcomes or acceptance criteria overlap substantially
- One issue is a subset of another

Resolution: comment on the duplicate pointing to the canonical issue, then close it with label `type:duplicate`.

```bash
gh issue close <NUMBER> --repo KKiranG/moverrr \
  --comment "Duplicate of #<CANONICAL>. Closing in favor of the canonical issue." \
  --label type:duplicate
```

## Step 3 — Check Ready Issue Shape

A `state:ready` issue must have ALL of the following or it is not ready:

- [ ] Outcome (not just a task description)
- [ ] Lane named (one of the 10 lanes)
- [ ] Lock group named (one of the 7)
- [ ] Priority set (p0–p4)
- [ ] Verification plan (not "TBD")
- [ ] Safe for parallelism stated

If any field is missing, move the issue from `state:ready` back to `state:shaping` and add a comment naming the missing fields.

```bash
gh issue edit <NUMBER> --repo KKiranG/moverrr \
  --remove-label "state:ready" \
  --add-label "state:shaping" \
  --add-comment "Moved back to shaping: missing [field list]. Needs reshaping before it can be claimed."
```

## Step 4 — Check Blocked Issues

For each `state:blocked` issue:
- Is the blocker still real? Check whether the blocking issue or PR has been resolved.
- If unblocked: remove `state:blocked`, add `state:ready`, add a comment explaining why.
- If still blocked: confirm the blocking issue number is referenced in the body.

```bash
gh issue edit <NUMBER> --repo KKiranG/moverrr \
  --remove-label "state:blocked" \
  --add-label "state:ready"
```

## Step 5 — Check Lock-Group Conflicts

Identify any issues in `state:in-progress` or `state:pr-open` that share a lock group with a `state:ready` issue.

If two active issues share a lock group and neither is marked `Safe for parallelism: yes`, flag the conflict in a comment on the lower-priority one.

## Step 6 — Produce The Sorted Ready Queue

Output a sorted list of ready issues by priority:

```bash
gh issue list --repo KKiranG/moverrr --label "state:ready" \
  --json number,title,labels \
  --jq 'sort_by(.labels | map(select(.name | startswith("priority:"))) | first.name) | .[] | "#\(.number) \(.title)"'
```

## Output Format

End with:

```
Duplicates closed: [list or "none"]
Issues moved back to shaping: [list with reason]
Blocked issues resolved: [list or "none"]
Lock-group conflicts flagged: [list or "none"]
Next three Ready items in priority order: [list]
```
