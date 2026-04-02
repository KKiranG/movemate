# moverrr — Frontier Upgrades And Learnings

Last revised: 2 April 2026 (Sydney)

> Status note (2 April 2026): this file remains the active frontier backlog. Completed work from the current frontier sweep was moved to `completed.md` under `COMP-2026-04-02-36`, `COMP-2026-04-02-37`, and `COMP-2026-04-02-38`. Treat `completed.md` as the source of truth for what shipped; keep unresolved or future frontier work here until it is actually implemented.

## What This First Half Is

This first half converts lessons mainly from:

- `claude code src/CLAUDE_CODE_50_LESSONS.md`
- `claude code src/CLAUDE_CODE_DETAILED_PROJECT_ANALYSIS.md`
- `claw-code-main- src/README.md`
- `claw-code-main- src/PARITY.md`
- `autoresearch/README.md`
- `autoresearch/program.md`

into implementation-ready tasks for moverrr's agent operating system.

This is not about cloning Claude Code.
It is about stealing the highest-signal harness, workflow, verification, and operating-discipline ideas, then translating them into tasks that fit moverrr.

## Product Truth We Must Protect

Before any frontier-style improvement gets built, ask:

1. Does this make moverrr better at being a browse-first spare-capacity marketplace?
2. Does this help carriers post real supply faster?
3. Does this make customer trust or clarity stronger?
4. Does this reduce founder ops pain without adding fake complexity?
5. Does this avoid drifting into dispatch, bidding, quote comparison, or removalist workflows?

If not, do not build it yet.

## Why These Lessons Matter

The strongest Claude Code lessons are not "use a smarter model."
They are:

1. separate explore, plan, implement, and verify
2. make instructions layered and local
3. treat tools as governed capabilities, not random helpers
4. make verification adversarial and explicit
5. keep memory, tasks, and long-session work structured
6. use isolation and worktrees for parallelism instead of chaos
7. use keep/discard experiment loops instead of vague ideation

`autoresearch` adds one especially important founder lesson:

> establish a baseline, change one meaningful variable, measure, then explicitly keep or discard the result.

## How To Use This Half

Every task below follows one format:

- `What to do`: the smallest useful implementation
- `Why it matters`: why this helps moverrr
- `Done when`: the practical finish line

Priority labels:

- `Now`: worth doing soon because it improves leverage, clarity, trust, or verification
- `Soon`: valuable after the current instruction system is stable
- `Later`: useful, but not urgent yet

## 84 Actionable Frontier Tasks

## A. Instruction Architecture And Project Memory

1. **Instruction system map** (`Now`)
What to do: Add one short section to this file or a nearby repo doc that explains the purpose and precedence of `CLAUDE.md`, `.claude/rules/`, `.agent-skills/`, and `.claude/skills/`.
Why it matters: Claude Code's strongest markdown lesson is instruction layering with explicit precedence.
Done when: A future agent can answer "where should this truth live?" without guessing.

2. **Scoped rule coverage matrix** (`Now`)
What to do: Audit which important moverrr surfaces still do not have dedicated `.claude/rules/` coverage, especially search/matching, payouts, analytics, and admin ops.
Why it matters: The Claude Code material repeatedly shows that local instructions beat broad global prose.
Done when: There is a simple list of high-value missing rule files and their intended path scopes.

3. **Search and matching rule** (`Now`)
What to do: Create `.claude/rules/search-and-matching.md` for `src/lib/matching/**`, search APIs, and customer search UI.
Why it matters: Matching is product-shaping logic and should not rely on generic memory.
Done when: Search and matching work automatically loads route-fit, disqualifier, and explainability constraints.

4. **Payments and payouts rule** (`Now`)
What to do: Create `.claude/rules/payments-and-payouts.md` for payment intent, webhook, payout, and ledger files.
Why it matters: Funds flow is one of the highest-risk product areas and deserves narrower memory.
Done when: Payment-related changes automatically load payout timing, trust, and reconciliation guidance.

5. **Supabase schema rule** (`Now`)
What to do: Create `.claude/rules/supabase-schema.md` for `supabase/**` and `src/types/database.ts`.
Why it matters: The fuller Claude material shows how much runtime quality depends on strong typed contracts and explicit schema discipline.
Done when: Migration, RPC, RLS, rollback, and type-sync expectations are local to schema work.

6. **Analytics and metrics rule** (`Soon`)
What to do: Create `.claude/rules/analytics-and-metrics.md` so future analytics changes stay tied to core marketplace questions.
Why it matters: Tooling and event systems become noisy fast when no metric layer exists.
Done when: Analytics tasks have a local instruction file that says what moverrr actually measures and why.

7. **Customer-trust rule** (`Soon`)
What to do: Create `.claude/rules/customer-trust.md` for trip detail, pricing presentation, saved-search empty states, and confirmation flows.
Why it matters: The frontier harness lesson is to move deep context close to the work.
Done when: Customer-facing trust, pricing, and reassurance surfaces load a specific trust-focused rule.

8. **Carrier-growth rule** (`Soon`)
What to do: Create `.claude/rules/carrier-growth.md` for onboarding, posting, templates, and carrier dashboard flows.
Why it matters: Carrier activation is moverrr's most important growth loop and deserves its own scoped memory.
Done when: Supply-side work automatically loads activation, repeat-posting, and speed-to-listing priorities.

9. **Admin-operations rule** (`Soon`)
What to do: Create `.claude/rules/admin-operations.md` for admin dashboard, disputes, verification, and ops tooling.
Why it matters: Manual-first marketplace ops are a real subsystem, not a generic admin afterthought.
Done when: Admin and ops changes inherit queue, trust, and exception-handling guidance automatically.

10. **Docs precedence note** (`Now`)
What to do: Write a short explicit precedence rule for what wins when two instructions conflict.
Why it matters: The detailed Claude analysis makes clear that instruction layering without precedence becomes ambiguous.
Done when: There is one canonical answer for conflict resolution across memory layers.

11. **Rule naming convention** (`Now`)
What to do: Standardize how new `.claude/rules/` files should be named and how narrow their `paths` frontmatter should be.
Why it matters: Claude Code's memory system works because locality is deliberate.
Done when: New rule files follow a repeatable naming and scoping standard.

12. **Include/import policy for docs** (`Soon`)
What to do: Define when docs may reference other files and what kinds of files are safe to include conceptually.
Why it matters: The Claude memory loader treats include power carefully because uncontrolled inclusion creates context and trust problems.
Done when: The repo has a small written policy for composable docs without turning every file into a context dump.

## B. Skills, Commands, And Reusable Workflows

13. **Skill inventory audit** (`Now`)
What to do: Review existing `.claude/skills/` and identify which are true repeatable workflows versus just good reference notes.
Why it matters: The Claude skill system treats workflows and references as different things.
Done when: Every existing skill either has a clear workflow role or is moved to a better home later.

14. **Release-readiness skill** (`Now`)
What to do: Create a `release-readiness` skill for final doc, verification, key-flow, and open-risk review before any serious deploy.
Why it matters: Claude Code turns "ship checks" into explicit workflows instead of vibes.
Done when: A future agent can run one repeatable release-readiness process instead of improvising one.

