import assert from "node:assert/strict";
import test from "node:test";

import Stripe from "stripe";

import { POST } from "@/app/api/payments/webhook/route";
import { installSupabaseRestHarness } from "@/lib/__tests__/helpers/supabase-rest-harness";

const STRIPE_TEST_SECRET_KEY = "sk_test_frontier_verifier";
const STRIPE_TEST_WEBHOOK_SECRET = "whsec_frontier_verifier";

function setStripeTestEnv() {
  const snapshot = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  };

  process.env.STRIPE_SECRET_KEY = STRIPE_TEST_SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = STRIPE_TEST_WEBHOOK_SECRET;

  return () => {
    for (const [key, value] of Object.entries(snapshot)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
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

test("duplicate Stripe webhook events are acknowledged without reprocessing", async () => {
  const restoreStripeEnv = setStripeTestEnv();
  const harness = installSupabaseRestHarness();
  const event = {
    id: "evt_duplicate_guard",
    type: "payment_intent.amount_capturable_updated",
    data: {
      object: {
        id: "pi_duplicate_guard",
        metadata: {},
      },
    },
  };

  try {
    const firstResponse = await POST(createSignedStripeRequest(event));
    const firstBody = await firstResponse.json();

    assert.equal(firstResponse.status, 200);
    assert.deepEqual(firstBody, {
      received: true,
      type: "payment_intent.amount_capturable_updated",
    });

    const secondResponse = await POST(createSignedStripeRequest(event));
    const secondBody = await secondResponse.json();

    assert.equal(secondResponse.status, 200);
    assert.deepEqual(secondBody, {
      received: true,
      duplicate: true,
      type: "payment_intent.amount_capturable_updated",
    });

    const webhookInserts = harness.state.requests.filter(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/rest/v1/stripe_webhook_events",
    );

    assert.equal(webhookInserts.length, 2);
  } finally {
    harness.restore();
    restoreStripeEnv();
  }
});
