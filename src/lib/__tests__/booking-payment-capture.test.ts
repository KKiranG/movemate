import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";

import { updateBookingStatusForActor } from "@/lib/data/bookings";
import { AppError } from "@/lib/errors";
import {
  createBookingRow,
  createCarrierRow,
  createCustomerRow,
  installSupabaseRestHarness,
} from "@/lib/__tests__/helpers/supabase-rest-harness";
import * as stripeClient from "@/lib/stripe/client";

test("failed Stripe capture updates booking payment status to capture_failed", async () => {
  const harness = installSupabaseRestHarness({
    bookings: [
      createBookingRow({
        id: "booking-stripe-capture",
        status: "delivered", // allowed to transition to completed
        payment_status: "authorized",
        stripe_payment_intent_id: "pi_mock_123",
      }),
    ],
    carriers: [createCarrierRow()],
    customers: [createCustomerRow()],
  });

  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  let captureCalled = false;
  let retrieveCalled = false;

  const originalGetStripeServerClient = stripeClient.getStripeServerClient;

  // Use Object.defineProperty to bypass readonly getter in ESM import inside Node tests if `configurable` is true.
  try {
      Object.defineProperty(stripeClient, "getStripeServerClient", {
        value: () => {
             return {
               paymentIntents: {
                 retrieve: async () => {
                     retrieveCalled = true;
                     return { status: "requires_capture" };
                 },
                 capture: async () => {
                   captureCalled = true;
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   const err: any = new Error("Card declined");
                   err.code = "card_declined";
                   err.type = "StripeCardError";
                   Object.setPrototypeOf(err, Stripe.errors.StripeError.prototype);
                   throw err;
                 }
               }
             } as unknown as Stripe;
        },
        configurable: true,
      });
  } catch {
      // Fallback
  }

  const originalMakeRequest = Stripe.createNodeHttpClient().constructor.prototype.makeRequest;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  Stripe.createNodeHttpClient().constructor.prototype.makeRequest = async function (this: any, ...args: any[]) {
    const path = args[2] as string;
    if (path.includes("/capture")) {
       captureCalled = true;
       return {
             getStatusCode: () => 402,
             getHeaders: () => ({ 'content-type': 'application/json' }),
             getRawResponse: () => Buffer.from(JSON.stringify({
               error: { type: "card_error", code: "card_declined", message: "Declined" }
             })),
             toStream: () => null,
             toJSON: () => Promise.resolve({
                 error: { type: "card_error", code: "card_declined", message: "Declined" }
             })
       };
    }
    if (path.includes("pi_mock_123")) {
       retrieveCalled = true;
       return {
             getStatusCode: () => 200,
             getHeaders: () => ({ 'content-type': 'application/json' }),
             getRawResponse: () => Buffer.from(JSON.stringify({
               id: "pi_mock_123", status: "requires_capture"
             })),
             toStream: () => null,
             toJSON: () => Promise.resolve({
               id: "pi_mock_123", status: "requires_capture"
             })
       };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return originalMakeRequest.apply(this, args);
  };

  try {
    await updateBookingStatusForActor({
      userId: "admin-user-1",
      bookingId: "booking-stripe-capture",
      nextStatus: "completed",
      actorRole: "admin",
      adminReason: "Manual override",
      skipStatusEmails: true,
    });
    assert.fail("Should have thrown an error");
  } catch (error: unknown) {
    if (error instanceof AppError) {
      assert.equal(error.statusCode, 409);
      assert.equal(error.code, "payment_capture_failed");
      assert.equal(error.message, "Stripe capture failed. Booking completion has been held for manual review.");
    } else {
      throw error;
    }
  }

  assert.equal(retrieveCalled, true, "Expected stripe.paymentIntents.retrieve to be called");
  assert.equal(captureCalled, true, "Expected stripe.paymentIntents.capture to be called via request mock");

  const updatedBooking = harness.getBooking("booking-stripe-capture");
  assert.equal(updatedBooking?.payment_status, "capture_failed");
  assert.equal(updatedBooking?.payment_failure_reason, "Declined");
  assert.equal(updatedBooking?.payment_failure_code, "card_declined");

  Stripe.createNodeHttpClient().constructor.prototype.makeRequest = originalMakeRequest;
  if ((stripeClient as unknown as { getStripeServerClient: unknown }).getStripeServerClient !== originalGetStripeServerClient) {
      try {
          Object.defineProperty(stripeClient, "getStripeServerClient", { value: originalGetStripeServerClient, configurable: true });
      } catch {
          // Ignored
      }
  }

  harness.restore();
  delete process.env.STRIPE_SECRET_KEY;
});