15. **Dispute-resolution-audit skill** (`Now`)
What to do: Create a skill specifically for changes touching disputes, proof review, admin resolution, or status guard logic.
Why it matters: High-risk flows deserve high-specificity workflows.
Done when: Dispute work has a repeatable verification and review runbook.

16. **Saved-search-demand-review skill** (`Now`)
What to do: Create a skill that reads saved-search demand and turns it into supply, copy, and ops recommendations.
Why it matters: Demand signals are easy to collect and easy to waste.
Done when: There is one repeatable way to interpret saved-search demand in moverrr terms.

17. **Carrier-quality-review skill** (`Soon`)
What to do: Create a skill for reviewing weak listings, poor proof quality, or low-trust carrier surfaces.
Why it matters: Marketplace quality work repeats and should not be reinvented every time.
Done when: Listing-quality audits can be run from one standard skill.

18. **Admin-queue-review skill** (`Soon`)
What to do: Create a skill for auditing the current admin queue: disputes, verification, stuck bookings, payout blockers, and urgent follow-ups.
Why it matters: A one-founder ops surface benefits from a repeatable daily or weekly review loop.
Done when: Admin review can be run from one skill with a clear output structure.

19. **Metrics-review skill** (`Soon`)
What to do: Create a skill that reads current marketplace metrics and returns decisions, not just summaries.
Why it matters: The frontier lesson is that output format matters; decisions beat dashboards.
Done when: Metrics review always ends with interpretation, recommended actions, and known uncertainty.

20. **Copy-guardian skill** (`Soon`)
What to do: Create a skill that audits customer and carrier copy for drift into quote-engine, dispatch, or removalist language.
Why it matters: Product-shape drift often happens through copy first.
Done when: Messaging can be reviewed against moverrr's wedge from one reusable workflow.

21. **Postmortem skill** (`Soon`)
What to do: Create a skill for writing postmortems after broken bookings, payment issues, trust incidents, or production regressions.
Why it matters: Strong frontier systems operationalize learning loops after failure.
Done when: Incidents can be documented in one consistent, action-oriented format.

22. **Experiment-design skill** (`Soon`)
What to do: Create a skill that formats product or ops experiments with baseline, single change, metric, and keep/discard rule.
Why it matters: This is the clearest `autoresearch` lesson to steal.
Done when: New experiments stop being vague enhancement ideas and become bounded tests.

23. **Verifier skill per surface** (`Now`)
What to do: Add separate verifier skills for core web UI, core API, and admin or ops surfaces.
Why it matters: The fuller Claude material shows that verification works best when surface-specific.
Done when: Verification is no longer one generic catch-all process.

24. **Command catalog for repo workflows** (`Soon`)
What to do: Create a small command or document catalog for repo-specific workflows, so future agents know what repeatable flows exist.
Why it matters: Claude Code benefits from explicit command surfaces instead of hidden workflows.
Done when: The repo has one discoverable place listing high-value workflows, skills, and where to use them.

## C. Agent Roles, Plan Mode, And Verification Discipline

25. **Product researcher agent** (`Now`)
What to do: Add an agent role dedicated to reading current behavior and translating it into product insight without editing code.
Why it matters: Claude Code separates read-heavy exploration from implementation for a reason.
Done when: Product research questions have a role that does not silently mutate the codebase.

26. **Payments verifier agent** (`Now`)
What to do: Add a role that specializes in payment, payout, webhook, and ledger verification.
Why it matters: High-stakes flows deserve narrower verification authority and stronger discipline.
Done when: Payment changes can be handed to a verifier that is purpose-built for the job.

27. **Mobile verifier agent** (`Now`)
What to do: Add a role focused on 375px checks, tap targets, proof uploads, and iPhone-specific behavior.
Why it matters: moverrr is iOS-first, so mobile verification should not be treated as generic frontend QA.
Done when: UI work has a verifier that thinks like an iPhone user first.

28. **Schema reviewer agent** (`Soon`)
What to do: Add a role for reviewing migrations, policies, RPC changes, and schema implications before merge.
Why it matters: The fuller Claude material emphasizes typed surfaces, parity checks, and runtime contracts.
Done when: Database changes have a designated reviewer role with clear scope.

29. **Copy guardian agent** (`Soon`)
What to do: Add an agent role that reviews product language, empty states, and trust messaging for wedge drift.
Why it matters: Product shape is often lost through tone and copy before logic changes.
Done when: Copy-sensitive tasks can be reviewed independently from implementation.

30. **Delegation triggers note** (`Now`)
What to do: Define exactly when moverrr work should spawn an explorer, verifier, or founder-critic style review.
Why it matters: Claude Code works because role usage is intentional, not random.
Done when: There is a written set of triggers for when specialized agents should be used.

31. **Plan-mode template for bigger tasks** (`Now`)
What to do: Create a standard plan template for medium or large tasks: problem, files, reuse candidates, risks, verification path.
Why it matters: The detailed Claude analysis shows that planning is a runtime state because it improves quality.
Done when: Bigger tasks consistently produce a useful plan artifact before implementation.

32. **Plan approval checklist** (`Soon`)
What to do: Define what a plan must answer before implementation begins on larger tasks.
Why it matters: A plan only helps if it is reviewable against explicit questions.
Done when: Plans are evaluated against the same checklist every time.

33. **Verification gate after 3+ subtasks** (`Now`)
What to do: Add a repo rule that any multi-step task with three or more major sub-parts must include an explicit verification step.
Why it matters: Claude Code literally nudges verification when task lists close without it.
Done when: Multi-part work cannot be called done without a verification lane.

34. **Reproduce-first bugfix rule** (`Now`)
What to do: Require every real bug fix to describe how the bug was reproduced before claiming it is fixed.
Why it matters: The verification agent pattern in Claude Code is built around evidence, not confidence.
Done when: Bugfix tasks always record reproduction, fix, and confirmation.

35. **Second-opinion pattern** (`Soon`)
What to do: Document when moverrr work should ask for an independent second opinion before merge, especially for pricing, booking, payments, and schema changes.
Why it matters: Fresh-agent review is one of the strongest Claude Code delegation lessons.
Done when: High-risk work has a defined trigger for independent review.

36. **Final summary format** (`Soon`)
What to do: Standardize the close-out format for future agent work: what changed, what was verified, what remains risky.
Why it matters: Claude Code's runtime is strong partly because completion is structured.
Done when: Final updates are consistent, verifiable, and easy to scan.

## D. Tooling, Capability Discovery, And Permission Rails

37. **Capability index** (`Now`)
What to do: Create a project-level inventory of what the repo's agent system can currently do: roles, skills, rules, verifiers, and repeatable workflows.
Why it matters: Claude Code includes tool discovery because large capability surfaces are hard to remember.
Done when: A future agent or human can quickly see the current operating-system surface of the repo.

38. **Tool semantics note** (`Soon`)
What to do: Define a small vocabulary for internal repo workflows: read-only, destructive, open-world, verification-only, or release-sensitive.
Why it matters: Claude Code attaches meaning to tool metadata, not just names.
Done when: High-risk repo workflows are tagged with clear semantics, even if only in docs at first.

