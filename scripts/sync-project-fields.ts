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
 * Fields parsed from issue body (markdown headings):
 *   Lock Group, Safe for Parallelism, Touches Shared Logic,
 *   Founder Decision Needed, Verification Status
 *
 * Prerequisites:
 *   gh auth refresh -s project   (requires project scope)
 *   npm run ops:sync-fields
 *
 * Usage:
 *   npm run ops:sync-fields           — live run
 *   npm run ops:sync-fields -- --dry-run   — preview only, no mutations
 */

import { execSync } from "node:child_process";

const OWNER = "KKiranG";
const PROJECT_NUMBER = 1;
const DRY_RUN = process.argv.includes("--dry-run") || process.argv.includes("-n");

if (DRY_RUN) {
  console.log("[dry-run] No mutations will be made.");
}

// Label prefixes that map to project single-select fields
const LABEL_FIELD_PREFIXES = ["lane", "priority", "size", "risk", "state"];

// Issue body markdown patterns for body-only fields (not synced to project fields yet,
// but parsed and logged for future extension)
const BODY_FIELD_PATTERNS: Array<[string, RegExp]> = [
  ["lockGroup", /##\s+Lock Group\s*\n+[-*]\s+(.+)/i],
  ["safeForParallelism", /##\s+Safe for Parallelism\s*\n+[-*]\s+(.+)/i],
  ["touchesSharedLogic", /##\s+Touches Shared Logic\s*\n+[-*]\s+(.+)/i],
  ["founderDecisionNeeded", /##\s+Founder Decision Needed\s*\n+[-*]\s+(.+)/i],
  ["verificationStatus", /##\s+Verification Status\s*\n+[-*]\s+(.+)/i],
];

function safeExec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Resource not accessible by integration")) {
      console.error("\nMissing GitHub project scope. Run:");
      console.error("  gh auth refresh -s project");
      console.error("\nThen retry: npm run ops:sync-fields");
      process.exit(1);
    }
    throw err;
  }
}

function ghJson<T>(args: string): T {
  return JSON.parse(safeExec(`gh ${args}`));
}

function gqlJson<T>(query: string): T {
  return JSON.parse(safeExec(`gh api graphql -f query='${query}'`));
}

// Discover the project ID and its single-select fields dynamically
function discoverProject(owner: string, projectNumber: number): string {
  const result = gqlJson<{ data: { user: { projectV2: { id: string } } } }>(
    `{ user(login: "${owner}") { projectV2(number: ${projectNumber}) { id } } }`
  );
  return result.data.user.projectV2.id;
}

interface ProjectField {
  id: string;
  name: string;
  options?: Array<{ id: string; name: string }>;
}

function discoverFields(projectId: string): ProjectField[] {
  const result = gqlJson<{
    data: {
      node: {
        fields: {
          nodes: Array<{
            __typename: string;
            id: string;
            name: string;
            options?: Array<{ id: string; name: string }>;
          }>;
        };
      };
    };
  }>(
    `{ node(id: "${projectId}") { ... on ProjectV2 { fields(first: 30) { nodes { __typename id name ... on ProjectV2SingleSelectField { options { id name } } } } } } }`
  );
  return result.data.node.fields.nodes
    .filter((n) => n.__typename === "ProjectV2SingleSelectField")
    .map((n) => ({ id: n.id, name: n.name, options: n.options }));
}

function parseIssueBodyFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, pattern] of BODY_FIELD_PATTERNS) {
    const m = body.match(pattern);
    if (m?.[1]) {
      fields[key] = m[1].trim();
    }
  }
  return fields;
}

function setField(projectId: string, itemId: string, fieldId: string, optionId: string, label: string): void {
  if (DRY_RUN) {
    console.log(`    [dry-run] Would set ${label} on item ${itemId}`);
    return;
  }
  safeExec(
    `gh api graphql -f query='mutation { updateProjectV2ItemFieldValue(input: { projectId: "${projectId}" itemId: "${itemId}" fieldId: "${fieldId}" value: { singleSelectOptionId: "${optionId}" } }) { projectV2Item { id } } }'`
  );
}

console.log("==> Discovering project...");
const PROJECT_ID = discoverProject(OWNER, PROJECT_NUMBER);
console.log(`    Project ID: ${PROJECT_ID}`);

console.log("==> Discovering fields...");
const projectFields = discoverFields(PROJECT_ID);

// Build lookup: prefix → { fieldId, options: { value → optionId } }
const fieldMap = new Map<string, { fieldId: string; options: Map<string, string> }>();
for (const prefix of LABEL_FIELD_PREFIXES) {
  const match = projectFields.find((f) => f.name.toLowerCase() === prefix || f.name.toLowerCase().startsWith(prefix));
  if (match?.options) {
    const options = new Map(match.options.map((o) => [o.name.toLowerCase(), o.id]));
    fieldMap.set(prefix, { fieldId: match.id, options });
    console.log(`    ${prefix} → field "${match.name}" (${match.options.length} options)`);
  }
}

console.log("==> Loading project items...");

const items = ghJson<{
  items: Array<{
    id: string;
    content: { number: number; title: string; body?: string };
    labels: string[];
  }>;
}>(`project item-list ${PROJECT_NUMBER} --owner ${OWNER} --format json`);

console.log(`    Found ${items.items.length} items`);
console.log("==> Syncing label data to project fields...");

for (const item of items.items) {
  const num = item.content.number;
  const labels = item.labels ?? [];
  const synced: string[] = [];

  for (const label of labels) {
    for (const prefix of LABEL_FIELD_PREFIXES) {
      if (label.startsWith(`${prefix}:`)) {
        const value = label.slice(prefix.length + 1).toLowerCase();
        const field = fieldMap.get(prefix);
        if (!field) continue;
        const optionId = field.options.get(value);
        if (optionId) {
          try {
            setField(PROJECT_ID, item.id, field.fieldId, optionId, `${prefix}=${value}`);
            synced.push(`${prefix}=${value}`);
          } catch {
            console.log(`    ! #${num}: failed to set ${prefix}=${value}`);
          }
        }
      }
    }
  }

  // Parse body fields and log (not yet synced to project, but available for extension)
  const bodyFields = item.content.body ? parseIssueBodyFields(item.content.body) : {};
  const bodySummary = Object.entries(bodyFields)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  if (synced.length > 0 || bodySummary) {
    const parts = [
      synced.length > 0 ? synced.join(", ") : null,
      bodySummary ? `body:${bodySummary}` : null,
    ].filter(Boolean);
    console.log(`    + #${num} ${item.content.title.slice(0, 50)}: ${parts.join(" | ")}`);
  } else {
    console.log(`    ~ #${num}: no matching label fields`);
  }
}

const mode = DRY_RUN ? " [dry-run — no changes made]" : "";
console.log(`\nDone.${mode}`);
console.log(`Project: https://github.com/users/${OWNER}/projects/${PROJECT_NUMBER}`);
