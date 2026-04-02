import fs from "node:fs/promises";
import path from "node:path";

import type Stripe from "stripe";

import {
  applyPaymentIntentEvent,
  createSupabaseBookingPaymentRepository,
} from "@/lib/stripe/payment-intent-events";

const args = process.argv.slice(2);
const fixturePath = args.find((arg) => !arg.startsWith("--"));
const bookingIdOverride = args
  .find((arg) => arg.startsWith("--booking-id="))
  ?.replace("--booking-id=", "");

if (!fixturePath) {
  console.error(
    "Usage: npm run webhook:replay -- <fixture-path> [--booking-id=<booking-id>]",
  );
  process.exit(1);
}

function replaceBookingId(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(replaceBookingId);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, replaceBookingId(nestedValue)]),
    );
  }

  if (value === "__BOOKING_ID__" && bookingIdOverride) {
    return bookingIdOverride;
  }

  return value;
}

async function main() {
  const absolutePath = path.resolve(process.cwd(), fixturePath);
  const raw = await fs.readFile(absolutePath, "utf8");
  const parsed = replaceBookingId(JSON.parse(raw));
  const events = Array.isArray(parsed) ? parsed : [parsed];
  const repository = createSupabaseBookingPaymentRepository();
  const results = [];

  for (const event of events) {
    const result = await applyPaymentIntentEvent(event as Stripe.Event, {
      repository,
      log: (level, message, context) => {
        console[level](`[webhook-replay] ${message}`, context);
      },
    });
    results.push(result);
  }

  console.log(JSON.stringify(results, null, 2));
}

void main();