39. **MCP adoption strategy** (`Soon`)
What to do: Write down which external systems would actually be worth exposing through MCP or similar integrations for moverrr.
Why it matters: The fuller Claude material shows MCP is useful when it turns real external systems into native capabilities.
Done when: There is a short list of high-value future integrations and why they matter.

40. **Permission matrix** (`Now`)
What to do: Create a simple matrix of which kinds of tasks are safe to run autonomously and which require confirmation or stronger review.
Why it matters: The Claude harness treats permission state as architecture, not UI chrome.
Done when: The repo has a documented autonomy policy for destructive, risky, or high-stakes work.

41. **Dangerous allowlist audit** (`Soon`)
What to do: Review current assumptions about broad permissions and document which ones should never become blanket defaults.
Why it matters: The detailed Claude lessons warn that broad allow rules quietly bypass safeguards.
Done when: The repo has a short written list of capability patterns that should stay gated.

42. **Shell safety policy** (`Soon`)
What to do: Write a repo-specific note on shell commands that are high-risk here, like destructive git operations or anything that bypasses checks.
Why it matters: Claude Code encodes shell caution in the runtime because it matters a lot in practice.
Done when: The repo has a shell-safety note future agents can follow without reinventing caution.

43. **Ask-user escalation policy** (`Soon`)
What to do: Define when an agent should stop and ask rather than continue autonomously.
Why it matters: Claude Code's runtime strength comes partly from knowing when to escalate.
Done when: High-risk ambiguity has a consistent escalation rule.

44. **Hook opportunity audit** (`Soon`)
What to do: List which repo behaviors are good hook candidates, such as formatting, documentation drift checks, or verification reminders.
Why it matters: The parity material shows hooks are powerful only when they actually execute real discipline.
Done when: The repo has a shortlist of hook candidates ordered by value.

45. **Hook adoption plan** (`Later`)
What to do: Decide which hook candidates are worth implementing first and which are still too annoying or premature.
Why it matters: Hooks should enforce valuable discipline, not create friction theater.
Done when: There is a staged adoption plan rather than a vague desire to "use hooks."

46. **Plugin opportunity audit** (`Later`)
What to do: Identify which plugin-like bundles would make sense for moverrr or sister projects: roles, rules, skills, and integrations packaged together.
Why it matters: Claude Code treats plugins as capability bundles, not cosmetic add-ons.
Done when: You have a shortlist of plugin-style bundles worth creating later.

47. **Structured output cleanliness check** (`Soon`)
What to do: Document what "clean structured output" means for any future machine-readable reporting or automation you add.
Why it matters: The Python port parity notes show how small output impurities break structured automation.
Done when: Future structured outputs have an explicit cleanliness standard.

48. **Repo transport surfaces list** (`Later`)
What to do: List which current or future workflows need chat-only output versus machine-readable output versus background task output.
Why it matters: The detailed analysis emphasizes that transport and rendering shape behavior.
Done when: Future automation work has a clear output-channel plan.

## E. Worktrees, Isolation, And Parallel Execution

49. **Worktree usage rules** (`Now`)
What to do: Document when future moverrr sweeps, refactors, or verification passes should happen in worktrees instead of the main checkout.
Why it matters: Claude Code uses worktrees because safe parallelism needs real isolation.
Done when: There is a written rule for when worktrees are the default safe path.

50. **Worktree naming convention** (`Now`)
What to do: Standardize worktree names for docs, product research, feature work, and verification.
Why it matters: The Claude material even validates worktree slugs because path-like identifiers can become messy or unsafe.
Done when: Worktree naming is predictable and low-risk.

51. **Selective file propagation policy** (`Soon`)
What to do: Decide which ignored local files, if any, should ever be allowed into isolated worktrees.
Why it matters: Claude Code's `.worktreeinclude` pattern exists because blanket copying is unsafe.
Done when: The repo has a narrow policy for what private or local files may be propagated.

52. **Sparse-worktree opportunity audit** (`Later`)
What to do: Decide whether future large-scope work would benefit from sparse worktrees that only load a subset of the repo.
Why it matters: The frontier harness makes isolation practical partly by making it cheaper.
Done when: You know whether sparse worktrees would help moverrr or are unnecessary right now.

53. **Parallel PR workflow** (`Soon`)
What to do: Write down how large parallel changes should be decomposed into independent units and PRs.
Why it matters: Claude Code's batch-style orchestration only works because work units are independently mergeable.
Done when: Big sweeps can be split without merge-conflict roulette.

54. **Branch lifecycle guide** (`Soon`)
What to do: Define how feature, doc, verifier, and experiment branches should be created, published, and merged.
Why it matters: Runtime discipline extends to how changes move through git.
Done when: Parallel work follows a consistent branch lifecycle.

55. **Verification-in-isolation workflow** (`Soon`)
What to do: Define when a verifier or independent reviewer should validate work from a clean or isolated branch rather than the edited tree.
Why it matters: Claude Code's verifier is powerful partly because it is not the implementer.
Done when: High-risk verification has an isolation pattern, not just a good intention.

56. **Sweep-task batching rule** (`Later`)
What to do: Define how to break large mechanical or repeated changes into small independently shippable batches.
Why it matters: Batch orchestration is one of the clearest operational lessons in the fuller harness material.
Done when: Big sweeps stop being "one giant PR" by default.

57. **Trust boundary for local reference folders** (`Now`)
What to do: Document that external or reference folders added to the repo root should not silently become trusted instruction sources.
Why it matters: Claude Code explicitly avoids auto-loading skills from unsafe or ignored places.
Done when: There is a short repo note defining trust boundaries for local archives, references, and imported materials.

58. **Scratchpad directory policy** (`Later`)
What to do: Decide where temporary notes, generated summaries, or transient artifacts should live if future workflows need them.
Why it matters: The Claude harness treats session state and scratch data as part of the environment design.
Done when: Future transient artifacts have a clean, non-chaotic home.

## F. Session Memory, Compaction, And Parity Thinking

59. **Memory layering diagram** (`Now`)
What to do: Add a small diagram or note showing how moverrr's project memory is layered today.
Why it matters: The detailed Claude analysis shows memory layering is one of the most important runtime concepts.
Done when: A human or agent can explain the repo's memory model in one glance.

60. **Local versus checked-in memory split** (`Soon`)
What to do: Clarify what belongs in checked-in project memory versus private local memory for this repo.
Why it matters: Claude Code distinguishes project and local memory because they solve different problems.
Done when: Sensitive or personal instructions stop drifting into shared repo memory.

61. **Context budget note** (`Soon`)
What to do: Add a short repo note that always-loaded docs should stay lean and that deep detail belongs in scoped rules or skills.
Why it matters: Claude Code treats context as a real budget, not an infinite pool.
Done when: Future docs do not bloat the always-loaded instruction layer casually.

62. **Compaction-ready summary template** (`Later`)
What to do: Define a standard format for summarizing long work sessions: decisions, files, verification, unresolved risk.
Why it matters: The Claude runtime keeps long sessions alive by compressing them into useful summaries.
Done when: Long-running work can be summarized without losing the important state.

63. **Session replay note for major work** (`Later`)
What to do: Decide whether important implementation or ops sessions should leave a short replayable summary artifact.
Why it matters: The Python port and Claude runtime both treat transcripts and session state as first-class assets.
Done when: Major work can be reconstructed from a concise durable summary if needed.

