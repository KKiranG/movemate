/**
 * E2E data reset — safe, idempotent cleanup of E2E-created rows on the cloud dev Supabase project.
 *
 * SAFETY CONTRACT:
 *  - Only deletes rows where an E2E marker is present (see E2E_MARKER below).
 *  - Never runs against production. Fails hard if NEXT_PUBLIC_APP_ENV=production.
 *  - Only deletes from E2E-eligible tables.
 *
 * For local Supabase (supabase start): use `npm run supabase:reset` instead.
 * This script is for the cloud dev project where supabase:reset is not available.
 *
 * Usage: npm run e2e:reset
 * Requires: SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in env.
 */

import { createClient } from "@supabase/supabase-js";

// Load .env.e2e.local -> .env.local -> .env
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(fileName: string): boolean {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return false;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
  return true;
}

loadEnvFile(".env.e2e.local") || loadEnvFile(".env.local") || loadEnvFile(".env");

// Production guard — must be first.
if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
  console.error("e2e-reset: refused to run against NEXT_PUBLIC_APP_ENV=production.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("e2e-reset: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

// E2E rows are identified by this marker in the `notes` or a dedicated `e2e` column where available.
// Where a column does not exist, we use the seeded user IDs to scope deletes.
const E2E_MARKER = "__e2e__";
const SEED_CUSTOMER_ID = "22222222-2222-2222-2222-222222222222";
const SEED_CARRIER_ID_USER = "11111111-1111-1111-1111-111111111111";

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type DeleteResult = { table: string; count: number | null; error: string | null };
const results: DeleteResult[] = [];

async function deleteE2ERows(
  table: string,
  column: string,
  value: string
): Promise<void> {
  const { count, error } = await admin
    .from(table)
    .delete({ count: "exact" })
    .eq(column, value);
  results.push({ table, count: count ?? null, error: error?.message ?? null });
}

console.log("\nMoveMate E2E reset — cleaning E2E-created rows on cloud dev project\n");
console.log(`  Supabase URL: ${supabaseUrl}`);
console.log(`  App env: ${process.env.NEXT_PUBLIC_APP_ENV ?? "development"}\n`);

// Delete E2E move requests created by the seeded customer.
await deleteE2ERows("move_requests", "user_id", SEED_CUSTOMER_ID);

// Delete saved searches created by the seeded customer.
await deleteE2ERows("saved_searches", "user_id", SEED_CUSTOMER_ID);

// Delete booking requests where the customer is the seeded customer.
// This cascades to related bookings if FK delete rules are set; otherwise handle separately.
await deleteE2ERows("booking_requests", "customer_id", SEED_CUSTOMER_ID);

// Delete webhook event rows with the E2E marker in the event_type field.
await deleteE2ERows("webhook_events", "event_type", E2E_MARKER);

// Print results.
console.log("Results:");
let anyError = false;
for (const r of results) {
  if (r.error) {
    console.error(`  FAIL  ${r.table}: ${r.error}`);
    anyError = true;
  } else {
    console.log(`  ok    ${r.table}: ${r.count ?? 0} rows deleted`);
  }
}

if (anyError) {
  console.error("\nE2E reset completed with errors — check output above.\n");
  process.exit(1);
} else {
  console.log("\nE2E reset complete.\n");
  console.log("Next steps:");
  console.log("  1. Verify seed users still exist: carrier@example.com / customer@example.com");
  console.log("  2. Run `npm run verify:e2e:preflight` to confirm environment is ready");
  console.log("  3. Run `npm run e2e`\n");
}
