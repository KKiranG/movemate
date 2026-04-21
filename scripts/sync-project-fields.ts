#!/usr/bin/env node
/**
 * sync-project-fields.ts
 *
 * Reads each issue's GitHub labels and populates the matching
 * Project v2 field values so the board is immediately usable for routing.
 *
 * Fields synced from labels:
 *   lane:*       → Lane field
 *   priority:*   → Priority field
 *   size:*       → Size field
 *   risk:*       → Risk field
 *   state:*      → Current State field
 *
 * Fields NOT synced (live in issue body, not labels):
 *   Lock Group, Safe for Parallelism, Touches Shared Logic,
 *   Founder Decision Needed, Verification Status
 *
 * Prerequisites:
 *   gh auth refresh -s project   (requires project scope)
 *   npm run ops:sync-fields
 */

import { execSync } from "node:child_process";

const PROJECT_ID = "PVT_kwHOBWR0-84BVQq5";
const OWNER = "KKiranG";
const PROJECT_NUMBER = 1;

// Field IDs and option maps — derived from the live project
const FIELDS: Record<string, { fieldId: string; options: Record<string, string> }> = {
  lane: {
    fieldId: "PVTSSF_lAHOBWR0-84BVQq5zhQts1o",
    options: {
      "ux-builder": "a3e4601d",
      "ui-builder": "2ac3c85c",
      "backend-builder": "f4fca4b4",
      "trust-safety": "e8bce2c5",
      "performance-reliability": "49bc6c0b",
      scout: "0a7867aa",
      "docs-sync": "bdc35463",
      review: "7953eca4",
      deploy: "d333c266",
      testing: "454f990d",
    },
  },
  priority: {
    fieldId: "PVTSSF_lAHOBWR0-84BVQq5zhQts3c",
    options: {
      p0: "32c69e44",
      p1: "46cec27d",
      p2: "905d6983",
      p3: "544d115d",
      p4: "87f207f9",
    },
  },
  size: {
    fieldId: "PVTSSF_lAHOBWR0-84BVQq5zhQts4U",
    options: {
      xs: "228ef055",
      s: "104e9dbf",
      m: "fb29e393",
      l: "501df684",
      xl: "f3ac348a",
    },
  },
  risk: {
    fieldId: "PVTSSF_lAHOBWR0-84BVQq5zhQts5Y",
    options: {
      low: "59e7a9d4",
      medium: "64c796e9",
      high: "5265bba4",
      critical: "4b005f8e",
    },
  },
  state: {
    fieldId: "PVTSSF_lAHOBWR0-84BVQq5zhQtt0Y",
    options: {
      inbox: "8f24e22a",
      shaping: "06d08ef4",
      ready: "22d157a6",
      "in-progress": "45925ac6",
      "pr-open": "f63d1a4d",
      "needs-review": "8c92d964",
      "needs-founder-decision": "072580bb",
      blocked: "a02d56f4",
      done: "f3810dc5",
    },
  },
};

function ghJson<T>(args: string): T {
  return JSON.parse(execSync(`gh ${args}`, { encoding: "utf8" }).trim());
}

function setField(itemId: string, fieldId: string, optionId: string): void {
  execSync(
    `gh api graphql -f query='mutation { updateProjectV2ItemFieldValue(input: { projectId: "${PROJECT_ID}" itemId: "${itemId}" fieldId: "${fieldId}" value: { singleSelectOptionId: "${optionId}" } }) { projectV2Item { id } } }'`,
    { encoding: "utf8" }
  );
}

console.log("==> Loading project items...");

const items = ghJson<{
  items: Array<{
    id: string;
    content: { number: number; title: string };
    labels: string[];
  }>;
}>(
  `project item-list ${PROJECT_NUMBER} --owner ${OWNER} --format json`
);

console.log(`    Found ${items.items.length} items`);
console.log("==> Syncing label data to project fields...");

for (const item of items.items) {
  const num = item.content.number;
  const labels = item.labels ?? [];
  const synced: string[] = [];

  for (const label of labels) {
    for (const [prefix, field] of Object.entries(FIELDS)) {
      if (label.startsWith(`${prefix}:`)) {
        const value = label.slice(prefix.length + 1);
        const optionId = field.options[value];
        if (optionId) {
          try {
            setField(item.id, field.fieldId, optionId);
            synced.push(`${prefix}=${value}`);
          } catch {
            console.log(`    ! #${num}: failed to set ${prefix}=${value}`);
          }
        }
      }
    }
  }

  if (synced.length > 0) {
    console.log(`    + #${num} ${item.content.title.slice(0, 50)}: ${synced.join(", ")}`);
  } else {
    console.log(`    ~ #${num}: no matching label fields`);
  }
}

console.log("\nDone. Board fields are now populated from issue labels.");
console.log(`Project: https://github.com/users/${OWNER}/projects/${PROJECT_NUMBER}`);