64. **Parity audit for repo operating system** (`Soon`)
What to do: Create a periodic audit that asks which intended roles, rules, skills, and verifiers exist versus are still missing.
Why it matters: The Python port's parity audit is a strong example of turning ambition into measurable gaps.
Done when: The repo has a measurable "operating system parity" checklist instead of vague aspirations.

65. **Project manifest for agent surfaces** (`Soon`)
What to do: Create a small markdown manifest of current rules, agents, skills, and verification surfaces.
Why it matters: The port manifest idea is useful because it makes the current surface visible.
Done when: You can inspect the current repo operating system from one summary file.

66. **Stale-reference detector** (`Soon`)
What to do: Add a recurring check for docs and skill references that point to paths, commands, or flows that no longer exist.
Why it matters: Markdown-driven systems rot when references silently die.
Done when: Broken references are surfaced regularly instead of discovered by accident.

67. **Monthly memory refactor pass** (`Now`)
What to do: Keep a recurring habit of pruning stale docs, collapsing duplicates, and moving repeated guidance into better homes.
Why it matters: Claude Code stays sharp because its instruction system is treated like product infrastructure.
Done when: Memory cleanup is a recurring task, not an emergency repair.

68. **Change-journal for operating system edits** (`Later`)
What to do: Keep a short log of major changes to the repo's agent operating system and why they were made.
Why it matters: Once the markdown layer becomes important, its evolution deserves traceability.
Done when: Major operating-system changes are no longer only visible through git archaeology.

## G. Verification, QA, And Runtime Reliability

69. **Booking concurrency integration test** (`Now`)
What to do: Add a real integration test that proves only one booking can win the race on the same listing.
Why it matters: The strongest Claude verifier lesson is to attack the unhappy path directly.
Done when: Concurrent booking attempts demonstrably cannot oversell capacity.

70. **Dispute-completion regression test** (`Now`)
What to do: Add a test proving unresolved disputes cannot transition to completed.
Why it matters: This is one of moverrr's core business guards and should never depend on memory alone.
Done when: The guard fails loudly if it regresses.

71. **Webhook replay harness** (`Now`)
What to do: Build a replay path for payment-webhook sequences so failures can be debugged intentionally.
Why it matters: High-stakes flows need reproducible verification, not anecdotal investigation.
Done when: A broken payment sequence can be replayed locally from a known fixture or script.

72. **Route-contract smoke suite** (`Soon`)
What to do: Add a fast suite that checks response shape and auth expectations for core public, carrier, customer, and admin routes.
Why it matters: The parity and harness material show the value of broad surface visibility, not only deep unit tests.
Done when: Core route drift is caught quickly by one standard smoke pass.

73. **Mobile proof-upload harness** (`Soon`)
What to do: Add a focused verification harness for proof upload flows, including HEIC acceptance and camera-first behavior.
Why it matters: moverrr's mobile proof path is part of trust, not just UI.
Done when: Proof upload regressions are testable and obvious.

74. **Verifier report template** (`Now`)
What to do: Standardize how future verification reports should present checks run, evidence observed, pass/fail result, and residual risk.
Why it matters: Claude Code's verifier is strong because its output is structured and evidence-led.
Done when: Verification reports across the repo become comparable and easy to trust.

75. **Adversarial probe checklist** (`Now`)
What to do: Define a short list of adversarial probes future verifiers should consider: concurrency, boundary values, duplicate actions, stale states, narrow viewport, or missing config.
Why it matters: The verification agent's biggest lesson is "try to break it."
Done when: Every serious verification pass includes at least one adversarial probe.

76. **Bug reproduction template** (`Soon`)
What to do: Create a one-page bug template that captures steps, expected behavior, actual behavior, impacted user, and verification path.
Why it matters: Reliable bug work begins with reproducibility, not just issue labels.
Done when: New bugfix work starts from a reproducible template.

## H. Experiment Loops, Review Rituals, And Ongoing Projects

77. **Experiment ledger** (`Now`)
What to do: Create one place to record experiment baseline, hypothesis, change, result, and keep/discard decision.
Why it matters: This is the most transferable `autoresearch` lesson.
Done when: Meaningful experiments stop disappearing into memory or chat history.

78. **Baseline template** (`Now`)
What to do: Require every experiment or optimization task to state the current baseline before work begins.
Why it matters: Without a baseline, improvement claims are mostly storytelling.
Done when: Future experiment ideas begin with a real number or clear current-state description.

79. **Keep/discard threshold rule** (`Now`)
What to do: Require every experiment to name the outcome that means keep and the outcome that means discard or reframe.
Why it matters: `autoresearch` is powerful because it advances only when the result is better.
Done when: Experiments have an explicit decision rule before they start.

80. **Near-miss review loop** (`Soon`)
What to do: Create a periodic review for experiments that almost worked but were inconclusive.
Why it matters: Frontier loops improve faster when they revisit promising near-misses deliberately.
Done when: Near-miss experiments get a structured revisit decision instead of being forgotten.

81. **Simplification win log** (`Soon`)
What to do: Track cases where deleting or simplifying something kept or improved outcomes.
Why it matters: `autoresearch` treats simplification as a real win, and moverrr should too.
Done when: The repo has a visible record of "complexity removed" wins.

82. **Weekly operating review** (`Soon`)
What to do: Run one weekly review across instruction quality, verification debt, broken trust flows, and experiment outcomes.
Why it matters: Claude Code's runtime discipline is powerful because maintenance is continuous, not occasional.
Done when: There is a repeatable weekly review ritual with a written format.

83. **Cross-project operating-system template** (`Later`)
What to do: Distill the best moverrr instruction, role, and verification patterns into a reusable template for future projects.
Why it matters: The user explicitly wants learnings that can help ongoing projects, not only this repo.
Done when: There is a starter operating-system template that future repos can copy and adapt.

84. **Monthly frontier review** (`Later`)
What to do: Once a month, review new frontier harness learnings, new Claude/Codex workflows, and recent moverrr pain points to see what deserves adoption.
Why it matters: The frontier moves quickly, but not every new idea belongs in the repo right away.
Done when: There is a recurring founder-level review that converts outside learning into selective internal adoption.


# Airtasker + Airbnb Learning For moverrr

Last revised: 1 April 2026 (Sydney)

## What This Document Is

This is not a source dump.
This is a founder action brief for moverrr.

It takes useful patterns from Airtasker, Airbnb, marketplace ops playbooks, payment infrastructure docs, and Australia-specific trust/compliance guidance, then rewrites them into tasks that fit moverrr's actual shape:

- browse-first
- spare-capacity inventory
- awkward-middle Sydney moves
- mobile-first
- manual-first operations where that buys speed

## Product Truth We Must Protect

Before any task gets built, ask:

1. Does this help carriers post real spare capacity faster?
2. Does this make browse and booking clearer for customers?
3. Does this reduce founder ops pain without creating product bloat?
4. Does this keep moverrr out of quote-engine, bidding, dispatch, and removalist territory?
5. Is the smallest useful version obvious?

If the answer is no, do not build it yet.

## How To Use This File

Every task below follows one format:

- `What to do`: the smallest useful implementation
- `Why it matters`: the product reason
- `Done when`: the practical finish line

