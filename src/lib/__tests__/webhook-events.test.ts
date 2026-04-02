import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";

import {
  applyPaymentIntentEvent,
  type BookingPaymentRepository,
} from "@/lib/stripe/payment-intent-events";

function makeEvent(
  type: Stripe.Event.Type,
  overrides?: Partial<Stripe.PaymentIntent>,
) {
  return {
    id: `evt_${type.replaceAll(".", "_")}`,
    object: "event",
    type,
    data: {
      object: {
        id: "pi_test",
        object: "payment_intent",
        status: "requires_capture",
        metadata: {
          bookingId: "booking-123",
        },
        ...overrides,
      },
    },
  } as Stripe.Event;
}

function createRepository(initialStatus: string | null = "pending") {
  const calls: string[] = [];
  const state = {
    booking: initialStatus === null ? null : { id: "booking-123", payment_status: initialStatus },
  };

  const repository: BookingPaymentRepository = {
    async getBooking() {
      calls.push("getBooking");
      return state.booking;
    },
    async markFailed({ failureReason }) {
      calls.push(`markFailed:${failureReason}`);
      if (!state.booking) {
        return false;
      }

      state.booking.payment_status = "failed";
      return true;
    },
    async markAuthorizationCancelled({ failureReason }) {
      calls.push(`markAuthorizationCancelled:${failureReason}`);
      if (!state.booking) {
        return false;
      }

      state.booking.payment_status = "authorization_cancelled";
      return true;
    },
    async markAuthorized() {
      calls.push("markAuthorized");
      if (!state.booking) {
        return false;
      }

      state.booking.payment_status = "authorized";
      return true;
    },
    async markCaptured() {
      calls.push("markCaptured");
      if (!state.booking) {
        return false;
      }

      state.booking.payment_status = "captured";
      return true;
    },
  };

  return { calls, repository, state };
}

test("payment-intent events without booking metadata are ignored safely", async () => {
  const { repository, calls } = createRepository();
  const result = await applyPaymentIntentEvent(
    makeEvent("payment_intent.succeeded", { metadata: {} }),
    { repository },
  );

  assert.equal(result.outcome, "missing_booking_metadata");
  assert.deepEqual(calls, []);
});

test("payment failure marks the booking as failed", async () => {
  const { repository, state } = createRepository();
  const result = await applyPaymentIntentEvent(
    makeEvent("payment_intent.payment_failed", {
      last_payment_error: {
        message: "Card declined",
        decline_code: "card_declined",
      } as Stripe.PaymentIntent.LastPaymentError,
    }),
    { repository },
  );

  assert.equal(result.outcome, "marked_failed");
  assert.equal(state.booking?.payment_status, "failed");
});

test("capturable updates mark the booking as authorized", async () => {
  const { repository, state } = createRepository("pending");
  const result = await applyPaymentIntentEvent(
    makeEvent("payment_intent.amount_capturable_updated"),
    { repository },
  );

  assert.equal(result.outcome, "marked_authorized");
  assert.equal(state.booking?.payment_status, "authorized");
});

test("capturable updates skip already captured bookings", async () => {
  const { repository, calls } = createRepository("captured");
  const result = await applyPaymentIntentEvent(
    makeEvent("payment_intent.amount_capturable_updated"),
    { repository },
  );

  assert.equal(result.outcome, "skipped_already_captured");
  assert.deepEqual(calls, ["getBooking"]);
});

test("payment succeeded marks the booking captured and clears retry state", async () => {
  const { repository, state } = createRepository("authorized");
  const result = await applyPaymentIntentEvent(
    makeEvent("payment_intent.succeeded", { status: "succeeded" }),
    { repository },
  );

  assert.equal(result.outcome, "marked_captured");
  assert.equal(state.booking?.payment_status, "captured");
});
