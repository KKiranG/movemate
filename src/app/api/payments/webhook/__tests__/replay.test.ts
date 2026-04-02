import assert from "node:assert/strict";
import test from "node:test";

import Stripe from "stripe";

import { POST } from "@/app/api/payments/webhook/route";
import {
  createBookingRow,
  installSupabaseRestHarness,
} from "@/lib/__tests__/helpers/supabase-rest-harness";
import {
  loadWebhookReplayFixture,
  type WebhookReplayFixture,
} from "@/app/api/payments/webhook/__tests__/replay-fixtures";

const STRIPE_TEST_SECRET_KEY = "sk_test_frontier_verifier";
const STRIPE_TEST_WEBHOOK_SECRET = "whsec_frontier_verifier";

interface StripeEnvSnapshot {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

function setStripeTestEnv() {
  const snapshot: StripeEnvSnapshot = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  };

  process.env.STRIPE_SECRET_KEY = STRIPE_TEST_SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = STRIPE_TEST_WEBHOOK_SECRET;

  return () => {
    for (const [key, value] of Object.entries(snapshot)) {
      if (value === undefined) {
        delete process.env[key];
        continue;
      }

      process.env[key] = value;
    }
  };
}

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

async function replayFixture(
  fixture: WebhookReplayFixture,
  harness = installSupabaseRestHarness({
    bookings: [
      createBookingRow({
        id: fixture.bookingId,
        payment_status:
          fixture.initialPaymentStatus === "authorized" ||
          fixture.initialPaymentStatus === "captured" ||
          fixture.initialPaymentStatus === "capture_failed" ||
          fixture.initialPaymentStatus === "refunded" ||
          fixture.initialPaymentStatus === "failed" ||
          fixture.initialPaymentStatus === "authorization_cancelled"
            ? fixture.initialPaymentStatus
            : "pending",
      }),
    ],
  }),
) {
  const responses: Array<{ body: unknown; status: number }> = [];

  for (const step of fixture.steps) {
    const response = await POST(createSignedStripeRequest(step.event));
    const body = await response.json();
    responses.push({ body, status: response.status });

    assert.equal(response.status, 200, `${step.name} should return 200`);
    assert.deepEqual(body, {
      received: true,
      type: (step.event as { type: string }).type,
    });
    assert.equal(
      harness.getBooking(fixture.bookingId)?.payment_status,
      step.expectedPaymentStatus ?? harness.getBooking(fixture.bookingId)?.payment_status,
      `${step.name} should leave the booking in the expected payment state`,
    );
  }

  return { harness, responses };
}

test("webhook replay fixture drives authorize then capture and ignores duplicate capture replays", async () => {
  const restoreStripeEnv = setStripeTestEnv();
  const fixture = loadWebhookReplayFixture("payment-intent-lifecycle.json");
  const harness = installSupabaseRestHarness({
    bookings: [
      createBookingRow({
        id: fixture.bookingId,
        payment_status: "pending",
      }),
    ],
  });

  try {
    await replayFixture(fixture, harness);

    assert.equal(harness.getBooking(fixture.bookingId)?.payment_status, "captured");

    const capturedUpdates = harness.state.requests.filter(
      (request) =>
        request.method === "PATCH" &&
        request.pathname === "/rest/v1/bookings" &&
        typeof request.body === "object" &&
        request.body !== null &&
        "payment_status" in request.body &&
        (request.body as { payment_status?: string }).payment_status === "captured",
    );

    assert.equal(capturedUpdates.length, 1);
  } finally {
    harness.restore();
    restoreStripeEnv();
  }
});

test("webhook replay fixture records failed authorizations with the Stripe decline details", async () => {
  const restoreStripeEnv = setStripeTestEnv();
  const fixture = loadWebhookReplayFixture("payment-intent-failed.json");
  const harness = installSupabaseRestHarness({
    bookings: [
      createBookingRow({
        id: fixture.bookingId,
        payment_status: "pending",
      }),
    ],
  });

  try {
    await replayFixture(fixture, harness);

    const booking = harness.getBooking(fixture.bookingId);
    assert.equal(booking?.payment_status, "failed");
    assert.equal(booking?.payment_failure_code, "insufficient_funds");
    assert.equal(booking?.payment_failure_reason, "Card was declined.");
  } finally {
    harness.restore();
    restoreStripeEnv();
  }
});

test("webhook replay fixture leaves booking state untouched when Stripe metadata is missing the booking id", async () => {
  const restoreStripeEnv = setStripeTestEnv();
  const fixture = loadWebhookReplayFixture("payment-intent-missing-booking-id.json");
  const harness = installSupabaseRestHarness({
    bookings: [
      createBookingRow({
        id: fixture.bookingId,
        payment_status: "pending",
      }),
    ],
  });

  try {
    await replayFixture(fixture, harness);

    assert.equal(harness.getBooking(fixture.bookingId)?.payment_status, "pending");
    assert.equal(
      harness.state.requests.some(
        (request) =>
          request.method === "PATCH" && request.pathname === "/rest/v1/bookings",
      ),
      false,
    );
  } finally {
    harness.restore();
    restoreStripeEnv();
  }
});
