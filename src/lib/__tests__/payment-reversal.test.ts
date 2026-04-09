import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";

import { reverseBookingPayment } from "@/lib/stripe/payment-actions";
import type { Database } from "@/types/database";

function createSupabaseStub() {
  const patches: Array<Record<string, unknown>> = [];

  const supabase = {
    from() {
      return {
        update(patch: Record<string, unknown>) {
          patches.push(patch);
          return {
            async eq() {
              return { error: null };
            },
          };
        },
      };
    },
  };

  return {
    patches,
    supabase: supabase as unknown as import("@supabase/supabase-js").SupabaseClient<Database>,
  };
}

test("authorized cancellations void the payment intent and mark authorization cancelled", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const { patches, supabase } = createSupabaseStub();
  let cancelCalled = false;
  const stripe = {
    paymentIntents: {
      retrieve: async () => ({ status: "requires_capture" }),
      cancel: async () => {
        cancelCalled = true;
        return { id: "pi_auth" };
      },
    },
  } as unknown as Stripe;

  try {
    const result = await reverseBookingPayment({
      supabase,
      bookingId: "booking-1",
      paymentIntentId: "pi_auth",
      paymentStatus: "authorized",
      feature: "bookings",
      action: "test_authorization_cancel",
      stripeClient: stripe,
    });

    assert.equal(cancelCalled, true);
    assert.equal(result.nextPaymentStatus, "authorization_cancelled");
    assert.deepEqual(patches[0], { payment_status: "authorization_cancelled" });
  } finally {
    delete process.env.STRIPE_SECRET_KEY;
  }
});

test("captured cancellations issue refunds and mark refunded", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const { patches, supabase } = createSupabaseStub();
  let refundCalled = false;
  const stripe = {
    paymentIntents: {
      retrieve: async () => ({ status: "succeeded" }),
    },
    refunds: {
      create: async () => {
        refundCalled = true;
        return { id: "re_test" };
      },
    },
  } as unknown as Stripe;

  try {
    const result = await reverseBookingPayment({
      supabase,
      bookingId: "booking-2",
      paymentIntentId: "pi_captured",
      paymentStatus: "captured",
      feature: "admin",
      action: "test_refund",
      stripeClient: stripe,
    });

    assert.equal(refundCalled, true);
    assert.equal(result.nextPaymentStatus, "refunded");
    assert.deepEqual(patches[0], {
      payment_status: "refunded",
      payment_failure_code: null,
      payment_failure_reason: null,
    });
  } finally {
    delete process.env.STRIPE_SECRET_KEY;
  }
});
