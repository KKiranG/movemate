# Review Packet Template

```md
## Verdict
- approve / revise / duplicate / block / escalate

## Issue match
- linked issue:
- matches stated outcome: yes / no / partial

## Invariant scan

**product shape:**
- Flow is need-first, not browse-first (customer declares need, system returns ranked offers): yes / no / partial
- No direct-contact or off-platform drift added to customer-facing flows: yes / no / partial
- Match result cards still show why the match fits (explanation-backed, not price-only): yes / no / partial

**pricing:**
- `src/lib/pricing/breakdown.ts` not modified, or if modified is consistent with canonical rule (commission on basePriceCents only): yes / no / partial
- No detour-cost pricing, no flat booking-fee resurrection, no new pricing economic change: yes / no
- If pricing changed: founder resolution on blueprint-vs-code conflict is in place: yes / no / N/A

**booking / dispute:**
- Booking state machine intact: declare need → ranked offers → Request to Book or Fast Match → driver decision → proof → confirmation → payout release: yes / no / partial
- Fast Match revokes sibling requests atomically: yes / no / N/A
- Payment authorized before acceptance, captured on acceptance, released only after confirmation or proof-backed auto-release window: yes / no / N/A

**trust / safety:**
- Access, stairs, helper, and parking details remain matching inputs (not optional polish): yes / no / N/A
- Proof upload is required before payout release: yes / no / N/A
- No new path allows payout without proof or timeout-based auto-release: yes / no / N/A

**mobile / iOS:**
- Tap targets remain usable at 375px viewport: yes / no / N/A
- Sticky actions respect safe areas: yes / no / N/A
- One clay focal point per screen; primary CTAs are ink-led unless a component pattern says otherwise: yes / no / N/A

## Overlap scan
- overlapping issue or PR:
- lock-group collision:

## Scope drift check
- touched files fit issue scope: yes / no / partial
- unexpected surfaces:

## Risk scan
- user risk:
- operational risk:
- deployment risk:

## Validation credibility
- direct automated:
- targeted manual:
- not rerun / env blocked:

## Founder decision needed
- yes / no

## Founder decision packet (fill only if yes above)
- decision:
- why now:
- options:
- recommended default:
- risk if we wait:

## Residual risk
```