Priority labels:

- `Now`: should improve trust, clarity, supply, or ops in the next round
- `Soon`: valuable once the core loop is reliable
- `Later`: useful after the marketplace has more volume

## The Big Founder Moves

These are the main lessons worth stealing from Airtasker and Airbnb, translated for moverrr:

1. Great marketplaces explain the job before they explain the feature.
2. Trust comes from visible evidence, not brand claims.
3. Listing quality is a product system, not just user effort.
4. Messaging should reduce uncertainty, not create a shadow workflow.
5. Payments should feel safe, predictable, and boring.
6. Reviews should teach the market what good looks like.
7. Ops tools should help one founder survive before they help a large team scale.
8. The best UX often removes choices instead of adding them.
9. Every state change should answer "what happens next?"
10. Good ranking should reduce support pain, not just increase clicks.

## 100 Actionable Tasks

## A. Search, Browse, And First Impression

1. **Search card: why this trip fits** (`Now`)
What to do: Add a dedicated line on each result card that explains the fit in plain English: route, timing, spare capacity, and why the price is lower.
Why it matters: Airbnb and Airtasker both reduce uncertainty fast; moverrr needs to make the spare-capacity story legible before the tap.
Done when: Every trip card answers "why am I seeing this?" in one screenful.

2. **Search card: total price, not teaser price** (`Now`)
What to do: Show the full customer price on the result card, with a smaller breakdown available on tap.
Why it matters: Hidden-fee anxiety kills trust early.
Done when: A customer can compare two trips without opening either one to understand the likely total.

3. **Search card: timing certainty badge** (`Now`)
What to do: Add chips like `fixed pickup window`, `flexible dropoff`, `same-day route`, or `weekend run`.
Why it matters: Time confidence is one of the biggest filters in moving.
Done when: Timing confidence is visible without reading long descriptions.

4. **Search card: capacity made human** (`Now`)
What to do: Translate capacity into examples like `fits 1 fridge`, `fits 1 mattress`, `fits 8 boxes`, alongside any raw capacity metric.
Why it matters: Most customers do not think in percentages or cubic metres.
Done when: Search cards help users self-qualify without guessing.

5. **Search filters: item-shaped, not logistics-shaped** (`Now`)
What to do: Add filters like `single furniture`, `appliance`, `marketplace pickup`, `small business overflow`, `student move`.
Why it matters: moverrr should feel like browseable inventory for specific problems, not freight software.
Done when: The top filters match real customer language.

6. **Search filters: access constraints** (`Now`)
What to do: Add filters for stairs, lift, narrow access, loading dock, parking difficulty, and helper needed.
Why it matters: Accessibility and handling complexity are part of fit, not edge cases.
Done when: Customers can eliminate obviously wrong trips before checkout.

7. **Search results: route corridor shelf** (`Soon`)
What to do: Add featured shelves for common corridors like `Inner West`, `Eastern Suburbs pickups`, `Parramatta -> City`, `Sydney marketplace pickups`.
Why it matters: Airbnb uses curation to make supply feel real; moverrr can do the same with route corridors.
Done when: Browse has reusable shelves that make inventory density feel stronger.

8. **Search results: map plus list** (`Soon`)
What to do: Add a suburb-safe map view that shows route corridors, not exact addresses.
Why it matters: Maps create confidence, but privacy still matters.
Done when: A user can browse by geography without revealing private locations.

9. **Search ranking: support-risk aware ordering** (`Soon`)
What to do: Blend trust, completeness, response rate, proof quality, and route fit into ranking instead of using only relevance or price.
Why it matters: Airbnb's more mature systems optimize for lower support burden as well as conversion; moverrr should learn that early.
Done when: Weak, risky, incomplete listings stop floating to the top.

10. **Search ranking: hide weak inventory by default** (`Now`)
What to do: Downrank listings missing photos, rules, vehicle info, or reliable timing unless the user explicitly filters broadly.
Why it matters: Browse-first marketplaces live or die on perceived quality.
Done when: First-page inventory looks believable by default.

11. **Empty state: save this route** (`Now`)
What to do: Turn no-results pages into a route-demand capture flow with one-tap saved search and expected route frequency.
Why it matters: Dead ends waste demand and teach users that moverrr has no supply.
Done when: No-result sessions still produce reusable customer intent.

12. **Empty state: show nearby alternatives** (`Now`)
What to do: Suggest nearby suburbs, adjacent dates, and flexible timing options.
Why it matters: Customers often need help reframing the request, not leaving the product.
Done when: No-result pages always offer three next actions.

13. **Saved search digest** (`Soon`)
What to do: Send a route alert when matching or near-matching capacity appears.
Why it matters: Airbnb wishlists and saved browsing patterns create return loops; moverrr needs route alerts for low-density inventory.
Done when: Saved search users receive useful, low-noise reactivation messages.

14. **Browse card: trust stack preview** (`Now`)
What to do: Show a compact trust row: verified identity, proof history, response speed, completed jobs, and review score.
Why it matters: Trust must be legible before a user commits attention.
Done when: Cards display trust signals without needing a long profile visit.

15. **Browse card: route story headline** (`Later`)
What to do: Generate a short route headline like `Already driving Surry Hills -> Newtown after marketplace pickups`.
Why it matters: Great marketplaces make listings feel alive and specific.
Done when: Top listings feel like real trips, not database rows.

## B. Trip Detail And Conversion

16. **Hero section: real trip first** (`Now`)
What to do: Put route, date, pickup window, vehicle, capacity left, and trust above the fold.
Why it matters: The core question is "is this a real trip that can take my item?"
Done when: The first screen answers that clearly.

17. **Trip detail: one-line spare-capacity explanation** (`Now`)
What to do: Add a sentence explaining why the listing exists and why the price is lower.
Why it matters: moverrr's wedge should never be implicit.
Done when: Every trip detail page reinforces the product thesis.

18. **Pricing panel: full moverrr breakdown** (`Now`)
What to do: Show base price, stairs fee, helper fee, booking fee, and total, with short tooltips in plain language.
Why it matters: Transparent math reduces support and checkout drop-off.
Done when: The pricing box matches actual booking math everywhere.

19. **Trip detail: included vs not included** (`Now`)
What to do: Add a structured checklist for `included`, `not included`, and `needs add-on`.
Why it matters: Most move disputes come from unstated assumptions.
Done when: A user can tell what service they are actually buying.

20. **Trip detail: trip rules module** (`Now`)
What to do: Add rules like `ground-floor only`, `no dismantling`, `must fit through standard doorway`, `customer present at handoff`.
Why it matters: Airbnb's house-rules style discipline works because it prevents silent mismatch.
Done when: Each listing has explicit handling rules before booking.

21. **Trip detail: proof examples** (`Soon`)
What to do: Show a sample of pickup and delivery proof from the carrier's past completed work.
Why it matters: Trust grows when users can see how handoffs are actually documented.
Done when: Proof style is visible before payment.

22. **Trip detail: handling confidence** (`Soon`)
What to do: Add a block showing blankets, straps, tail-lift, helper availability, and weather protection.
Why it matters: Customers care about how their item will be handled, not just whether a van exists.
Done when: Handling readiness is obvious on detail pages.

