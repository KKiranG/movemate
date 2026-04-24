import assert from "node:assert/strict";
import test from "node:test";

import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";

test("booking breakdown keeps the commission identity intact", () => {
  const breakdown = calculateBookingBreakdown({
    basePriceCents: 19_999,
    needsStairs: true,
    stairsExtraCents: 2_500,
    needsHelper: true,
    helperExtraCents: 1_500,
  });

  assert.equal(breakdown.stairsFeeCents, 2_500);
  assert.equal(breakdown.helperFeeCents, 1_500);
  assert.equal(breakdown.platformFeeCents, 3_000);
  assert.equal(breakdown.gstCents, 2_700);
  assert.equal(breakdown.platformCommissionCents, 3_000);
  assert.equal(
    breakdown.totalPriceCents,
    breakdown.carrierPayoutCents +
      breakdown.platformCommissionCents +
      breakdown.gstCents,
  );
  assert.equal(breakdown.carrierPayoutCents, 23_999);
});

test("booking breakdown only commissions the base price", () => {
  const breakdown = calculateBookingBreakdown({
    basePriceCents: 8_500,
    needsStairs: false,
    stairsExtraCents: 12_000,
    needsHelper: false,
    helperExtraCents: 15_000,
  });

  assert.equal(breakdown.stairsFeeCents, 0);
  assert.equal(breakdown.helperFeeCents, 0);
  assert.equal(breakdown.platformFeeCents, 1_275);
  assert.equal(breakdown.gstCents, 978);
  assert.equal(breakdown.platformCommissionCents, 1_275);
  assert.equal(breakdown.carrierPayoutCents, 8_500);
  assert.equal(breakdown.totalPriceCents, 10_753);
});

test("booking breakdown enforces the minimum base price floor before fees", () => {
  const breakdown = calculateBookingBreakdown({
    basePriceCents: 3_000,
    minimumBasePriceCents: 5_000,
    needsStairs: true,
    stairsExtraCents: 1_200,
    needsHelper: true,
    helperExtraCents: 2_000,
  });

  assert.equal(breakdown.basePriceCents, 5_000);
  assert.equal(breakdown.platformFeeCents, 750);
  assert.equal(breakdown.carrierPayoutCents, 8_200);
  assert.equal(breakdown.gstCents, 895);
  assert.equal(breakdown.totalPriceCents, 9_845);
});

test("booking breakdown carries a structured adjustment without changing base commission", () => {
  const breakdown = calculateBookingBreakdown({
    basePriceCents: 10_000,
    needsStairs: true,
    stairsExtraCents: 1_500,
    needsHelper: false,
    helperExtraCents: 0,
    adjustmentFeeCents: 3_000,
  });

  assert.equal(breakdown.adjustmentFeeCents, 3_000);
  assert.equal(breakdown.platformFeeCents, 1_500);
  assert.equal(breakdown.platformCommissionCents, 1_500);
  assert.equal(breakdown.carrierPayoutCents, 14_500);
  assert.equal(breakdown.gstCents, 1_600);
  assert.equal(breakdown.totalPriceCents, 17_600);
});

test("automatic detour pricing stays blocked pending a founder decision", () => {
  assert.throws(
    () =>
      calculateBookingBreakdown({
        basePriceCents: 12_000,
        needsStairs: false,
        stairsExtraCents: 0,
        needsHelper: false,
        helperExtraCents: 0,
        detourAdjustmentCents: 900,
      }),
    /Automatic detour pricing is blocked/,
  );
});
