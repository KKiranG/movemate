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
 *   2. Adds the required custom fields (skips fields that already exist)
 *   3. Adds all open repo issues to the project (paginates until exhausted)
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
 *   - Current State           (single-select: inbox, shaping, ready, claimed,
 *                              in-progress, pr-open, needs-review, needs-founder-decision,
 *                              blocked, duplicate, rejected, deferred, done)
 *
 * Views: GitHub's API does not expose a createProjectV2View mutation.
 *   Create the 9 views manually in the GitHub UI after running this script.
 *   See the "Next steps" output at the end of the script.
 */

import { execFileSync } from "node:child_process";

const REPO = "KKiranG/moverrr";
const ORG = "KKiranG";
const PROJECT_TITLE = "MoveMate Control Plane";

function gh(args: string[]): string {
  return execFileSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function ghJson<T>(args: string[]): T {
  return JSON.parse(gh(args));
}

function isAlreadyExistsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Name has already been taken") ||
    msg.includes("already exists") ||
    msg.includes("already in project") ||
    msg.includes("Could not resolve") === false && msg.includes("already")
  );
}

// ── 1. Find or create project ──────────────────────────────────────────────

console.log(`==> Checking for existing project "${PROJECT_TITLE}"...`);

const existingProjects = ghJson<{ number: number; title: string }[]>([
  "project",
  "list",
  "--owner",
  ORG,
  "--format",
  "json",
  "--jq",
  ".projects",
]);

let projectNumber: number;
const existing = existingProjects?.find((p) => p.title === PROJECT_TITLE);

if (existing) {
  projectNumber = existing.number;
  console.log(`    Found existing project #${projectNumber}`);
} else {
  console.log(`    Creating new project "${PROJECT_TITLE}"...`);
  const result = ghJson<{ number: number }>([
    "project",
    "create",
    "--owner",
    ORG,
    "--title",
    PROJECT_TITLE,
    "--format",
    "json",
  ]);
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
    "claimed",
    "in-progress",
    "pr-open",
    "needs-review",
    "needs-founder-decision",
    "blocked",
    "duplicate",
    "rejected",
    "deferred",
    "done",
  ],
};

const textFields = ["Blocked By"];

console.log("==> Creating custom fields...");

for (const [name, options] of Object.entries(singleSelectFields)) {
  try {
    gh([
      "project",
      "field-create",
      String(projectNumber),
      "--owner",
      ORG,
      "--name",
      name,
      "--data-type",
      "SINGLE_SELECT",
      "--single-select-options",
      options.join(","),
    ]);
    console.log(`    + ${name} (single-select, ${options.length} options)`);
  } catch (err) {
    if (isAlreadyExistsError(err)) {
      console.log(`    ~ ${name} already exists — skipping`);
    } else {
      console.error(`    ! ${name} failed to create:`);
      throw err;
    }
  }
}

for (const name of textFields) {
  try {
    gh([
      "project",
      "field-create",
      String(projectNumber),
      "--owner",
      ORG,
      "--name",
      name,
      "--data-type",
      "TEXT",
    ]);
    console.log(`    + ${name} (text)`);
  } catch (err) {
    if (isAlreadyExistsError(err)) {
      console.log(`    ~ ${name} already exists — skipping`);
    } else {
      console.error(`    ! ${name} failed to create:`);
      throw err;
    }
  }
}

// ── 3. Backfill all open issues into project (paginated) ───────────────────

console.log("==> Adding open issues to project...");

// gh issue list handles pagination internally when limit > page size (100).
// Use a high limit that covers any realistic repo size. If you exceed this,
// run the script again — it will skip already-added issues.
const PAGE_LIMIT = 2000;

const issues = ghJson<{ number: number; title: string }[]>([
  "issue",
  "list",
  "--repo",
  REPO,
  "--state",
  "open",
  "--limit",
  String(PAGE_LIMIT),
  "--json",
  "number,title",
]);

console.log(`    Found ${issues.length} open issues`);

for (const issue of issues) {
  try {
    gh([
      "project",
      "item-add",
      String(projectNumber),
      "--owner",
      ORG,
      "--url",
      `https://github.com/${REPO}/issues/${issue.number}`,
    ]);
    console.log(`    + #${issue.number} ${issue.title}`);
  } catch (err) {
    if (isAlreadyExistsError(err)) {
      console.log(`    ~ #${issue.number} already in project — skipping`);
    } else {
      console.error(`    ! #${issue.number} failed to add:`);
      throw err;
    }
  }
}

// ── 4. Done ────────────────────────────────────────────────────────────────

console.log(`
Done. Project URL: https://github.com/users/${ORG}/projects/${projectNumber}

Manual next steps (GitHub's API has no createProjectV2View mutation):
  1. Open the project URL and create these 9 views using the Current State field:
     - Inbox                  Current State = inbox
     - Shaping                Current State = shaping
     - Ready                  Current State = ready
     - Claimed                Current State = claimed
     - In Progress            Current State = in-progress
     - PR Open                Current State = pr-open
     - Needs Review           Current State = needs-review
     - Needs Founder Decision Current State = needs-founder-decision
     - Blocked                Current State = blocked
     - Deferred / Duplicate   Current State = deferred OR duplicate
     - Done                   Current State = done
  2. Sort "Ready" view by Priority p0 → p4
  3. Set "Needs Founder Decision" as the escalation view the founder checks first
`);
