import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCarrierPayoutHolds,
  buildCarrierTodaySnapshot,
} from "@/lib/data/bookings";
import type { Booking } from "@/types/booking";
import type { Trip } from "@/types/trip";

function createTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: overrides.id ?? "trip-1",
    flow:
      overrides.flow ?? {
        source: "legacy_listing",
        listingId: overrides.id ?? "trip-1",
        moveRequestId: null,
        offerId: null,
      },
    carrier: overrides.carrier ?? ({} as Trip["carrier"]),
    vehicle: overrides.vehicle ?? ({} as Trip["vehicle"]),
    route:
      overrides.route ?? {
        originSuburb: "Marrickville",
        destinationSuburb: "Surry Hills",
        waypoints: [],
        via: [],
        polyline: null,
        label: "Marrickville -> Surry Hills",
      },
    tripDate: overrides.tripDate ?? "2026-04-05",
    timeWindow: overrides.timeWindow ?? "morning",
    spaceSize: overrides.spaceSize ?? "M",
    availableVolumeM3: overrides.availableVolumeM3 ?? 5,
    availableWeightKg: overrides.availableWeightKg ?? 100,
    detourRadiusKm: overrides.detourRadiusKm ?? 10,
    detourTolerance: overrides.detourTolerance ?? "standard",
    priceCents: overrides.priceCents ?? 10000,
    minimumBasePriceCents: overrides.minimumBasePriceCents ?? 1000,
    suggestedPriceCents: overrides.suggestedPriceCents ?? 10000,
    dedicatedEstimateCents: overrides.dedicatedEstimateCents ?? 16000,
    savingsPct: overrides.savingsPct ?? 35,
    remainingCapacityPct: overrides.remainingCapacityPct ?? 50,
    isReturnTrip: overrides.isReturnTrip ?? false,
    status: overrides.status ?? "active",
    publishAt: overrides.publishAt ?? "2026-04-01T00:00:00.000Z",
    rules:
      overrides.rules ?? {
        accepts: ["furniture"],
        stairsOk: true,
        stairsExtraCents: 0,
        helperAvailable: true,
        helperExtraCents: 0,
      },
  };
}

function createBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: overrides.id ?? "booking-1",
    bookingReference: overrides.bookingReference ?? "MOV-001",
    listingId: overrides.listingId ?? "trip-1",
    flow:
      overrides.flow ?? {
        source: "legacy_booking",
        listingId: overrides.listingId ?? "trip-1",
        moveRequestId: null,
        offerId: null,
        bookingRequestId: null,
        requestGroupId: null,
      },
    carrierId: overrides.carrierId ?? "carrier-1",
    customerId: overrides.customerId ?? "customer-1",
    itemDescription: overrides.itemDescription ?? "Desk",
    itemCategory: overrides.itemCategory ?? "furniture",
    itemPhotoUrls: overrides.itemPhotoUrls ?? [],
    pickupAddress: overrides.pickupAddress ?? "1 Pickup St",
    dropoffAddress: overrides.dropoffAddress ?? "2 Dropoff St",
    needsStairs: overrides.needsStairs ?? false,
    needsHelper: overrides.needsHelper ?? false,
    status: overrides.status ?? "pending",
    pricing:
      overrides.pricing ?? {
        basePriceCents: 10000,
        stairsFeeCents: 0,
        helperFeeCents: 0,
        adjustmentFeeCents: 0,
        platformFeeCents: 1500,
        gstCents: 1150,
        bookingFeeCents: 0,
        totalPriceCents: 12650,
        carrierPayoutCents: 10000,
        platformCommissionCents: 1500,
      },
    paymentStatus: overrides.paymentStatus ?? "authorized",
    pendingExpiresAt: overrides.pendingExpiresAt ?? null,
    deliveredAt: overrides.deliveredAt ?? null,
    customerConfirmedAt: overrides.customerConfirmedAt ?? null,
    completedAt: overrides.completedAt ?? null,
    createdAt: overrides.createdAt ?? "2026-04-01T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-04-01T00:00:00.000Z",
    events: overrides.events ?? [],
  };
}