23. **Trip detail: access compatibility summary** (`Now`)
What to do: Show whether the carrier accepts stairs, lift-only buildings, long carries, heavy items, and awkward access.
Why it matters: This filters out bad fits early.
Done when: Access assumptions are visible without sending a message.

24. **Trip detail: what happens next timeline** (`Now`)
What to do: Add a short operational timeline from booking request to completion.
Why it matters: Good marketplaces remove uncertainty after the click, not only before it.
Done when: Booking flow states are visible before checkout.

25. **Trip detail: pending request countdown** (`Soon`)
What to do: If a request needs confirmation, show a clear response deadline and fallback path.
Why it matters: Airbnb handles pending states explicitly; moverrr should avoid ghost requests.
Done when: No booking request sits in an ambiguous state.

26. **Trip detail: customer prep checklist** (`Now`)
What to do: Add a `prepare for pickup` checklist covering access, wrapping, dimensions, and handoff readiness.
Why it matters: Better-prepared customers create fewer disputes.
Done when: Customers see what they need to do before they pay.

27. **Trip detail: capacity confidence meter** (`Soon`)
What to do: Show capacity in a simple confidence format like `very likely fits`, `check dimensions`, or `unlikely fit`.
Why it matters: A binary yes or no is often too crude for awkward-middle items.
Done when: Customers understand fit uncertainty honestly.

28. **Trip detail: route flexibility box** (`Soon`)
What to do: Show how much date, time, and handoff flexibility the customer is buying.
Why it matters: moverrr saves money partly by trading speed for flexibility.
Done when: Flexibility is a visible product feature, not a hidden consequence.

29. **Trip detail: suburb privacy boundaries** (`Now`)
What to do: Keep exact addresses hidden pre-booking, but clearly show suburb and corridor confidence.
Why it matters: Privacy and trust can both be strong if boundaries are clear.
Done when: Location clarity increases without exposing private data too early.

30. **Trip detail: comparison drawer** (`Later`)
What to do: Let users compare two or three listings on timing, price, trust, handling, and flexibility.
Why it matters: Airbnb-style comparison thinking helps users pick confidently in a browse market.
Done when: Users can compare without tab chaos.

## C. Carrier Posting And Supply Creation

31. **Posting flow: compress to four decisions** (`Now`)
What to do: Keep posting focused on route, timing, space, and rules, with optional details tucked into secondary steps.
Why it matters: Supply speed matters more than feature depth.
Done when: A repeat carrier can post in under two minutes.

32. **Posting flow: duplicate last trip** (`Now`)
What to do: Add `post again` from an existing trip with editable date, price, and capacity.
Why it matters: Repeat supply is more important than novel supply.
Done when: Returning carriers can relist with almost no typing.

33. **Posting flow: route templates** (`Now`)
What to do: Allow reusable templates for common corridors and rule sets.
Why it matters: Templates help recurring supply without turning moverrr into dispatch software.
Done when: A carrier can create a templated trip in one tap plus small edits.

34. **Posting flow: listing readiness score** (`Soon`)
What to do: Show a simple completeness score based on photos, rules, vehicle, timing clarity, and handling details.
Why it matters: Airtasker and Airbnb both nudge quality through visible completion systems.
Done when: Carriers know exactly how to improve a weak listing.

35. **Posting flow: plain-language price guidance** (`Now`)
What to do: Show examples and price anchors for similar moverrr trips, not algorithmic black-box pricing.
Why it matters: Founders need price quality without pretending to know the whole market.
Done when: Carriers get better base prices with minimal support intervention.

36. **Posting flow: common item presets** (`Soon`)
What to do: Add presets for mattress, fridge, sofa, washing machine, marketplace pickup, boxes, and office overflow.
Why it matters: Presets reduce writing and standardize expectations.
Done when: Posting a common move type becomes much faster.

37. **Posting flow: handling presets** (`Soon`)
What to do: Add toggle presets for blankets, straps, trolley, tail-lift, helper, and rain protection.
Why it matters: Customers want visible handling competence.
Done when: Listings expose handling capability consistently.

38. **Posting flow: route-level default rules** (`Soon`)
What to do: Let carriers save default rules per recurring route.
Why it matters: Good defaults reduce repetitive setup work.
Done when: Frequent routes inherit the carrier's normal constraints automatically.

39. **Posting flow: publish gate for weak listings** (`Now`)
What to do: Block or warn on listings that are missing route, date, price, space, or core rules.
Why it matters: Inventory quality is a marketplace asset.
Done when: Obviously incomplete listings rarely reach browse.

40. **Posting flow: mobile camera-first photos** (`Now`)
What to do: Make vehicle, proof-style, and optional listing photos camera-first with HEIC support and clear capture prompts.
Why it matters: Carrier-side UX must respect iPhone reality.
Done when: Adding photos feels native and fast on mobile.

41. **Posting flow: live preview card** (`Soon`)
What to do: Show carriers exactly how the listing card will appear in search while they create it.
Why it matters: Airbnb-style preview thinking improves supply quality immediately.
Done when: Carriers can tune a listing before publishing.

42. **Posting flow: route frequency tracker** (`Later`)
What to do: Show how often the carrier has posted a similar corridor and how often it gets booked.
Why it matters: Repeat-route confidence can become a supply flywheel.
Done when: Carriers can see which routes are worth repeating.

43. **Posting flow: item-fit warnings** (`Now`)
What to do: Warn carriers when the listed capacity or rules conflict with common item types.
Why it matters: Quality systems should catch bad input before the market sees it.
Done when: Contradictions are flagged during creation, not after booking.

44. **Posting flow: route headline helper** (`Soon`)
What to do: Suggest a short, natural-language headline based on route, timing, and capacity.
Why it matters: Good listing language improves clicks without more complexity.
Done when: Most listings publish with a readable, specific title.

45. **Posting flow: operations checklist after publish** (`Now`)
What to do: After publish, show the carrier next actions: verify payout, review proof checklist, respond fast, update capacity after bookings.
Why it matters: Great marketplaces keep sellers operational, not just listed.
Done when: New carriers know how to succeed after publishing.

## D. Trust, Profiles, And Reputation

46. **Carrier profile: layered badges** (`Now`)
What to do: Split trust into meaningful badges like ID checked, business details added, payout ready, police check supplied, verified proof history.
Why it matters: One giant "verified" badge is too vague.
Done when: Users can see what is actually verified.

47. **Carrier profile: badge freshness** (`Soon`)
What to do: Show when verification was last checked and if anything needs renewal.
Why it matters: Old trust data becomes fake trust data.
Done when: Badges no longer imply permanent truth.

48. **Carrier profile: proof gallery** (`Now`)
What to do: Show selected before/after, pickup, and delivery proof examples from past work.
Why it matters: In moverrr, proof quality is part of the product.
Done when: Profiles show how the carrier documents real work.

49. **Carrier profile: route expertise section** (`Soon`)
What to do: Highlight repeated suburbs, common item types, and completion history for those patterns.
Why it matters: Airbnb hosts earn trust through specificity; carriers can too.
Done when: Users can tell what a carrier reliably does well.

50. **Carrier profile: response behavior** (`Soon`)
What to do: Show response speed and confirmation reliability in a customer-friendly way.
Why it matters: Operational behavior is trust, not just a backend metric.
Done when: Customers can distinguish reliable carriers before messaging.

