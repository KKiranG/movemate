---
name: copy-guardian
description: Audit customer and carrier copy for trust clarity and wedge drift toward quoting, dispatch, or removalist language.
when_to_use: Use when changing empty states, reassurance copy, profile language, pricing explanations, or message templates.
---

# Copy Guardian

## Audit Workflow

1. Read the changed copy surface: empty states, reassurance blocks, pricing explanations, profile copy, message templates.
2. Flag any of the following drift patterns:
   - **Quote-engine drift** — "get a quote", "request a quote", "compare quotes", "quote from carriers"
   - **Dispatch drift** — "we'll dispatch", "our team will", "we send movers", "we'll arrange"
   - **Removalist drift** — "professional removalists", "our removalists", "removal service", "removals team"
   - **Vague trust** — "safe and secure", "trusted professionals", "reliable service", "peace of mind" without evidence
   - **Overclaim** — "cheapest", "fastest", "best price guaranteed", "Australia's #1"
3. Check that the spare-capacity model is legible: does the customer understand they are matching with carriers who already have planned trips — not booking a dedicated truck?
4. Check that trust is evidence-led: ratings count, verified badge, specific route history — not generic assurances.

## Verdict

- **approve** — No drift. Model is legible. Trust is evidence-led.
- **rewrite needed** — One or more flags. State the exact phrase and a corrected version.
- **escalate to founder** — The framing change is large enough to affect product positioning.

## Output Format

```
Surface: <component or file name>

Flags:
- "<exact phrase>" — drift type — suggested replacement

Model legibility: clear / unclear — reason if unclear
Trust evidence: present / absent — reason if absent

Verdict: approve / rewrite needed / escalate to founder
```
