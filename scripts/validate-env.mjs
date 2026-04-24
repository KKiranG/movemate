#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = modeArg?.slice("--mode=".length) ?? "local";
const root = process.cwd();
const requiredProductionEnv = JSON.parse(
  fs.readFileSync(path.join(root, "config/required-production-env.json"), "utf8"),
);

const optionalIntegrationEnv = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
];

const configured = (key) => Boolean(process.env[key]?.trim());
const missingRequired = requiredProductionEnv.filter((key) => !configured(key));
const missingOptional = optionalIntegrationEnv.filter((key) => !configured(key));

console.log(`MoveMate environment check (${mode})`);

if (missingRequired.length === 0) {
  console.log("Required production secrets: configured");
} else {
  console.log(`Required production secrets missing: ${missingRequired.join(", ")}`);
}

if (missingOptional.length === 0) {
  console.log("Optional integration secrets: configured");
} else {
  console.log(`Optional integration secrets missing: ${missingOptional.join(", ")}`);
}

if (mode === "production" && missingRequired.length > 0) {
  console.error("Production mode requires all required production secrets.");
  process.exit(1);
}

console.log(
  mode === "production"
    ? "Production env contract satisfied."
    : "Local env check complete. Missing live-service secrets are acceptable for check/test/build unless a flow explicitly needs them.",
);
