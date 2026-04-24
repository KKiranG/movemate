#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const driftPattern = [
  "join the waitlist",
  "launch waitlist",
  "browse-first match",
  "book directly into real spare capacity",
  "direct booking enabled",
  "direct booking flow",
  "starting from price",
  "starting from \\$",
  "prices from",
  "gstack is the approved workflow layer",
  "approved workflow layer — gstack",
  "Manual payment capture by admin",
  "governing blueprint describes 15% of the full subtotal",
  "per-km detour rate",
].join("|");

const args = [
  "-n",
  driftPattern,
  "src",
  "README.md",
  "AGENTS.md",
  "AUTHORITY.md",
  "CLAUDE.md",
  "docs",
  ".agent-skills",
  ".claude",
  "supabase",
  "--glob",
  "!.claude/worktrees/**",
  "--glob",
  "!docs/engineering/**",
  "--glob",
  "!**/saved-search-demand-review/**",
  "--glob",
  "!**/CODEBASE-MAP.md",
  "--glob",
  "!**/command-catalog.md",
  "--glob",
  "!**/experiment-loop/SKILL.md",
  "--glob",
  "!**/capability-index.md",
];

const result = spawnSync("rg", args, {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.status === 0) {
  process.stdout.write(result.stdout);
  process.stderr.write("Product drift terms found. Resolve them or narrow the scanner with a documented exception.\n");
  process.exit(1);
}

if (result.status === 1) {
  console.log("No product drift terms found.");
  process.exit(0);
}

process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
