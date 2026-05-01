import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultCustomerFlowAccess,
  createDefaultCustomerFlowRoute,
  createDefaultCustomerFlowTiming,
  createMockCustomerFlowViewModel,
  getSelectedCustomerFlowItem,
  presentLiveCustomerFlowMatches,
  presentCustomerFlowMatches,
  validateCustomerFlowDraft,
} from "@/components/customer/stitch-flow-contracts";
import type { LiveMoveOffer } from "@/components/customer/move-live-data";

test("creates a mock customer flow view model with the Stitch replacement seams", () => {
  const viewModel = createMockCustomerFlowViewModel();

  assert.equal(viewModel.mode, "mock");
  assert.ok(viewModel.items.length >= 12);
  assert.ok(viewModel.dateOptions.length >= 4);
  assert.equal(viewModel.timeWindows.length, 4);
  assert.equal(viewModel.matches.length, 3);
  assert.equal(viewModel.activeBooking.proofRequired, true);
  assert.equal(viewModel.activeBooking.receiptReady, true);
});

test("selected item presenter preserves quantity, photo state, and variant pricing", () => {
  const item = getSelectedCustomerFlowItem({
    itemId: "item-sofa-01",
    variantId: "sofa-chaise",
    quantity: 2,
    photoAttached: true,
  });

  assert.equal(item.itemId, "item-sofa-01");
  assert.equal(item.variantId, "sofa-chaise");
  assert.equal(item.quantity, 2);
  assert.equal(item.photoStatus, "mock_attached");
  assert.equal(item.helperRecommended, true);
  assert.ok(item.basePriceCents > 0);
});

test("draft validation blocks missing route and invalid quantity before matching", () => {
  const route = createDefaultCustomerFlowRoute();
  const access = createDefaultCustomerFlowAccess();
  const timing = createDefaultCustomerFlowTiming();
  const selectedItem = getSelectedCustomerFlowItem({
    itemId: "item-sofa-01",
    quantity: 0,
  });

  const result = validateCustomerFlowDraft({
    route: { ...route, pickup: "" },
    access,
    timing,
    selectedItem: { ...selectedItem, quantity: 0 },
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /Pickup is required/);
  assert.match(result.errors.join(" "), /Quantity must be at least one/);
});

test("match presenter carries deterministic explanation and fixed price", () => {
  const matches = presentCustomerFlowMatches();
  const [topMatch] = matches;

  assert.ok(topMatch);
  assert.match(topMatch.matchExplanation, /already travelling this corridor/);
  assert.equal(topMatch.price.bookingFeeCents, 0);
  assert.ok(topMatch.price.totalCents > topMatch.price.basePriceCents);
});

test("live offer presenter maps backend offers into Stitch cards", () => {
  const liveOffers = [
    {
      offer: {
        id: "11111111-1111-4111-8111-111111111111",
        moveRequestId: "22222222-2222-4222-8222-222222222222",
        listingId: "33333333-3333-4333-8333-333333333333",
        carrierId: "44444444-4444-4444-8444-444444444444",
        status: "active",
        matchClass: "direct",
        fitConfidence: "likely_fits",
        matchExplanation: "Daniel already runs this route on Saturday morning.",
        rankingScore: 94,
        pricing: {
          basePriceCents: 7400,
          stairsFeeCents: 1200,
          helperFeeCents: 0,
          secondMoverFeeCents: 0,
          adjustmentFeeCents: 0,
          platformFeeCents: 1110,
          gstCents: 971,
          totalPriceCents: 10681,
          carrierPayoutCents: 7490,
          platformCommissionCents: 1110,
          bookingFeeCents: 0,
        },
        createdAt: "2026-04-26T00:00:00.000Z",
      },
      trip: {
        id: "33333333-3333-4333-8333-333333333333",
        flow: { source: "offer", listingId: "33333333-3333-4333-8333-333333333333" },
        carrier: {
          id: "44444444-4444-4444-8444-444444444444",
          userId: "carrier-user",
          businessName: "Daniel K.",
          contactName: "Daniel",
          phone: "0400000000",
          email: "daniel@example.com",
          isVerified: true,
          verificationStatus: "verified",
          activationStatus: "active",
          abnVerified: true,
          insuranceVerified: true,
          averageRating: 4.9,
          ratingCount: 23,
          serviceSuburbs: ["Newtown", "Bondi"],
          stripeOnboardingComplete: true,
        },
        vehicle: {
          id: "vehicle-1",
          carrierId: "44444444-4444-4444-8444-444444444444",
          type: "van",
          maxVolumeM3: 8,
          maxWeightKg: 700,
          hasTailgate: false,
          hasBlankets: true,
          hasStraps: true,
          photoUrls: [],
          regoPlate: "MOVE42",
          isActive: true,
        },
        route: {
          originSuburb: "Newtown",
          destinationSuburb: "Bondi",
          waypoints: [],
          via: [],
          label: "Newtown to Bondi",
        },
        tripDate: "2026-04-26",
        timeWindow: "morning",
        spaceSize: "L",
        availableVolumeM3: 8,
        availableWeightKg: 700,
        detourRadiusKm: 10,
        detourTolerance: "standard",
        priceCents: 7400,
        minimumBasePriceCents: 7400,
        dedicatedEstimateCents: 19000,
        savingsPct: 45,
        remainingCapacityPct: 72,
        isReturnTrip: false,
        rules: {
          accepts: ["furniture"],
          stairsOk: true,
          stairsExtraCents: 1200,
          helperAvailable: true,
          helperExtraCents: 0,
          handlingPolicy: "solo_customer_help",
          stairsLowCents: 600,
          stairsMediumCents: 1200,
          stairsHighCents: 1800,
          secondMoverExtraCents: 0,
        },
      },
    },
  ] as LiveMoveOffer[];

  const [card] = presentLiveCustomerFlowMatches(liveOffers);

  assert.ok(card);
  assert.equal(card.source, "live");
  assert.equal(card.offerId, liveOffers[0].offer.id);
  assert.equal(card.listingId, liveOffers[0].offer.listingId);
  assert.equal(card.price.totalCents, 10681);
  assert.match(card.match.driverName, /Daniel/);
  assert.match(card.matchExplanation, /already runs this route/);
});