51. **Carrier profile: not a brochure page** (`Now`)
What to do: Keep the profile concise and evidence-led instead of turning it into a long marketing page.
Why it matters: Proof beats self-description.
Done when: The profile highlights facts, not fluff.

52. **Review system: verified bookings only** (`Now`)
What to do: Allow reviews only after a real completed booking.
Why it matters: Marketplace trust collapses when review authenticity is questionable.
Done when: No manual or off-platform review entries exist.

53. **Review system: double-blind reviews** (`Soon`)
What to do: Hold both reviews until both sides submit or the review window expires.
Why it matters: This reduces retaliation behavior and encourages honest feedback.
Done when: Reviews reveal together or at expiry.

54. **Review system: useful subratings** (`Soon`)
What to do: Break feedback into communication, item care, punctuality, listing accuracy, and proof quality.
Why it matters: Generic stars do not teach the market what good looks like.
Done when: Review data can guide ranking and carrier improvement.

55. **Review system: one public carrier reply** (`Soon`)
What to do: Allow one calm factual response to a review.
Why it matters: Good marketplaces give providers a limited way to add context.
Done when: Review threads remain readable and bounded.

56. **Review system: moderation policy examples** (`Soon`)
What to do: Publish examples of removable reviews such as threats, hate, extortion, or irrelevant complaints.
Why it matters: Clear moderation rules reduce founder-by-founder judgment calls.
Done when: Support decisions follow written examples.

57. **Trust center page** (`Soon`)
What to do: Create one simple page for trust basics: payments, verification, banned behavior, proof, disputes, privacy.
Why it matters: Users need one place that explains how moverrr works safely.
Done when: Support can link one canonical trust page.

58. **Off-platform leak prevention** (`Now`)
What to do: Hide direct contact details publicly and block obvious contact-sharing attempts before booking.
Why it matters: Airtasker learned this the hard way; moverrr should not relearn it.
Done when: Users cannot easily bypass platform payments before commitment.

59. **Scam reporting inside key surfaces** (`Now`)
What to do: Add simple report actions on messages, listings, and suspicious notifications.
Why it matters: Trust systems need visible safety exits.
Done when: Users can report something risky in one or two taps.

60. **Customer-facing trust language cleanup** (`Now`)
What to do: Rewrite vague promises like "safe and secure" into proof-led copy about payments, verification, and proof capture.
Why it matters: Founder-stage trust copy should be specific, not corporate.
Done when: Trust language points to evidence every time.

## E. Messaging, Notifications, And State Management

61. **Thread header tied to booking status** (`Now`)
What to do: Put the current booking state and next required action at the top of each thread.
Why it matters: Messaging should reduce ambiguity, not create side quests.
Done when: Every conversation shows what stage the booking is in.

62. **Message composer with structured prompts** (`Soon`)
What to do: Suggest prompt chips like `confirm dimensions`, `ask about stairs`, `share access photo`, `confirm pickup window`.
Why it matters: Structured prompts reduce missing information and awkward back-and-forth.
Done when: Common operational questions need fewer typed messages.

63. **Quick replies for carriers** (`Soon`)
What to do: Add reusable responses for stairs, access, dimensions, timing, and helper requirements.
Why it matters: Faster replies improve conversion and reduce ops load.
Done when: Carriers can answer common questions in one tap.

64. **Thread deadlines** (`Soon`)
What to do: Show visible response deadlines for booking confirmation, proof upload, dispute response, and customer confirmation.
Why it matters: Mature marketplaces reduce uncertainty with visible clocks.
Done when: No critical thread state lacks a deadline.

65. **24-hour response expectation** (`Now`)
What to do: Set and surface a clear response standard for important booking messages.
Why it matters: Users trust marketplaces that define responsiveness.
Done when: Response standards appear in the carrier experience and support copy.

66. **Automated nudges for missing next steps** (`Now`)
What to do: Trigger reminders for missing proof, unanswered requests, incomplete payout setup, and pending completion.
Why it matters: One founder should not manually chase obvious follow-ups.
Done when: Routine nudges are system-driven.

67. **Attachment labels in chat** (`Now`)
What to do: Let users label images as `item photo`, `pickup area`, `delivery proof`, `damage evidence`, or `access issue`.
Why it matters: Structured evidence is easier to review later.
Done when: Image uploads no longer become an unlabeled blob.

68. **Photo request prompts in-thread** (`Soon`)
What to do: Let either side request a specific kind of photo with one tap.
Why it matters: A lot of move uncertainty is solved by the right image at the right time.
Done when: Users can request missing visual context without typing long instructions.

69. **Day-of-move urgent contact mode** (`Soon`)
What to do: Unlock easier direct contact only after booking is confirmed and the move is time-sensitive.
Why it matters: Tight handoffs need speed, but early contact leaks hurt the marketplace.
Done when: Direct contact opens only where it adds operational value.

70. **Message risk detection** (`Later`)
What to do: Flag messages with external links, off-platform payment prompts, or suspicious wording for admin review.
Why it matters: Basic pattern detection reduces scam exposure without heavy moderation.
Done when: Risky threads surface in admin before damage spreads.

## F. Payments, Pricing, And Booking Safety

71. **Booking breakdown consistency** (`Now`)
What to do: Ensure the same price breakdown appears in search, trip detail, checkout, confirmation, and support views.
Why it matters: A consistent pricing system feels trustworthy and reduces confusion.
Done when: No screen invents its own version of the total.

72. **Hold funds until proper completion** (`Now`)
What to do: Keep customer funds secured until proof and completion logic are satisfied.
Why it matters: Payments are the marketplace's strongest trust lever.
Done when: Early release is exceptional, not default.

73. **Explain payout holds clearly** (`Now`)
What to do: When payout is blocked, show the missing step, the current balance, and what happens after it is resolved.
Why it matters: Hidden payout logic creates provider anxiety fast.
Done when: Carriers understand why money is waiting.

74. **Cancellation policy matrix by stage** (`Soon`)
What to do: Define outcomes for pre-confirmation cancel, post-confirmation cancel, carrier cancel, failed access, and mid-service interruption.
Why it matters: Cancellations become chaos when policy is vague.
Done when: Support can point to one matrix instead of improvising.

75. **No unstructured day-of-job extras** (`Now`)
What to do: Only allow extra charges through defined add-on paths or admin-reviewed exception flows.
Why it matters: Surprise price changes destroy trust.
Done when: Chat cannot casually rewrite the transaction.

76. **Partial refund rules tied to evidence** (`Soon`)
What to do: Base partial refunds on proof, timeline, and completed portion of the job.
Why it matters: Real move scenarios are messy; policy needs a fair middle ground.
Done when: Partial outcomes are explainable and repeatable.

77. **Carrier payout ledger** (`Soon`)
What to do: Give carriers a clean ledger with booking ID, earnings, fees, payout status, and export.
Why it matters: Airtasker-style payout clarity helps providers trust the platform.
Done when: A carrier can reconcile earnings without asking support.

78. **Price guidance based on route and item patterns** (`Soon`)
What to do: Show historical ranges and examples, not a black-box recommended price.
Why it matters: Founders need pricing support that stays explainable.
Done when: Carriers can price more consistently without losing agency.

