import assert from "node:assert/strict";
import test from "node:test";

import { getProofSummary } from "@/lib/booking-proof-ui";
import type { Booking } from "@/types/booking";

function makeBooking(overrides: Partial<Booking>): Booking {
  return {
    id: "booking-1",
    listingId: "listing-1",
    customerId: "customer-1",
    carrierId: "carrier-1",
    status: "confirmed",
    itemDescription: "Sofa",
    pickupAddress: "1 Origin St, Sydney",
    dropoffAddress: "2 Dest Ave, Sydney",
    pricing: {
      basePriceCents: 10000,
      platformFeeCents: 1500,
      gstCents: 1150,
      totalPriceCents: 12650,
      carrierPayoutCents: 8500,
      bookingFeeCents: 0,
    },
    pickupProofPhotoUrl: null,
    deliveryProofPhotoUrl: null,
    ...overrides,
  } as Booking;
}

test("getProofSummary: no proof captured, booking is pending", () => {
  const booking = makeBooking({ status: "pending" });
  const { pickupState, deliveryState } = getProofSummary(booking);
  assert.equal(pickupState, "Pickup proof still needed");
  assert.equal(deliveryState, "Delivery proof still needed");
});

test("getProofSummary: pickup proof captured, delivery still needed", () => {
  const booking = makeBooking({
    status: "picked_up",
    pickupProofPhotoUrl: "proofs/pickup.jpg",
  });
  const { pickupState, deliveryState } = getProofSummary(booking);
  assert.equal(pickupState, "Pickup proof captured");
  assert.equal(deliveryState, "Delivery proof still needed");
});

test("getProofSummary: pickup missing after picked_up", () => {
  const booking = makeBooking({
    status: "picked_up",
    pickupProofPhotoUrl: null,
  });
  const { pickupState, deliveryState } = getProofSummary(booking);
  assert.equal(pickupState, "Pickup proof missing");
  assert.equal(deliveryState, "Delivery proof still needed");
});

test("getProofSummary: both proofs captured on delivered booking", () => {
  const booking = makeBooking({
    status: "delivered",
    pickupProofPhotoUrl: "proofs/pickup.jpg",
    deliveryProofPhotoUrl: "proofs/delivery.jpg",
  });
  const { pickupState, deliveryState } = getProofSummary(booking);
  assert.equal(pickupState, "Pickup proof captured");
  assert.equal(deliveryState, "Delivery proof captured");
});
