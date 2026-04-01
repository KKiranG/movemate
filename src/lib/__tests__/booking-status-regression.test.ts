import assert from "node:assert/strict";
import test from "node:test";

import { updateBookingStatusForActor } from "@/lib/data/bookings";
import { AppError } from "@/lib/errors";
import {
  createBookingRow,
  createCarrierRow,
  createCustomerRow,
  createDisputeRow,
  installSupabaseRestHarness,
} from "@/lib/__tests__/helpers/supabase-rest-harness";

test("unresolved disputes block disputed bookings from completing", async () => {
  const harness = installSupabaseRestHarness({
    bookings: [
      createBookingRow({
        id: "booking-disputed-open",
        status: "disputed",
        payment_status: "authorized",
      }),
    ],
    carriers: [createCarrierRow()],
    customers: [createCustomerRow()],
    disputes: [
      createDisputeRow({
        id: "dispute-open",
        booking_id: "booking-disputed-open",
        status: "open",
      }),
    ],
  });

  try {
    await assert.rejects(
      updateBookingStatusForActor({
        userId: "admin-user-1",
        bookingId: "booking-disputed-open",
        nextStatus: "completed",
        actorRole: "admin",
        skipStatusEmails: true,
      }),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 409 &&
        error.code === "dispute_not_resolved",
    );

    assert.equal(harness.getBooking("booking-disputed-open")?.status, "disputed");
    assert.equal(harness.state.bookingEvents.length, 0);
    assert.equal(harness.state.rpcCalls.length, 0);
    assert.equal(
      harness.state.requests.some(
        (request) =>
          request.method === "PATCH" && request.pathname === "/rest/v1/bookings",
      ),
      false,
    );
  } finally {
    harness.restore();
  }
});

test("resolved disputes allow the disputed booking to complete and recalculate capacity", async () => {
  const harness = installSupabaseRestHarness({
    bookings: [
      createBookingRow({
        id: "booking-disputed-resolved",
        status: "disputed",
        payment_status: "captured",
      }),
    ],
    carriers: [createCarrierRow()],
    customers: [createCustomerRow()],
    disputes: [
      createDisputeRow({
        id: "dispute-resolved",
        booking_id: "booking-disputed-resolved",
        status: "resolved",
      }),
    ],
  });

  try {
    const booking = await updateBookingStatusForActor({
      userId: "admin-user-1",
      bookingId: "booking-disputed-resolved",
      nextStatus: "completed",
      actorRole: "admin",
      skipStatusEmails: true,
    });

    assert.equal(booking.status, "completed");
    assert.equal(booking.paymentStatus, "captured");
    assert.ok(booking.completedAt);
    assert.ok(booking.customerConfirmedAt);
    assert.equal(harness.getBooking("booking-disputed-resolved")?.status, "completed");
    assert.ok(harness.getBooking("booking-disputed-resolved")?.completed_at);
    assert.equal(harness.state.bookingEvents.at(-1)?.event_type, "status_completed");
    assert.deepEqual(harness.state.rpcCalls, [
      {
        name: "recalculate_listing_capacity",
        args: {
          p_listing_id: "listing-1",
        },
      },
    ]);
  } finally {
    harness.restore();
  }
});
