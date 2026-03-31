# moverrr — Task Tracking Rules

Hard rules for `todolist.md` and `completed.md`. Every AI session and human working on this project follows these exactly.

---

## The Two Files

| File | Purpose |
|------|---------|
| `todolist.md` | Single source of truth for what is NOT done yet. Work from top to bottom by priority. |
| `completed.md` | Permanent log of what IS done. Never delete entries. Only add. |

Both files live at the **project root** (`/Users/kiranghimire/Documents/moverrr/`). Do not move them.

---

## todolist.md Rules

### Format for every item
```
- [ ] **ID** — Title
  - **File(s):** exact path(s) or "new file: path"
  - **What:** one sentence describing the change
  - **Why:** one sentence on the user/business impact
  - **Done when:** specific, verifiable outcome (e.g. "npm run check passes", "returns 400 on invalid input")
```

### Priority levels (use these headers exactly)
- `## 🔴 P0 — Production Blocking` — data loss, payment errors, security holes. Fix before any real users.
- `## 🟠 P1 — User-Facing Bugs` — broken flows, wrong data shown, crashes.
- `## 🟡 P2 — UX & Conversion` — directly affects carrier posting rate or customer booking rate.
- `## 🟢 P3 — Enhancements` — operational tools, polish, trust builders.
- `## ⚪ P4 — Post-MVP / Deferred` — good ideas, not now. Documented so they aren't lost.

### Rules
1. **Never mark an item done in this file.** Move it to `completed.md` and delete it from here.
2. **Never add vague items.** Every item must have a file path and a "Done when" check.
3. **No duplicates.** Before adding, search for the item first.
4. **Sort within each priority section** by estimated impact, highest first.
5. **Keep P4 items short** — one line each, no implementation detail. They are placeholders.
6. **After every AI session:** remove items that were completed, add any new items discovered.
7. **Target 120–180 items total.** Over 200 means we're not shipping fast enough.
8. **After `npm run check` passes and changes are committed:** move the item immediately.

### Item ID convention
- `A` = API / backend
- `B` = Browser / frontend UI
- `C` = iOS / mobile compliance
- `D` = Database / schema
- `E` = Enhancement (prefix with S=supply, D=demand, P=platform, A=admin, Q=quality)
- `V` = Visual / design system
- `X` = External / infra / devops

---

## completed.md Rules

### Format for every entry
```
### `COMP-YYYY-MM-DD-NN` — Short title
- **When:** YYYY-MM-DD
- **By:** Human / Codex / Claude / Scheduled task
- **Files changed:** list of exact paths
- **Why it mattered:** one sentence on business/user impact
- **What was done:** 2–5 bullet points, specific enough to understand without reading the code
- **Verification:** how it was confirmed working
```

### Rules
1. **Never delete entries.** Add a `[SUPERSEDED by COMP-...]` note if a later task replaces an earlier one.
2. **Number sequentially** within each date. Never reuse a number.
3. **One entry per logical unit of work,** not per file changed. A feature with 8 files changed is one entry.
4. **Include the "Why it mattered"** — this is the most important line for future context.
5. **Group by date** with a `## YYYY-MM-DD` heading.

---

## Moving an item

When a task is complete:

1. Delete the item from `todolist.md`
2. Add an entry to `completed.md` following the format above
3. Commit both files together: `chore: move [ID] to completed`

That's it. No other ceremony.

---

## Design principles for this project (inform all tasks)

**Product:** Browse-first spare-capacity marketplace. Carriers post existing trips. Customers book spare space. NOT a removalist company, NOT real-time dispatch, NOT a quote engine.

**Visual direction:** Perplexity-clean (narrow column, low clutter, information-dense) + Uber-bold (high-contrast numbers, black/white primary palette, confident typography). This is NOT an Uber clone — no maps, no surge pricing, no live tracking at MVP.

**iOS-first:** Web is for testing. Every decision is made for iPhone first. 44px tap targets. No hover-only states. `capture="environment"` on proof uploads. Safe area insets on sticky elements.

**Pricing model (MVP):** 15% commission from carrier on base price + $5 flat booking fee from customer. Do NOT change this without an explicit task and discussion. Review the flat fee structure after 50+ completed jobs.

**Priority order:** Trust → Simplicity → Supply speed → Customer clarity → Automation → Polish.
