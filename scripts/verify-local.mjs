#!/usr/bin/env node
/**
 * Local verification — runs the full agent-safe verification contract in sequence.
 * Use this before opening a PR or handing work to another agent.
 *
 * Steps (from docs/operations/agent-safe-verification.md):
 *  1. npm run env:check
 *  2. npm run check
 *  3. npm run test
 *  4. npm run build
 *  5. /api/health probe (requires dev server running separately)
 *
 * Note: Steps 1-4 are run by this script. Step 5 (health probe + browser routes)
 * must be done manually or via `npm run verify:e2e:preflight` with the dev server active.
 */

import { execSync } from "node:child_process";

const steps = [
  { name: "env:check", cmd: "npm run env:check" },
  { name: "check (lint + typecheck)", cmd: "npm run check" },
  { name: "test (unit)", cmd: "npm run test" },
  { name: "build", cmd: "npm run build" },
];

let allPassed = true;
const results = [];

console.log("\nMoveMate local verification\n");

for (const step of steps) {
  process.stdout.write(`  running  ${step.name} ...\n`);
  try {
    execSync(step.cmd, { stdio: "inherit" });
    results.push({ step: step.name, status: "ok" });
    console.log(`  ok       ${step.name}\n`);
  } catch {
    results.push({ step: step.name, status: "FAILED" });
    console.error(`  FAILED   ${step.name}\n`);
    allPassed = false;
    // Stop at first failure to avoid misleading cascade output.
    break;
  }
}

console.log("--- results ---");
for (const r of results) {
  console.log(`  ${r.status === "ok" ? "ok    " : "FAILED"} ${r.step}`);
}

if (allPassed) {
  console.log(`
All automated local checks passed.

Remaining manual steps (run with dev server active):
  npm run dev -- --port 3000
  curl -i http://localhost:3000/api/health
  npm run verify:e2e:preflight    (requires .env.e2e.local)
  Browser: /, /move/new, /auth/login, /auth/signup, /carrier
`);
  process.exit(0);
} else {
  console.error("\nVerification FAILED — fix failures before opening a PR.\n");
  process.exit(1);
}
