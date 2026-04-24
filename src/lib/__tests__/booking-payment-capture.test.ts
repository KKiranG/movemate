import assert from "node:assert/strict";
import test from "node:test";

import { updateBookingStatusForActor } from "@/lib/data/bookings";
import {
  createBookingRow,
  createCarrierRow,
  createCustomerRow,
  installSupabaseRestHarness,
} from "@/lib/__tests__/helpers/supabase-rest-harness";

test("booking completion no longer performs first payment capture", async () => {
  const harness = installSupabaseRestHarness({
    bookings: [
      createBookingRow({
        id: "booking-stripe-capture",
        status: "delivered",
        payment_status: "authorized",
        stripe_payment_intent_id: "pi_mock_123",
      }),
    ],
    carriers: [createCarrierRow()],
    customers: [createCustomerRow()],
  });

  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  await updateBookingStatusForActor({
    userId: "admin-user-1",
    bookingId: "booking-stripe-capture",
    nextStatus: "completed",
    actorRole: "admin",
    adminReason: "Manual override",
    skipStatusEmails: true,
  });

  const updatedBooking = harness.getBooking("booking-stripe-capture");
  assert.equal(updatedBooking?.status, "completed");
  assert.equal(updatedBooking?.payment_status, "authorized");
  assert.equal(updatedBooking?.payment_failure_reason, null);
  assert.equal(updatedBooking?.payment_failure_code, null);

  harness.restore();
  delete process.env.STRIPE_SECRET_KEY;
});