test("buildCarrierPayoutHolds explains missing step, next action, and CTA", () => {
  const holds = buildCarrierPayoutHolds(
    [
      createBooking({
        id: "booking-confirmed",
        bookingReference: "MOV-100",
        status: "confirmed",
      }),
      createBooking({
        id: "booking-delivered",
        bookingReference: "MOV-200",
        status: "delivered",
      }),
      createBooking({
        id: "booking-capture-failed",
        bookingReference: "MOV-300",
        status: "completed",
        paymentStatus: "capture_failed",
      }),
    ],
    false,
  );

  assert.equal(holds.length, 5);
  assert.equal(holds[0]?.bookingReference, "MOV-300");
  assert.match(holds[0]?.missingStep ?? "", /Manual capture review required/);
  assert.match(holds[0]?.nextAction ?? "", /ops review/i);
  assert.equal(holds[0]?.ctaHref, "/carrier/payouts");

  const setupHold = holds.find((hold) => hold.missingStep === "Finish payout setup");
  assert.ok(setupHold);
  assert.equal(setupHold?.ctaLabel, "Finish payout setup");
  assert.match(setupHold?.explanation ?? "", /cannot release funds/i);
});

test("buildCarrierTodaySnapshot scores active trips into healthy, watch, and risky tiers", () => {
  const now = new Date("2026-04-05T10:00:00.000Z");
  const payoutHolds = buildCarrierPayoutHolds(
    [
      createBooking({
        id: "pending-risk",
        listingId: "trip-risky",
        bookingReference: "MOV-401",
        status: "pending",
        pendingExpiresAt: "2026-04-05T10:30:00.000Z",
      }),
      createBooking({
        id: "delivered-risk",
        listingId: "trip-risky",
        bookingReference: "MOV-402",
        status: "delivered",
        deliveredAt: "2026-04-04T08:00:00.000Z",
      }),
      createBooking({
        id: "pending-watch",
        listingId: "trip-watch",
        bookingReference: "MOV-403",
        status: "pending",
        pendingExpiresAt: "2026-04-05T10:45:00.000Z",
      }),
    ],
    false,
  );

  const snapshot = buildCarrierTodaySnapshot({
    bookings: [
      createBooking({
        id: "pending-risk",
        listingId: "trip-risky",
        bookingReference: "MOV-401",
        status: "pending",
        pendingExpiresAt: "2026-04-05T10:30:00.000Z",
      }),
      createBooking({
        id: "delivered-risk",
        listingId: "trip-risky",
        bookingReference: "MOV-402",
        status: "delivered",
        deliveredAt: "2026-04-04T08:00:00.000Z",
      }),
      createBooking({
        id: "pending-watch",
        listingId: "trip-watch",
        bookingReference: "MOV-403",
        status: "pending",
        pendingExpiresAt: "2026-04-05T10:45:00.000Z",
      }),
      createBooking({
        id: "completed-healthy",
        listingId: "trip-healthy",
        bookingReference: "MOV-404",
        status: "completed",
        paymentStatus: "captured",
      }),
    ],
    trips: [
      createTrip({
        id: "trip-risky",
        route: {
          originSuburb: "Newtown",
          destinationSuburb: "Bondi",
          waypoints: [],
          via: [],
          polyline: null,
          label: "Newtown -> Bondi",
        },
        tripDate: "2026-04-05",
      }),
      createTrip({
        id: "trip-watch",
        route: {
          originSuburb: "Parramatta",
          destinationSuburb: "Redfern",
          waypoints: [],
          via: [],
          polyline: null,
          label: "Parramatta -> Redfern",
        },
        tripDate: "2026-04-06",
      }),
      createTrip({
        id: "trip-healthy",
        route: {
          originSuburb: "Ryde",
          destinationSuburb: "Chatswood",
          waypoints: [],
          via: [],
          polyline: null,
          label: "Ryde -> Chatswood",
        },
        tripDate: "2026-04-07",
      }),
    ],
    payoutSetupReady: false,
    payoutHolds,
    now,
  });

  assert.equal(snapshot.todayActions.find((action) => action.key === "pending-decisions")?.count, 2);
  assert.equal(snapshot.todayActions.find((action) => action.key === "payout-blockers")?.count, payoutHolds.length);

  const [risky, watch, healthy] = snapshot.tripHealth;

  assert.equal(risky?.tripId, "trip-risky");
  assert.equal(risky?.score, 10);
  assert.equal(risky?.tier, "Risky");

  assert.equal(watch?.tripId, "trip-watch");
  assert.equal(watch?.score, 70);
  assert.equal(watch?.tier, "Watch");

  assert.equal(healthy?.tripId, "trip-healthy");
  assert.equal(healthy?.score, 85);
  assert.equal(healthy?.tier, "Healthy");
});
