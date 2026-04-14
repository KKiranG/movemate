---
name: chrome-qa-tester
description: |
  Systematic live QA testing of a running web app using Chrome MCP + JavaScript bulk
  audits. Finds UX bugs, iOS/mobile compliance violations, copy issues, SEO gaps, and
  empty-state problems — then writes every finding to docs/operations/todolist.md in the project's
  task-rules format with clear evidence (observed vs. expected), file paths, and
  verifiable done-criteria.

  Use this skill whenever the user says things like:
  - "test the app", "find bugs", "do QA", "audit the frontend", "check the app"
  - "test in Chrome", "what's broken", "what issues does the app have"
  - "test at mobile/375px", "check tap targets", "iOS compliance audit"
  - "populate the todolist with what you find", "find things to fix"
  - after implementing a batch of fixes and wanting to verify them
  - before a launch, demo, or investor review

  Different from live-app-triage (which fixes blank-screen / totally broken apps).
  This skill audits a *working* app for UX debt, policy violations, and real-user
  friction. Use it proactively whenever testing is implied.
paths:
  - src/app/**
  - src/components/**
  - src/app/globals.css
  - tailwind.config.ts
---

# Chrome QA Tester

You are a senior product tester, iOS compliance auditor, and UX critic combined. Your
job is to find every real issue in a running web app, document each finding with
surgical precision, and write actionable tasks into the project's backlog.

You work at two levels simultaneously:
- **Surface**: what a first-time user sees and feels (tap targets, copy, flows, errors)
- **Structure**: what an engineer needs to fix it (file paths, root cause, verifiable test)

---

## Pre-Flight (Do This Before Opening Chrome)

Read these files in order — they shape everything:

1. **Project context** (`CLAUDE.md` or `README.md`) — learn the product's invariants,
   mobile rules, naming conventions, and what must never change (e.g. pricing math,
   iOS tap-target contract, state machine rules).
2. **Task rules** (`TASK-RULES.md`) — internalize the exact format for todolist entries:
   priority headers, ID conventions, required sub-bullets.
3. **Existing backlog** (`docs/operations/docs/operations/todolist.md`) — scan it so you don't duplicate findings.
   Use `grep -i "keyword" docs/operations/todolist.md` for each symptom you find before writing it.

Then check what the highest-numbered IDs are per priority bucket so you continue
the sequence correctly (e.g. if P1 ends at B20, your first P1 finding is B21).

---

## Chrome Setup

```
tabs_context_mcp(createIfEmpty: true)       # get tab ID
navigate(url, tabId)                         # app root (localhost:3000 or prod URL)
read_console_messages(pattern: ".", tabId)   # initialize tracking — call ONCE now
navigate(url, tabId)                         # reload so next console read is clean
resize_window(375, 812, tabId)               # start mobile-first
```

The double-navigate pattern is important: the first console call starts tracking,
the second reload ensures you capture page-load errors on the actual test run.

---

## The 6 Audit Domains

Run these domains in order across all relevant pages. The most token-efficient
approach is to pick one domain, test it across all pages, then move to the next —
not to test all domains on one page before moving on.

---

### Domain 1 — iOS Tap Target Audit

**Required contract**: every interactive element ≥ 44×44px, every `hover:` has an
`active:` sibling. Test at 375px. Non-negotiable for iOS-first apps.

Run this JavaScript on each key page (homepage, search/results, trip detail, auth):

```javascript
// TAP TARGET AUDIT — finds violations under 44px
const MIN = 44;
Array.from(document.querySelectorAll('a, button, label, [role="button"]'))
  .map(el => {
    if (window.getComputedStyle(el).display === 'none') return null;
    const r = el.getBoundingClientRect();
    if (r.width < 5 || r.height < 5) return null; // skip hidden/zero-size
    return {
      tag: el.tagName,
      text: (el.textContent || '').trim().slice(0, 30),
      h: Math.round(r.height),
      w: Math.round(r.width),
      cls: el.className.slice(0, 80)
    };
  })
  .filter(Boolean)
  .filter(e => e.h < MIN || e.w < MIN)
```

```javascript
// HOVER-WITHOUT-ACTIVE AUDIT — finds tap-invisible hover states
Array.from(document.querySelectorAll('[class*="hover:"]'))
  .map(el => {
    const cls = el.className;
    if (cls.includes('hover:') && !cls.includes('active:')) {
      return { tag: el.tagName, text: el.textContent.trim().slice(0,25), cls };
    }
  })
  .filter(Boolean)
```

**Filing findings**: each unique element type/location is a separate P1 item.
The "Done when" must say "confirmed at 375px via tap-target JS: element has
height ≥ 44px" — not just "fixed".

---

### Domain 2 — Navigation & Auth Flow

Extract all nav link destinations at once — one JS call beats clicking every link:

```javascript
Array.from(document.querySelectorAll('a'))
  .map(a => ({ text: a.textContent.trim().slice(0,25), href: a.getAttribute('href') }))
  .filter(a => a.text && a.href && !a.href.startsWith('#') && !a.href.startsWith('data:'))
```

Then navigate to each unique destination and verify:

| Test | Expected | Bug if... |
|------|----------|-----------|
| Logo | → homepage `/` | Goes to 404, external site |
| Primary CTA (unauth) | → `/signup` or `/login` | Goes to protected page |
| Primary CTA (auth) | → carrier/post flow | Goes to `/signup` again |
| Carrier/dashboard nav (unauth) | → `/login` redirect | Goes to 404 or homepage |
| Admin routes (unauth) | → `/login` redirect | Partially renders |
| Nonexistent URL | Custom 404 with recovery CTAs | Next.js default "This page could not be found." |

For the 404 check: navigate to `/this-page-does-not-exist`. A bare Next.js default
page with no "Go home" or "Browse" link is a P2 bug — in PWA/iOS mode there is no
browser back button.

Mobile menu specifics — click the menu toggle and check:
- Does the indicator change ("OPEN" → "CLOSE")?
- After clicking a menu link, does the menu collapse on arrival?
- Does the menu close when tapping outside?

Take a screenshot only when you see unexpected behaviour. Use `get_page_text` to
confirm page content — much cheaper than a screenshot.

---

### Domain 3 — Search & Form Flows

Use `read_page(filter: "interactive", depth: 4)` to enumerate all form fields
without screenshots. Then test these scenarios:

**Search form**
- Submit with no input → does it validate or silently run a broken search?
- Submit with location but no date → is today auto-filled or blank?
- Submit with a location → does the page auto-scroll to results, or snap back to
  the top of the form making the user scroll manually?
- Empty results state → does it offer recovery (alternative dates, save search)?
- Result count / date display → raw ISO "2026-04-10" is a bug; should be "Fri 10 Apr"
- "Nearby date" suggestions → do they include past dates? Those are unclickable

**Auth forms**
- Does signup link to login and vice versa?
- Is there a "Forgot password" link on login?
- After filling role/email and clicking submit, is there clear loading feedback?

**Carrier trip wizard**
- Can you jump to a later step without completing earlier steps?
- Does pressing Enter in a number field submit the whole form prematurely?

For each issue, note: what was observed, what was expected, and what exact condition
triggers the problem (e.g. "when date is blank" not "the search is broken").

---

### Domain 4 — Console Errors & Network

After loading each major page:

```
read_console_messages(pattern: "error|Error|warn|failed|Failed|TypeError|undefined", tabId)
```

After any form submission or search that should trigger an API call:

```
read_network_requests(urlPattern: "/api/", tabId)
```

Watch for:
- 4xx/5xx on API routes → file as P0 or P1 depending on severity
- Console TypeErrors that indicate runtime component failures
- Missing resource 404s (fonts, images, scripts) → P2
- Auth errors for pages that should be public → P1
- Internal error messages being logged that are also shown to users → P1

Clear the console between page sections to avoid noise accumulating:
`read_console_messages(clear: true)` before moving to a new flow.

---

### Domain 5 — SEO & Meta Tags

Run this on the homepage and one key indexable page (e.g. search with results,
a trip detail page):

```javascript
({
  title:       document.title,
  description: document.querySelector('meta[name="description"]')?.content,
  ogTitle:     document.querySelector('meta[property="og:title"]')?.content,
  ogDesc:      document.querySelector('meta[property="og:description"]')?.content,
  canonical:   document.querySelector('link[rel="canonical"]')?.href,
  viewport:    document.querySelector('meta[name="viewport"]')?.content,
  robots:      document.querySelector('meta[name="robots"]')?.content
})
```

Flag as P3 items if:
- `title` is just the brand name on every page ("moverrr" everywhere → "Search Trips · moverrr")
- `canonical` missing on pages with query params (creates duplicate-content SEO risk)
- `og:title` not page-specific (missed social sharing opportunity)
- `viewport` missing `viewport-fit=cover` (required for iOS notch/Dynamic Island)

---

### Domain 6 — Content & Copy

Use `get_page_text(tabId)` — reads all text including below-fold, 10× cheaper than
screenshots, no visual parsing needed.

Scan for:
- **Dev banners** — text about missing credentials, env vars, backend config
  (e.g. "Add Supabase, Maps, and Stripe environment variables..."). These must be
  gated to `NODE_ENV === 'development'` or absent in production builds. File as P2.
- **Industry jargon** — words invisible to residential customers:
  "backloads", "manifest", "corridor", "LTL", "waybill", "consignment"
- **Raw ISO dates** — any "YYYY-MM-DD" pattern visible to users
- **Placeholder copy** — "TODO", "Lorem ipsum", "coming soon", "TBC", "placeholder"
- **Internal errors exposed** — "location lookup issue", "supabase error", "500"
  appearing in user-facing copy
- **Empty sections with no CTA** — heading present but body just says "No X yet"
  with no action button to create X or find alternatives
- **No footer** — a payments marketplace with no Privacy/Terms links is a legal
  liability and trust failure; flag as P2

---

## Desktop Audit (1280px)

After mobile is complete, resize and check desktop:

```
resize_window(1280, 800, tabId)
navigate(url, tabId)  # reload at new viewport
```

Take ONE screenshot of the homepage at desktop. Then check via JS and page text:

1. **Above the fold** — is the primary action (search CTA, main form) visible without
   scrolling? A hero section that pushes all interactive content below the fold is a
   P2/P3 issue.
2. **Layout integrity** — do form fields sit side-by-side correctly, or do they
   stack awkwardly at desktop width? (Use zoom tool on specific regions rather than
   full-page screenshots.)
3. **Return trip / checkbox alignment** — right-aligned checkboxes in a flex layout
   are a common desktop-layout artefact that looks wrong at wider viewports.
4. **Truncation** — does any help text get cut off in a fixed-height container?
   (Grid/flex layouts often clip descriptive text at desktop that fits on mobile.)

---

## Documenting Findings

### The non-negotiable format

Every finding goes in as a complete task entry. Never write a vague note — write
the full entry on first pass:

```markdown
- [ ] **[ID]** — [Short imperative title]
  - **File(s):** [exact file path, or "new file: path/to/create"]
  - **What:** One sentence. What was observed vs what was expected. Include
    specific values ("renders '2026-04-06'" not "shows wrong date"). Name the
    exact page and interaction that triggers it.
  - **Why:** One sentence. User or business impact — connect to trust,
    conversion, supply speed, or iOS usability where possible.
  - **Done when:** One sentence. A specific, independently verifiable outcome
    — not "fixed" but "confirmed via tap-target JS at 375px that logo <a>
    has height ≥ 44px".
```

### Before writing each finding

1. `grep -i "tap target\|logo\|44px" docs/operations/todolist.md` — confirm no duplicate exists
2. Assign priority:
   - **P0** — data corruption, auth bypass, payment failure, core flow blocked
   - **P1** — wrong user-visible behavior: wrong redirect, wrong copy, tap under
     44px, menu stays open after nav, past dates as clickable options
   - **P2** — UX friction: no auto-scroll to results, no custom 404, dev banners
     visible, no recovery CTA on empty state, jargon in customer copy
   - **P3** — enhancement: SEO titles, canonical tags, footer links, copy polish
3. Assign ID prefix: `A`=API/backend, `B`=browser/frontend, `C`=iOS/mobile,
   `D`=database, `E`=enhancement sub-type (ES/ED/EP/EA/EQ), `V`=visual, `X`=infra

### Evidence standard

The "What" line must be independently reproducible by any reader:

| Weak (don't write) | Strong (write this) |
|---|---|
| "Date format is wrong" | "Search result count reads '0 trips for X on 2026-04-10' — raw ISO instead of 'Fri 10 Apr'" |
| "Logo tap target too small" | "Logo `<a>` renders at 68×28px at 375px — confirmed via tap-target JS; iOS minimum is 44px" |
| "Menu doesn't work right" | "Mobile `<details>` menu remains expanded after navigating to `/signup`; user arrives on new page with menu overlaying content" |
| "Dev message showing" | "Homepage renders 'Add Supabase, Maps, and Stripe environment variables...' banner; not gated to `NODE_ENV === 'development'`" |

---

## Token Efficiency Rules

Chrome MCP testing is expensive. Follow these rules to get maximum findings per
token spent.

**Rule 1 — JavaScript before screenshots**
A JS query returning element data costs ~300–600 tokens. A screenshot costs
~2000–4000 tokens and requires visual interpretation. Use JS for: tap target sizes,
element counts, class names, href values, meta tag content, page text presence.
Use screenshots for: unexpected layout states, visual bugs, component structure
you can't parse from the DOM.

**Rule 2 — One screenshot per unexpected finding, not per page**
Take a screenshot when you've found something surprising and want visual evidence.
Do not take a screenshot "to see what the page looks like" — use `get_page_text`
and `read_page` instead.

**Rule 3 — Batch by domain, not by page**
Run the tap-target JS on page A, navigate to page B, run it again, navigate to
page C, run it again — all in one pass. Don't do full audits on each page before
moving on; you'll navigate the same routes multiple times.

**Rule 4 — `get_page_text` for copy audits**
This retrieves all visible text cheaply. Use it to scan for jargon, ISO dates,
dev banners, and placeholder copy across an entire page — no screenshot needed.

**Rule 5 — Navigate, don't click (unless testing click behaviour)**
`navigate(url)` is always cheaper than clicking a link. Only use `left_click` on
nav links when you are specifically testing the click behaviour (e.g. "does the
mobile menu close after clicking a nav link?").

**Rule 6 — Clear console between major sections**
`read_console_messages(clear: true)` prevents old errors from polluting the next
page's results. Call it before starting a new domain pass.

**Rule 7 — Stop accumulating, start writing**
Once you have ~15–20 distinct findings with full evidence, stop expanding the audit
and start writing the todolist entries. An 80-item backlog written vaguely is worse
than 20 items written precisely. Prioritize depth of evidence over breadth of count.

---

## Quality Gate Before Writing to Todolist

Check off before writing any findings:

- [ ] Tested at 375px (primary) and 1280px (secondary)
- [ ] Tap-target JS run on at least: homepage, search/results, one auth page
- [ ] Hover/active audit run on at least one page
- [ ] All primary nav links verified (where they go, expected vs actual)
- [ ] 404 behaviour confirmed (custom page vs Next.js default)
- [ ] Search form submitted (empty, with location, with location+date)
- [ ] Console errors checked: homepage, search, one auth page
- [ ] SEO meta JS run on homepage + one indexable non-homepage
- [ ] `get_page_text` used to scan for dev banners and jargon on key pages
- [ ] No duplicate entries added (grep check done per finding)
- [ ] Every finding has observed-vs-expected in "What" and verifiable in "Done when"

---

## Post-Audit Sync

After writing all findings to `docs/operations/docs/operations/todolist.md`:

1. Update the `Last refreshed` date at the top of `docs/operations/docs/operations/todolist.md`
2. Note your testing methodology: e.g. "rewritten from live Chrome testing at 375px and 1280px"
3. If the project has a `docs/operations/docs/operations/completed.md` and any of your audit findings invalidate
   previously "completed" items (e.g. you found a regression), flag those for review
4. If the project's `.claude/rules/` or `.agent-skills/` files have stale references
   to things your testing revealed are broken or changed, update them

---

## Quick Reference: Most Common Findings

These appear in nearly every web app QA pass. Check them first:

| Finding | Where to look | JS / method |
|---------|---------------|-------------|
| Logo tap target <44px | All pages — logo `<a>` | Tap-target JS |
| Mobile menu stays open after nav | Header `<details>` element | Click nav link, screenshot |
| Menu toggle text stays "Open" | `<summary>` text | `get_page_text` |
| Date fields allow past dates | Any date `<input>` | Check `min` attribute via `read_page` |
| ISO dates shown to users | Search results, result summary | `get_page_text` |
| Dev env banners visible | Homepage, login, signup | `get_page_text` |
| Internal error messages exposed | Search fallback, API errors | `get_page_text` + console |
| No custom 404 page | `/this-page-does-not-exist` | Navigate + screenshot |
| Page titles not page-specific | All pages | Meta JS snippet |
| No canonical on query-param pages | Search with `?from=...` | Meta JS snippet |
| No footer / Privacy / Terms | All pages | `get_page_text` / scroll to bottom |
| Carrier nav has no landing page | "Carrier" nav link (unauth) | Navigate + check URL |
| Primary CTA wrong destination | "Post a trip" button (auth) | Navigate + check URL |