79. **Customer payment reassurance panel** (`Now`)
What to do: Explain in checkout that payment is held, when it gets released, and how disputes work.
Why it matters: Payment trust is conversion trust.
Done when: Checkout directly answers "what happens to my money?"

80. **Booking request expiry** (`Soon`)
What to do: Expire unconfirmed booking requests after a visible timeframe.
Why it matters: Pending forever feels broken.
Done when: Request lifecycle is finite and explicit.

## G. Proof, Safety, And Dispute Operations

81. **Pickup proof pack** (`Now`)
What to do: Require pickup photos, item condition, item count, and pickup confirmation before status moves to in-transit.
Why it matters: The dispute story should start before the dispute.
Done when: Every in-transit booking has a complete pickup record.

82. **Delivery proof pack** (`Now`)
What to do: Require delivery photos, recipient confirmation, and exception notes before payout completion.
Why it matters: Delivery should be documented, not assumed.
Done when: Every completed booking has a minimum delivery proof set.

83. **Exception logging in the moment** (`Now`)
What to do: Add fast-report flows for access blocked, item mismatch, damage spotted, or no-show.
Why it matters: Evidence captured live is far better than memory later.
Done when: Users can log exceptions during the event, not after.

84. **Dispute center with reason codes** (`Soon`)
What to do: Centralize disputes into structured categories with evidence upload and deadline tracking.
Why it matters: Support becomes scalable when disputes are structured.
Done when: Every dispute has reason code, evidence, and timeline.

85. **Response deadline for claims** (`Soon`)
What to do: Give both sides a clear response window once a claim is opened.
Why it matters: Timeboxing keeps disputes moving.
Done when: Claims stop stalling in open-ended silence.

86. **Damage storytelling template** (`Soon`)
What to do: Guide users to document `before`, `during`, `after`, `where damage happened`, and `what result is requested`.
Why it matters: Better evidence makes better resolutions.
Done when: Damage claims arrive with enough structure to review quickly.

87. **Prohibited item policy** (`Now`)
What to do: Publish and enforce a clear banned-items list for dangerous goods, unlawful transport, unsafe chemicals, and other excluded cargo.
Why it matters: Not every moving request belongs in moverrr.
Done when: Carriers and customers can see what is out of scope.

88. **Asbestos and regulated waste ban** (`Now`)
What to do: Explicitly ban asbestos, contaminated waste, and similar regulated disposal jobs.
Why it matters: Sydney move requests can drift into risky territory quickly.
Done when: Support and users have a clear no-go rule.

89. **Manual handling risk prompts** (`Now`)
What to do: Trigger risk prompts for heavy, awkward, bulky, or one-person-dangerous items.
Why it matters: Safety belongs in the product, not just in common sense.
Done when: Risky jobs force clearer handling expectations.

90. **Departure safety checklist** (`Soon`)
What to do: Require a carrier confirmation step for load restraint, visibility, straps, and secure packing on relevant trips.
Why it matters: Good marketplaces help providers avoid predictable failures.
Done when: Relevant bookings include a pre-departure safety check.

## H. Carrier Operations And Repeat Supply

91. **Carrier Today screen** (`Soon`)
What to do: Build a simple "today" view showing upcoming handoffs, proof needed, messages waiting, and payout blockers.
Why it matters: Airbnb invests heavily in host operations surfaces; moverrr needs a lightweight version for carriers.
Done when: A carrier can open the app and know what to do next in ten seconds.

92. **Trip health score** (`Soon`)
What to do: Score active trips based on missing proof, unanswered messages, timing uncertainty, and unresolved access questions.
Why it matters: Ops teams should see risk before a booking fails.
Done when: Risky trips stand out before the day goes wrong.

93. **Remaining capacity auto-update** (`Now`)
What to do: Recalculate and display remaining capacity immediately after booking changes.
Why it matters: Spare-capacity inventory breaks if available space lies.
Done when: Capacity stays correct after create, cancel, and adjustment flows.

94. **Rebook from completed trip** (`Soon`)
What to do: Let carriers create a new listing from a successfully completed route with one tap.
Why it matters: Repeatable wins should turn into repeatable supply.
Done when: High-performing trips can be relaunched quickly.

95. **Route performance insights** (`Later`)
What to do: Show carriers which routes convert, which item types get booked, and where drop-off happens.
Why it matters: Better supply follows better feedback loops.
Done when: Carriers can see what inventory the market actually wants.

96. **Proof quality coaching** (`Later`)
What to do: Highlight proof issues like blurry photos, missing angles, or missing recipient confirmation.
Why it matters: Proof quality is an operational skill that can be improved.
Done when: The product teaches carriers what strong proof looks like.

97. **Carrier streaks for reliability** (`Later`)
What to do: Add positive reinforcement for completed jobs with fast responses, clean proof, and no disputes.
Why it matters: Quality markets reward good behavior visibly.
Done when: Reliable carriers can see momentum-building signals.

98. **Repeat customer path** (`Soon`)
What to do: Let previous customers rebook a trusted carrier on similar corridors without turning moverrr into private off-platform logistics.
Why it matters: Repeat trust is one of the strongest marketplace assets.
Done when: Repeat bookings happen in-platform with minimal friction.

99. **Saved trip templates for customers** (`Later`)
What to do: Let customers save recurring move details like office overflow or marketplace pickups.
Why it matters: Repeat demand can be made easier without inventing quote workflows.
Done when: Returning customers can reuse structured request details quickly.

100. **Founder ops cockpit** (`Now`)
What to do: Build one admin view showing new listings, weak listings, pending payouts, disputes, saved-search demand, risky threads, and top supply gaps.
Why it matters: A solo founder needs one place to run the market day to day.
Done when: The founder can start the day, scan the market, and know the top five actions immediately.

## First 15 To Actually Build

If we want the strongest next move, build these first:

1. Search card: why this trip fits
2. Search card: total price, not teaser price
3. Empty state: save this route
4. Hero section: real trip first
5. Pricing panel: full moverrr breakdown
6. Trip detail: included vs not included
7. Posting flow: duplicate last trip
8. Posting flow: publish gate for weak listings
9. Carrier profile: layered badges
10. Off-platform leak prevention
11. Thread header tied to booking status
12. Automated nudges for missing next steps
13. Booking breakdown consistency
14. Pickup proof pack
15. Founder ops cockpit

## What Not To Build By Accident

Do not let these tasks drift into:

- quote requests from customers to many carriers
- bidding wars
- hidden ranking logic that cannot be explained
- live dispatch and route optimization
- bespoke removalist service packages
- unlimited message-based price negotiation
- complicated enterprise compliance theater

## Research Basis

This document was informed by patterns repeatedly visible across:

- Airtasker trust, contact privacy, badges, payment release, payout, and communication rules
- Airbnb listing clarity, total-price visibility, response expectations, pending states, reviews, accessibility thinking, and host operations patterns
- marketplace operations playbooks for payments, messaging, and notifications
- Australia-specific privacy, consumer, safety, and reporting guidance

The important move was not to copy those products literally.
The important move was to translate what makes them legible, trustworthy, and operationally resilient into moverrr's much narrower spare-capacity marketplace.
