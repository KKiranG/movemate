import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultCustomerFlowAccess,
  createDefaultCustomerFlowRoute,
  createDefaultCustomerFlowTiming,
  createMockCustomerFlowViewModel,
  getSelectedCustomerFlowItem,
  presentCustomerFlowMatches,
  validateCustomerFlowDraft,
} from "@/components/customer/stitch-flow-contracts";

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
