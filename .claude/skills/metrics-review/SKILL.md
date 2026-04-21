---
name: metrics-review
description: Review MoveMate metrics with a decision-first marketplace lens instead of producing passive summaries.
when_to_use: Use when admin metrics, funnel data, experiment results, or supply-demand numbers need interpretation.
argument-hint: [period: YYYY-MM-DD|metric: funnel|supply|demand|dispute]
---

# Metrics Review

Use `$ARGUMENTS` to scope to a period or metric type (e.g. `supply`, `funnel`, `2026-04-09`).

## Load First

Before reviewing, orient with live context:

```bash
git log --oneline -5
```

Then read `.agent-skills/ADMIN.md` and `.agent-skills/OVERVIEW.md` for current decision thresholds and metric definitions.

## Review Steps

1. State the baseline.
2. Identify the most decision-relevant movement.
3. Recommend one or two actions.
4. Name uncertainty and metric quality issues.

Prefer decisions over summaries. One clear action beats three observations.
