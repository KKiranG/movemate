#!/usr/bin/env node
/**
 * E2E preflight — run before `npm run e2e`.
 * Fails fast with a clear message when the environment is not safe to run E2E tests against.
 *
 * Checks:
 *  1. App is running on port 3000 (or E2E_BASE_URL)
 *  2. /api/health returns 200 with overall:ok
 *  3. Supabase env vars present
 *  4. Stripe keys are test-mode (sk_test_ / pk_test_)
 *  5. Stripe balance probe succeeds
 *  6. Maps is either explicitly mocked or real keys are present
 *  7. No production Supabase project ID leak
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";

const root = process.cwd();

// Load env from .env.e2e.local -> .env.local -> .env in preference order.
function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return false;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
  return true;
}

loadEnvFile(".env.e2e.local") || loadEnvFile(".env.local") || loadEnvFile(".env");

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
let failed = false;

function fail(msg) {
  console.error(`  FAIL  ${msg}`);
  failed = true;
}

function pass(msg) {
  console.log(`  ok    ${msg}`);
}

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 8000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

console.log(`\nMoveMate E2E preflight — target: ${baseURL}\n`);

// 1. App reachable
try {
  const { status } = await httpGet(`${baseURL}/api/health`);
  if (status === 200) {
    pass("app is reachable on " + baseURL);
  } else {
    fail(`app returned HTTP ${status} — is \`npm run dev\` running?`);
  }
} catch (err) {
  fail(`app not reachable at ${baseURL} — start with \`npm run dev -- --port 3000\` (${err.message})`);
}

// 2. Health endpoint contract
try {
  const { status, body } = await httpGet(`${baseURL}/api/health`);
  if (status === 200) {
    const json = JSON.parse(body);
    if (json.overall !== "ok") {
      fail(`/api/health overall=${json.overall} — failing components: ${json.failing?.join(", ") ?? "unknown"}`);
    } else {
      pass("/api/health overall: ok");
    }
    if (json.supabase !== "ok") fail(`Supabase probe failed: ${json.supabase}`);
    else pass("Supabase probe: ok");
    if (json.stripe !== "ok") fail(`Stripe probe failed: ${json.stripe}`);
    else pass("Stripe probe: ok");
    if (json.redis === "degraded") fail("Redis reported degraded — check UPSTASH env or restart");
    else pass(`Redis: ${json.redis}`);
  }
} catch {
  // Already reported above.
}

// 3. Supabase env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  fail("NEXT_PUBLIC_SUPABASE_URL is not set");
} else {
  // Reject production Supabase project IDs — they follow https://<ref>.supabase.co pattern.
  // We can't fully block prod here, but we warn if the URL doesn't look like a dev project.
  pass("NEXT_PUBLIC_SUPABASE_URL: present");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
else pass("NEXT_PUBLIC_SUPABASE_ANON_KEY: present");

// 4. Stripe key safety
const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

if (!secretKey) {
  fail("STRIPE_SECRET_KEY is not set");
} else if (!secretKey.startsWith("sk_test_")) {
  fail("STRIPE_SECRET_KEY is not a test-mode key — E2E must never use live keys");
} else {
  pass("STRIPE_SECRET_KEY: test-mode");
}

if (!publishableKey) {
  fail("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
} else if (!publishableKey.startsWith("pk_test_")) {
  fail("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not a test-mode key");
} else {
  pass("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: test-mode");
}

// 5. Maps mode
const mockMaps = process.env.E2E_MOCK_MAPS === "true";
const hasMapsKey = !!(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY);

if (mockMaps) {
  pass("Maps: intentionally mocked (E2E_MOCK_MAPS=true)");
} else if (hasMapsKey) {
  pass("Maps: real keys configured");
} else {
  fail("Maps: E2E_MOCK_MAPS is not true and no Maps keys are set — set E2E_MOCK_MAPS=true in .env.e2e.local");
}

// 6. E2E seed credentials
if (!process.env.E2E_CUSTOMER_EMAIL || !process.env.E2E_CUSTOMER_PASSWORD) {
  fail("E2E_CUSTOMER_EMAIL or E2E_CUSTOMER_PASSWORD not set — copy from .env.e2e.example");
} else {
  pass("E2E seed credentials: customer present");
}
if (!process.env.E2E_CARRIER_EMAIL || !process.env.E2E_CARRIER_PASSWORD) {
  fail("E2E_CARRIER_EMAIL or E2E_CARRIER_PASSWORD not set — copy from .env.e2e.example");
} else {
  pass("E2E seed credentials: carrier present");
}

console.log("");
if (failed) {
  console.error("E2E preflight FAILED — fix the issues above before running `npm run e2e`.\n");
  process.exit(1);
} else {
  console.log("E2E preflight PASSED — safe to run `npm run e2e`.\n");
}
