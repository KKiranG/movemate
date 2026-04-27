---
name: carrier-quality-review
description: Review weak listings, low-trust carrier surfaces, and poor proof quality with an activation-plus-trust lens.
when_to_use: Use when carrier quality, listing completeness, proof style, or trust gaps need review.
background: true
---

# Carrier Quality Review

## Load Context

Read the carrier's trip listing, profile, and any recent proof uploads before scoring.

## Methodology

Score each listing on five signals:

1. **Route specificity** — Is the corridor believable? No "anywhere in Australia" sweep trips. Origin and destination suburbs must be real places on a plausible route.
2. **Rules completeness** — Stairs, helper/handling policy, space size, and accepted item categories must all be set. Defaults without customisation are a warning sign.
3. **Proof quality** — Evidence-led means: date and time visible, the actual item visible, carrier vehicle or business name in frame. Generic stock photos, before/after home shots, or photos with no item visible are disqualifying.
4. **Trust signals** — Business name, vehicle make/model, review count, and profile photo add trust. Vague copy ("professional service", "reliable team") with no specifics subtracts it.
5. **Handling clarity** — Does the carrier's written description match the handling policy in their rules? A "solo" listing offering "full move management" is a contradiction.

## Verdicts

- **keep** — Route is specific, rules are fully set, proof is evidence-led, no contradictions.
- **improve now** — One or more weak signals. Name exactly what to fix (e.g. "no item in proof photo", "stairs policy not set", "route too broad").
- **block from browse** — Listing is unverifiable, route is implausible, proof is fabricated or missing, or description contradicts rules.

## Output Format

```
Listing: <id or title>
Carrier: <business name>

Scores:
- Route specificity: pass / warn / fail — reason
- Rules completeness: pass / warn / fail — reason
- Proof quality: pass / warn / fail — reason
- Trust signals: pass / warn / fail — reason
- Handling clarity: pass / warn / fail — reason

Verdict: keep / improve now / block from browse
Action: <what carrier must fix, or empty if keep>
```
