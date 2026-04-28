import assert from "node:assert/strict";
import test, { describe } from "node:test";

import {
  getCustomerBookingHeroState,
  getCustomerBookingProofSummary,
  getCustomerBookingTrustNotes,
} from "@/lib/customer-booking-detail-presenters";
import type { Booking } from "@/types/booking";
import type { Dispute } from "@/types/dispute";

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    bookingReference: "MM-123",
    listingId: "trip-1",
    flow: {
      source: "booking_request",
      listingId: "trip-1",
      moveRequestId: "move-1",
      offerId: "offer-1",
      bookingRequestId: "request-1",
      requestGroupId: null,
    },
    carrierId: "carrier-1",
    customerId: "customer-1",
    carrierBusinessName: "Harbour Haul",
    itemDescription: "3-seater sofa",
    itemCategory: "furniture",
    itemPhotoUrls: [],
    pickupAddress: "Newtown NSW",
    pickupSuburb: "Newtown",
    dropoffAddress: "Bondi NSW",
    dropoffSuburb: "Bondi",
    needsStairs: false,
    needsHelper: false,
    customerMoverPreference: "one_mover" as const,
    stairsLevelPickup: "none" as const,
    stairsLevelDropoff: "none" as const,
    liftAvailablePickup: false,
    liftAvailableDropoff: false,
    status: "pending",
    pricing: {
      basePriceCents: 8000,
      stairsFeeCents: 0,
      helperFeeCents: 0,
      secondMoverFeeCents: 0,
      adjustmentFeeCents: 0,
      platformFeeCents: 1200,
      gstCents: 920,
      totalPriceCents: 10120,
      carrierPayoutCents: 8000,
      platformCommissionCents: 1200,
      bookingFeeCents: 0,
    },
    paymentStatus: "authorized",
    pendingExpiresAt: "2026-04-22T08:00:00.000Z",
    createdAt: "2026-04-21T08:00:00.000Z",
    updatedAt: "2026-04-21T08:00:00.000Z",
    events: [],
    ...overrides,
  };
}

function makeDispute(overrides: Partial<Dispute> = {}): Dispute {
  return {
    id: "dispute-1",
    bookingId: "booking-1",
    raisedBy: "customer",
    raiserId: "customer-1",
    category: "damage",
    description: "Damage noted at handoff.",
    photoUrls: [],
    status: "open",
    createdAt: "2026-04-21T12:00:00.000Z",
    ...overrides,
  };
}

describe("customer booking hero state", () => {
  test("pending bookings explain that the response window is still live", () => {
    const hero = getCustomerBookingHeroState(makeBooking(), []);

    assert.equal(hero.title, "This booking is still inside the response window");
    assert.equal(hero.primaryAction.kind, "none");
    assert.equal(hero.showPendingExpiry, true);
  });

  test("delivered bookings push the customer toward receipt confirmation", () => {
    const hero = getCustomerBookingHeroState(
      makeBooking({
        status: "delivered",
        paymentStatus: "authorized",
        deliveredAt: "2026-04-21T11:00:00.000Z",
      }),
      [],
    );

    assert.equal(hero.primaryAction.kind, "confirm_receipt");
    assert.equal(hero.primaryAction.anchorId, "confirm-receipt");
    assert.match(hero.description, /72-hour dispute window/);
  });

  test("disputed bookings explain that payout remains held", () => {
    const hero = getCustomerBookingHeroState(
      makeBooking({
        status: "disputed",
        deliveredAt: "2026-04-21T11:00:00.000Z",
      }),
      [makeDispute()],
    );

    assert.equal(hero.tone, "error");
    assert.match(hero.title, /holding payout/i);
  });

  test("completed bookings distinguish customer confirmation from auto-release", () => {
    const customerConfirmed = getCustomerBookingHeroState(
      makeBooking({
        status: "completed",
        paymentStatus: "captured",
        customerConfirmedAt: "2026-04-21T12:30:00.000Z",
        completedAt: "2026-04-21T12:30:00.000Z",
      }),
      [],
    );
    const autoReleased = getCustomerBookingHeroState(
      makeBooking({
        status: "completed",
        paymentStatus: "captured",
        completedAt: "2026-04-24T12:30:00.000Z",
      }),
      [],
    );

    assert.match(customerConfirmed.title, /Receipt confirmed/);
    assert.match(autoReleased.description, /proof-backed release path/i);
  });

  test("retryable payment failures surface a retry action", () => {
    const hero = getCustomerBookingHeroState(
      makeBooking({
        paymentStatus: "failed",
        paymentFailureReason: "Your bank declined the hold.",
      }),
      [],
    );

    assert.equal(hero.primaryAction.kind, "retry_payment");
    assert.equal(hero.primaryAction.anchorId, "payment-recovery");
  });
});

describe("customer booking proof summary", () => {
  test("extracts delivery proof metadata from booking events", () => {
    const proof = getCustomerBookingProofSummary(
      makeBooking({
        status: "delivered",
        deliveryProofPhotoUrl: "proofs/delivery-fallback.jpg",
        events: [
          {
            id: "event-delivered",
            bookingId: "booking-1",
            actorRole: "carrier",
            actorUserId: "carrier-user-1",
            eventType: "status_delivered",
            createdAt: "2026-04-21T11:00:00.000Z",
            metadata: {
              deliveryProof: {
                photoUrl: "proofs/delivery-live.jpg",
                capturedAt: "2026-04-21T10:59:00.000Z",
                latitude: -33.8912,
                longitude: 151.2767,
                recipientConfirmed: true,
                exceptionCode: "damage",
                exceptionNote: "Scuff spotted on the rear leg.",
              },
            },
          },
        ],
      }),
    );

    assert.equal(proof.delivery?.photoUrl, "proofs/delivery-live.jpg");
    assert.equal(proof.delivery?.exceptionCode, "damage");
    assert.equal(proof.delivery?.exceptionNote, "Scuff spotted on the rear leg.");
    assert.equal(proof.delivery?.recipientConfirmed, true);
  });
});

describe("customer booking trust notes", () => {
  test("call out payout hold and dispute preservation when relevant", () => {
    const notes = getCustomerBookingTrustNotes(
      makeBooking({
        status: "disputed",
        paymentStatus: "authorized",
        pickupProofPhotoUrl: "proofs/pickup.jpg",
        deliveryProofPhotoUrl: "proofs/delivery.jpg",
      }),
      [makeDispute()],
    );

    assert.ok(
      notes.some((note) => note.includes("Proof is attached to this booking record")),
    );
    assert.ok(
      notes.some((note) => note.includes("dispute is open")),
    );
  });
});
