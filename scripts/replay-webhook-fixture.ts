import path from "node:path";

import Stripe from "stripe";

import { POST } from "@/app/api/payments/webhook/route";
import {
  createBookingRow,
  installSupabaseRestHarness,
} from "@/lib/__tests__/helpers/supabase-rest-harness";
import {
  getWebhookReplayFixturePath,
  loadWebhookReplayFixture,
} from "@/app/api/payments/webhook/__tests__/replay-fixtures";

const STRIPE_TEST_SECRET_KEY = "sk_test_frontier_verifier";
const STRIPE_TEST_WEBHOOK_SECRET = "whsec_frontier_verifier";

function createSignedStripeRequest(event: Record<string, unknown>) {
  const stripe = new Stripe(STRIPE_TEST_SECRET_KEY);
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: STRIPE_TEST_WEBHOOK_SECRET,
  });

  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
  });
}

async function main() {
  const fixtureName = process.argv[2] ?? "payment-intent-lifecycle.json";
  const fixture = loadWebhookReplayFixture(fixtureName);
  const harness = installSupabaseRestHarness({
    bookings: [
      createBookingRow({
        id: fixture.bookingId,
      }),
    ],
  });

  const previousStripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const previousWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_SECRET_KEY = STRIPE_TEST_SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = STRIPE_TEST_WEBHOOK_SECRET;

  try {
    const steps: Array<Record<string, unknown>> = [];

    for (const step of fixture.steps) {
      const response = await POST(createSignedStripeRequest(step.event));
      const body = await response.json();
      const booking = harness.getBooking(fixture.bookingId);
      const paymentStatus = booking?.payment_status ?? null;

      steps.push({
        name: step.name,
        responseStatus: response.status,
        responseBody: body,
        paymentStatus,
      });

      if (
        step.expectedPaymentStatus &&
        paymentStatus !== step.expectedPaymentStatus
      ) {
        throw new Error(
          `Replay step ${step.name} ended with ${paymentStatus ?? "null"} instead of ${step.expectedPaymentStatus}.`,
        );
      }
    }

    console.log(
      JSON.stringify(
        {
          fixture: path.basename(getWebhookReplayFixturePath(fixtureName)),
          bookingId: fixture.bookingId,
          finalBooking: harness.getBooking(fixture.bookingId),
          steps,
        },
        null,
        2,
      ),
    );
  } finally {
    harness.restore();

    if (previousStripeSecretKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = previousStripeSecretKey;
    }

    if (previousWebhookSecret === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = previousWebhookSecret;
    }
  }
}

void main();
