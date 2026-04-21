#!/usr/bin/env node
/**
 * setup-github-project.ts
 *
 * Creates the MoveMate GitHub Project v2 board, adds required custom fields,
 * and backfills all open issues into the project.
 *
 * Prerequisites:
 *   gh auth refresh -s project   (requires interactive browser approval)
 *   npm run ops:project
 *
 * What this script does:
 *   1. Creates a "MoveMate Control Plane" project under the KKiranG org (if not present)
 *   2. Adds the required custom fields
 *   3. Adds all open repo issues to the project
 *
 * Fields created:
 *   - Lane         (single-select: ux-builder, ui-builder, backend-builder,
 *                   trust-safety, performance-reliability, scout, docs-sync,
 *                   review, deploy, testing)
 *   - Lock Group   (single-select: customer-acquisition, customer-booking-lifecycle,
 *                   carrier-activation-posting, carrier-operations,
 *                   matching-pricing-state, admin-operator, system-hygiene)
 *   - Priority     (single-select: p0, p1, p2, p3, p4)
 *   - Size         (single-select: xs, s, m, l, xl)
 *   - Risk         (single-select: low, medium, high, critical)
 *   - Blocked By   (text)
 *   - Safe for Parallelism    (single-select: yes, no)
 *   - Touches Shared Logic    (single-select: yes, no)
 *   - Founder Decision Needed (single-select: yes, no)
 *   - Verification Status     (single-select: pending, partial, complete, blocked)
 *
 * Views created (using saved filters, which are supported without extra scopes):
 *   Inbox, Shaping, Ready, In Progress, PR Open,
 *   Needs Review, Needs Founder Decision, Blocked, Done
 */

import { execSync } from "node:child_process";

const REPO = "KKiranG/moverrr";
const ORG = "KKiranG";
const PROJECT_TITLE = "MoveMate Control Plane";

function gh(args: string): string {
  return execSync(`gh ${args}`, { encoding: "utf8" }).trim();
}

function ghJson<T>(args: string): T {
  return JSON.parse(gh(args));
}

// ── 1. Find or create project ──────────────────────────────────────────────

console.log(`==> Checking for existing project "${PROJECT_TITLE}"...`);

const existingProjects = ghJson<{ number: number; title: string }[]>(
  `project list --owner ${ORG} --format json --jq ".projects"`
);

let projectNumber: number;
const existing = existingProjects?.find((p) => p.title === PROJECT_TITLE);

if (existing) {
  projectNumber = existing.number;
  console.log(`    Found existing project #${projectNumber}`);
} else {
  console.log(`    Creating new project "${PROJECT_TITLE}"...`);
  const result = ghJson<{ number: number }>(
    `project create --owner ${ORG} --title "${PROJECT_TITLE}" --format json`
  );
  projectNumber = result.number;
  console.log(`    Created project #${projectNumber}`);
}

// ── 2. Add custom fields ────────────────────────────────────────────────────

const singleSelectFields: Record<string, string[]> = {
  Lane: [
    "ux-builder",
    "ui-builder",
    "backend-builder",
    "trust-safety",
    "performance-reliability",
    "scout",
    "docs-sync",
    "review",
    "deploy",
    "testing",
  ],
  "Lock Group": [
    "customer-acquisition",
    "customer-booking-lifecycle",
    "carrier-activation-posting",
    "carrier-operations",
    "matching-pricing-state",
    "admin-operator",
    "system-hygiene",
  ],
  Priority: ["p0", "p1", "p2", "p3", "p4"],
  Size: ["xs", "s", "m", "l", "xl"],
  Risk: ["low", "medium", "high", "critical"],
  "Safe for Parallelism": ["yes", "no"],
  "Touches Shared Logic": ["yes", "no"],
  "Founder Decision Needed": ["yes", "no"],
  "Verification Status": ["pending", "partial", "complete", "blocked"],
  "Current State": [
    "inbox",
    "shaping",
    "ready",
    "in-progress",
    "pr-open",
    "needs-review",
    "needs-founder-decision",
    "blocked",
    "done",
  ],
};

const textFields = ["Blocked By"];

console.log("==> Creating custom fields...");

for (const [name, options] of Object.entries(singleSelectFields)) {
  try {
    const optionsList = options.join(",");
    gh(
      `project field-create ${projectNumber} --owner ${ORG} --name "${name}" --data-type SINGLE_SELECT --single-select-options "${optionsList}"`
    );
    console.log(`    + ${name} (single-select, ${options.length} options)`);
  } catch {
    console.log(`    ~ ${name} may already exist — skipping`);
  }
}

for (const name of textFields) {
  try {
    gh(
      `project field-create ${projectNumber} --owner ${ORG} --name "${name}" --data-type TEXT`
    );
    console.log(`    + ${name} (text)`);
  } catch {
    console.log(`    ~ ${name} may already exist — skipping`);
  }
}

// ── 3. Backfill open issues into project ───────────────────────────────────

console.log("==> Adding open issues to project...");

const issues = ghJson<{ number: number; title: string }[]>(
  `issue list --repo ${REPO} --state open --limit 100 --json number,title`
);

for (const issue of issues) {
  try {
    gh(
      `project item-add ${projectNumber} --owner ${ORG} --url "https://github.com/${REPO}/issues/${issue.number}"`
    );
    console.log(`    + #${issue.number} ${issue.title}`);
  } catch {
    console.log(`    ~ #${issue.number} already in project — skipping`);
  }
}

// ── 4. Done ────────────────────────────────────────────────────────────────

console.log(`
Done. Project URL: https://github.com/orgs/${ORG}/projects/${projectNumber}

Next steps:
  1. Open the project URL and create views:
     - Inbox       filter: state:inbox
     - Shaping     filter: state:shaping
     - Ready       filter: state:ready
     - In Progress filter: state:in-progress
     - PR Open     filter: state:pr-open
     - Needs Review        filter: state:needs-review
     - Needs Founder Decision  filter: state:needs-founder-decision
     - Blocked     filter: state:blocked
     - Done        filter: state:done
  2. Sort "Ready" view by priority:p0 → p4
  3. Set "Needs Founder Decision" as the escalation view the founder checks first
`);
